'use client';
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { toPng } from 'html-to-image';

export default function Mermaid({ chart }) {
  const containerRef = useRef(null);
  const [svgCode, setSvgCode] = useState('');
  const [error, setError] = useState(false);
  const [sanitizedStr, setSanitizedStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!chart) return;

    const isDark = document.querySelector('.dark') !== null ||
      document.body.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: isDark ? {
        // ── Dark Mode Palette (Claude-inspired) ──
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
        fontSize: '13px',
        primaryColor: '#3b3f51',
        primaryTextColor: '#e8eaed',
        primaryBorderColor: '#5a5f7a',
        lineColor: '#7c82a1',
        secondaryColor: '#2d3142',
        tertiaryColor: '#1e2030',
        background: '#1a1b2e',
        mainBkg: '#2d3142',
        nodeBorder: '#5a5f7a',
        clusterBkg: '#1e2030',
        clusterBorder: '#3b3f51',
        titleColor: '#e8eaed',
        edgeLabelBackground: '#2d3142',
        nodeTextColor: '#e8eaed',
      } : {
        // ── Light Mode Palette (Clean, premium) ──
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
        fontSize: '13px',
        primaryColor: '#e8f0fe',
        primaryTextColor: '#1a1a2e',
        primaryBorderColor: '#b4c7e7',
        lineColor: '#6b7fa3',
        secondaryColor: '#f0f4ff',
        tertiaryColor: '#fafbff',
        background: '#ffffff',
        mainBkg: '#e8f0fe',
        nodeBorder: '#b4c7e7',
        clusterBkg: '#f5f7ff',
        clusterBorder: '#d0d8ef',
        titleColor: '#1a1a2e',
        edgeLabelBackground: '#ffffff',
        nodeTextColor: '#1a1a2e',
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 20,
        nodeSpacing: 50,
        rankSpacing: 60,
        diagramPadding: 20,
        useMaxWidth: true,
      },
      sequence: {
        diagramMarginX: 30,
        diagramMarginY: 20,
        actorMargin: 60,
        noteMargin: 15,
        messageFontSize: 13,
        useMaxWidth: true,
      },
      securityLevel: 'loose',
    });

    const renderChart = async () => {
      let sanitized = chart;

      // ── Sanitize common AI hallucinations ──
      sanitized = sanitized.replace(/-->\s*\|(.*?)\|\s*>/g, '-->|$1|');
      sanitized = sanitized.replace(/<html.*?>.*?<div.*?>/is, '');
      sanitized = sanitized.replace(/<\/div>.*?<\/html>/is, '');
      sanitized = sanitized.replace(/<script.*?>.*?<\/script>/is, '');
      
      // Fix single letter + space + number node IDs
      sanitized = sanitized.replace(/\b([A-Za-z])\s+(\d+)\b/g, '$1$2');
      // Fix unescaped brackets
      sanitized = sanitized.replace(/([A-Za-z0-9_]+)\s+([\[\(\{])/g, '$1$2');
      // Remove invalid notes in flowcharts
      if (sanitized.toLowerCase().includes('flowchart') || sanitized.toLowerCase().includes('graph')) {
        sanitized = sanitized.replace(/^[ \t]*note\s+(right|left|top|bottom|over|of|for).*$/gim, '');
      }
      
      // Process line-by-line to handle complex, nested shape labels safely (greedy matching)
      const lines = sanitized.split('\n');
      const processedLines = lines.map(line => {
        const trimmed = line.trim();
        // Skip comments, subgraphs, blocks, classes, styles
        if (trimmed.startsWith('%%') || trimmed.startsWith('subgraph') || trimmed.startsWith('end') || trimmed.startsWith('classDef') || trimmed.startsWith('style') || trimmed.startsWith('class ') || trimmed.startsWith('click')) {
          return line;
        }

        const hasConnection = line.includes('-->') || line.includes('---') || line.includes('==>') || line.includes('-.->') || line.includes('-.-');
        if (hasConnection) {
          return line;
        }

        let newLine = line;

        // 1. Stadium shape: ID([Text])
        const stadiumRegex = /^([ \t]*)([a-zA-Z0-9_-]+)\(\[\s*(?!"|#)(.*)\s*\]\)[ \t]*$/;
        if (stadiumRegex.test(newLine)) {
          return newLine.replace(stadiumRegex, (match, indent, id, inner) => {
            if (inner.trim().startsWith('"')) return match;
            const escaped = inner.replace(/"/g, '\\"');
            return `${indent}${id}(["${escaped}"])`;
          });
        }

        // 2. Hexagon shape: ID{{Text}}
        const hexagonRegex = /^([ \t]*)([a-zA-Z0-9_-]+)\{\{\s*(?!"|#)(.*)\s*\}\}[ \t]*$/;
        if (hexagonRegex.test(newLine)) {
          return newLine.replace(hexagonRegex, (match, indent, id, inner) => {
            if (inner.trim().startsWith('"')) return match;
            const escaped = inner.replace(/"/g, '\\"');
            return `${indent}${id}{{"${escaped}"}}`;
          });
        }

        // 3. Diamond shape: ID{Text}
        const diamondRegex = /^([ \t]*)([a-zA-Z0-9_-]+)\{\s*(?!"|#)(.*)\s*\}[ \t]*$/;
        if (diamondRegex.test(newLine)) {
          return newLine.replace(diamondRegex, (match, indent, id, inner) => {
            if (inner.trim().startsWith('"')) return match;
            const escaped = inner.replace(/"/g, '\\"');
            return `${indent}${id}{"${escaped}"}`;
          });
        }

        // 4. Parallelogram shape: ID[/Text/]
        const paraRegex = /^([ \t]*)([a-zA-Z0-9_-]+)\[\/\s*(?!"|#)(.*)\s*\/\][ \t]*$/;
        if (paraRegex.test(newLine)) {
          return newLine.replace(paraRegex, (match, indent, id, inner) => {
            if (inner.trim().startsWith('"')) return match;
            const escaped = inner.replace(/"/g, '\\"');
            return `${indent}${id}[/"${escaped}"/]`;
          });
        }

        // 5. Rectangular shape: ID[Text]
        const rectRegex = /^([ \t]*)([a-zA-Z0-9_-]+)\[\s*(?!"|#)(.*)\s*\][ \t]*$/;
        if (rectRegex.test(newLine)) {
          return newLine.replace(rectRegex, (match, indent, id, inner) => {
            if (inner.trim().startsWith('"')) return match;
            const escaped = inner.replace(/"/g, '\\"');
            return `${indent}${id}["${escaped}"]`;
          });
        }

        // 6. Rounded shape: ID(Text)
        const roundRegex = /^([ \t]*)([a-zA-Z0-9_-]+)\(\s*(?!"|#)(.*)\s*\)[ \t]*$/;
        if (roundRegex.test(newLine)) {
          return newLine.replace(roundRegex, (match, indent, id, inner) => {
            if (inner.trim().startsWith('"')) return match;
            const escaped = inner.replace(/"/g, '\\"');
            return `${indent}${id}("${escaped}")`;
          });
        }

        return newLine;
      });

      sanitized = processedLines.join('\n').trim();
      setSanitizedStr(sanitized);

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, sanitized);
        
        // Intercept silent syntax error SVGs rendered by Mermaid instead of throwing exceptions
        if (svg.includes('Syntax error in text') || svg.includes('mermaid-error-svg') || svg.includes('error-icon')) {
          setError(true);
        } else {
          // Post-process SVG for premium look
          let enhancedSvg = svg;
          // Add subtle drop shadow to nodes
          if (!enhancedSvg.includes('<defs>')) {
            enhancedSvg = enhancedSvg.replace('<svg', '<svg><defs></defs>').replace('</svg>', '</svg>');
          }
          setSvgCode(enhancedSvg);
          setError(false);
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
        setError(true);
      }
    };

    renderChart();
  }, [chart]);

  const downloadPNG = () => {
    if (!containerRef.current) return;
    const isDark = document.querySelector('.dark') !== null ||
      document.body.classList.contains('dark');

    toPng(containerRef.current, {
      backgroundColor: isDark ? '#1a1b2e' : '#ffffff',
      pixelRatio: 3,
      style: {
        margin: '0',
        boxShadow: 'none',
        borderRadius: '0',
        padding: '32px',
      },
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `diagram-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to generate PNG:', err);
      });
  };

  const copySvg = () => {
    navigator.clipboard.writeText(svgCode).then(() => {
      // Brief visual feedback handled by CSS
    });
  };

  if (error) {
    return (
      <div className="mermaid-error-card">
        <div className="mermaid-error-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>Diagram Render Error</span>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          The AI generated invalid Mermaid syntax. Try rephrasing your request.
        </p>
        <details style={{ marginTop: '8px' }}>
          <summary style={{ fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}>Show raw code</summary>
          <pre className="mermaid-error-code">{sanitizedStr}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className={`mermaid-card ${isFullscreen ? 'mermaid-fullscreen' : ''}`}>
      {/* Header bar */}
      <div className="mermaid-card-header">
        <div className="mermaid-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span>Diagram</span>
        </div>
        <div className="mermaid-card-actions">
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="mermaid-action-btn" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            )}
          </button>
          <button onClick={copySvg} className="mermaid-action-btn" title="Copy SVG">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button onClick={downloadPNG} className="mermaid-action-btn mermaid-download-btn" title="Download PNG">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>PNG</span>
          </button>
        </div>
      </div>

      {/* Diagram canvas */}
      <div className="mermaid-canvas-wrap">
        <div
          ref={containerRef}
          className="mermaid-canvas"
          dangerouslySetInnerHTML={{ __html: svgCode }}
        />
      </div>

      {/* Fullscreen overlay backdrop */}
      {isFullscreen && (
        <div className="mermaid-fullscreen-backdrop" onClick={() => setIsFullscreen(false)} />
      )}
    </div>
  );
}
