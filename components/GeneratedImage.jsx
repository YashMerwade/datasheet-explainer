'use client';
import React, { useState } from 'react';

export default function GeneratedImage({ prompt }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Clean up the prompt
  const cleanPrompt = prompt ? prompt.trim() : 'Electronics engineering diagram';
  
  // Route through our Next.js backend proxy to bypass AdBlockers, tracking prevention, and CORS issues
  const encodedPrompt = encodeURIComponent(cleanPrompt);
  const imageUrl = `/api/image?prompt=${encodedPrompt}`;

  // Add a timeout just in case the server is completely unresponsive
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setError(true);
        setLoading(false);
      }
    }, 45000); // 45 second timeout for heavy image generation
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
      a.download = `generated-image-${Math.floor(Math.random() * 10000)}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Download failed', err);
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <>
      <div style={{ margin: '20px 0', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', position: 'relative', background: 'var(--bg-surface)' }}>
        {loading && !error && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }}></div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Generating your image... this takes a few seconds.</p>
            </div>
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}

        {error && (
          <div style={{ padding: '30px', textAlign: 'center', color: '#ef4444', background: '#fee2e2' }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>⚠️ Image Generation Failed</p>
            <p style={{ fontSize: '0.875rem' }}>The Hugging Face image server is currently overloaded, the API key is invalid, or it is blocked by your network. Please try again later.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '12px', color: '#b91c1c' }}>Prompt: {cleanPrompt}</p>
          </div>
        )}
        
        {!error && (
          <img 
            src={imageUrl} 
            alt={cleanPrompt} 
            onClick={() => !loading && setIsExpanded(true)}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            style={{ width: '100%', display: loading ? 'none' : 'block', height: 'auto', cursor: loading ? 'default' : 'zoom-in' }}
          />
        )}
        
        {!loading && !error && (
          <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Prompt: {cleanPrompt}
            </p>
          </div>
        )}
      </div>

      {isExpanded && (
        <div 
          onClick={() => setIsExpanded(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(15, 15, 15, 0.95)', zIndex: 99999, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          {/* Top Toolbar */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(rgba(0,0,0,0.5), transparent)',
              color: 'white', cursor: 'default'
            }}
          >
            <div style={{ fontSize: '0.875rem', maxWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.8 }}>
              {cleanPrompt}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleDownload}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: '8px',
                  fontSize: '0.875rem', fontWeight: '500', border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download
              </button>
              <button 
                onClick={() => setIsExpanded(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px',
                  background: 'rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Main Image */}
          <img 
            src={imageUrl} 
            alt={cleanPrompt} 
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', borderRadius: '4px' }} 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
