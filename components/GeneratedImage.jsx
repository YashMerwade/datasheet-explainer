'use client';
import React, { useState } from 'react';

export default function GeneratedImage({ prompt }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const cleanPrompt = prompt ? prompt.trim() : 'Electronics engineering diagram';
  const encodedPrompt = encodeURIComponent(cleanPrompt);
  const imageUrl = `/api/image?prompt=${encodedPrompt}`;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setError(true);
        setLoading(false);
      }
    }, 60000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleDownload = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `generated-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Download failed', err);
      window.open(imageUrl, '_blank');
    }
  };

  if (error) {
    return (
      <div className="genimg-error-card">
        <div className="genimg-error-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>Image Generation Failed</span>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Hugging Face API may be overloaded. Please try again.
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Prompt: {cleanPrompt.slice(0, 100)}...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="genimg-card">
        {/* Header */}
        <div className="genimg-card-header">
          <div className="genimg-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Generated Image</span>
          </div>
          <div className="genimg-card-actions">
            {!loading && (
              <>
                <button onClick={() => setIsExpanded(true)} className="mermaid-action-btn" title="Expand">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                </button>
                <button onClick={handleDownload} className="mermaid-action-btn mermaid-download-btn" title="Download">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>PNG</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Image canvas */}
        <div className="genimg-canvas">
          {loading && (
            <div className="genimg-loading">
              <div className="genimg-spinner" />
              <p>Generating image…</p>
            </div>
          )}
          <img 
            src={imageUrl} 
            alt={cleanPrompt} 
            className="genimg-img"
            onClick={() => !loading && setIsExpanded(true)}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            style={{ display: loading ? 'none' : 'block' }}
          />
        </div>

        {/* Footer prompt */}
        {!loading && (
          <div className="genimg-footer">
            <span className="genimg-prompt-label">Prompt:</span> {cleanPrompt.length > 120 ? cleanPrompt.slice(0, 120) + '…' : cleanPrompt}
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {isExpanded && (
        <div className="genimg-overlay" onClick={() => setIsExpanded(false)}>
          <div className="genimg-overlay-toolbar" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '0.82rem', maxWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.8 }}>
              {cleanPrompt}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleDownload} className="genimg-overlay-btn">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
              <button onClick={() => setIsExpanded(false)} className="genimg-overlay-close">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
          <img src={imageUrl} alt={cleanPrompt} className="genimg-overlay-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
