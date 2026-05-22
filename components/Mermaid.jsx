'use client';
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

import { toPng } from 'html-to-image';

export default function Mermaid({ chart }) {
  const containerRef = useRef(null);
  const [svgCode, setSvgCode] = useState('');
  const [error, setError] = useState(false);
  const [sanitizedStr, setSanitizedStr] = useState('');

  useEffect(() => {
    if (!chart) return;
    
    const isDark = document.body.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      themeVariables: {
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: '14px',
        primaryColor: isDark ? '#2b2d31' : '#ffffff',
        primaryTextColor: isDark ? '#f3f4f6' : '#111827',
        primaryBorderColor: isDark ? '#4b5563' : '#d1d5db',
        lineColor: isDark ? '#6b7280' : '#9ca3af',
        secondaryColor: isDark ? '#1f2937' : '#f3f4f6',
        tertiaryColor: isDark ? '#111827' : '#f9fafb',
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      },
      securityLevel: 'loose',
    });
    
    const renderChart = async () => {
      let sanitized = chart.replace(/-->\s*\|(.*?)\|\s*>/g, '-->|$1|');
      sanitized = sanitized.replace(/<html.*?>.*?<div.*?>/is, '');
      sanitized = sanitized.replace(/<\/div>.*?<\/html>/is, '');
      sanitized = sanitized.replace(/<script.*?>.*?<\/script>/is, '');
      
      // Fix common AI hallucinations in Mermaid syntax
      // 1. Fix single letter + space + number node IDs (e.g., 'C 1' -> 'C1')
      sanitized = sanitized.replace(/\b([A-Za-z])\s+(\d+)\b/g, '$1$2');
      // 2. Fix unescaped brackets in node text (basic attempt: remove stray spaces before brackets)
      sanitized = sanitized.replace(/([A-Za-z0-9_]+)\s+(\[|\(|\{)/g, '$1$2');
      // 3. Remove sequence diagram notes (note right of X: text) which AI incorrectly puts in flowcharts
      if (sanitized.toLowerCase().includes('flowchart') || sanitized.toLowerCase().includes('graph')) {
        sanitized = sanitized.replace(/^[ \t]*note\s+(right|left|top|bottom|over|of|for).*$/gim, '');
      }
      
      sanitized = sanitized.trim();
      
      setSanitizedStr(sanitized);

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, sanitized);
        setSvgCode(svg);
        setError(false);
      } catch (err) {
        console.error("Mermaid error:", err);
        setError(true);
      }
    };
    renderChart();
  }, [chart]);

  const downloadPNG = () => {
    if (!containerRef.current) return;
    const isDark = document.body.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Use html-to-image to bypass the tainted canvas security issue natively
    toPng(containerRef.current, { 
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      pixelRatio: 2, // High resolution export
      style: {
        margin: '0',
        boxShadow: 'none',
        borderRadius: '0',
        padding: '20px'
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `diagram-${Math.random().toString(36).substr(2, 6)}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to generate PNG:', err);
        alert('Failed to generate PNG. Check console for details.');
      });
  };

  if (error) {
    return (
      <div className="mermaid-error" style={{ color: '#ef4444', background: '#fee2e2', padding: '10px', borderRadius: '8px', fontSize: '0.875rem' }}>
        <strong>Diagram Render Error:</strong> The AI generated invalid Mermaid syntax.
        <pre style={{ marginTop: '10px', background: 'transparent', padding: 0 }}>{sanitizedStr}</pre>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', margin: '20px 0' }}>
      <div 
        ref={containerRef} 
        className="mermaid-wrapper" 
        dangerouslySetInnerHTML={{ __html: svgCode }} 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '24px', 
          background: 'var(--bg-surface)', 
          borderRadius: '12px', 
          border: '1px solid var(--border)', 
          overflowX: 'auto',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
        }}
      />
      {svgCode && (
        <button 
          onClick={downloadPNG}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
          title="Download PNG"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          PNG
        </button>
      )}
    </div>
  );
}
