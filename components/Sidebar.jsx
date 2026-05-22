'use client';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function Sidebar({ session, activeConvId, onSelectConv, onNewChat, webSearchEnabled, onToggleWebSearch }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const r = await fetch('/api/history');
      const data = await r.json();
      setHistory(data.conversations || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [activeConvId]);

  const deleteConv = async (e, id) => {
    e.stopPropagation();
    await fetch('/api/history', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } });
    setHistory((h) => h.filter((c) => c.id !== id));
    if (activeConvId === id) onNewChat();
  };

  const user = session?.user;
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header" style={{ marginBottom: '12px' }}>
        <div className="sidebar-logo-icon" style={{ display: 'flex', width: 26, height: 26 }}>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gradS" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f9b16e" />
                <stop offset="100%" stopColor="#e65c53" />
              </linearGradient>
            </defs>
            <path d="M50 10 L85 30 L85 45 L50 25 L30 37 L30 63 L50 75 L85 55 L85 70 L50 90 L15 70 L15 30 Z" fill="url(#gradS)" />
          </svg>
        </div>
        <div>
          <div className="sidebar-logo-text" style={{ fontSize: '1.1rem', fontFamily: 'Lora, Georgia, serif', fontWeight: 600 }}>Datasheet AI</div>
        </div>
      </div>

      {/* New Chat */}
      <button className="sidebar-btn new-chat" onClick={onNewChat} style={{ background: 'var(--bg-surface)', justifyContent: 'space-between', padding: '10px 14px', marginBottom: '12px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          <span style={{ fontWeight: 500 }}>New chat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px' }}>
          ⌘ K
        </div>
      </button>

      {/* Web Search Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', marginBottom: '24px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Web Search</span>
        </div>
        <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
          <input 
            type="checkbox" 
            checked={webSearchEnabled} 
            onChange={(e) => onToggleWebSearch(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span style={{
            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: webSearchEnabled ? '#4caf50' : 'var(--border)',
            transition: '.3s', borderRadius: '20px'
          }}>
            <span style={{
              position: 'absolute', content: '""', height: '14px', width: '14px',
              left: webSearchEnabled ? '19px' : '3px', bottom: '3px',
              backgroundColor: 'white', transition: '.3s', borderRadius: '50%'
            }}></span>
          </span>
        </label>
      </div>


      {/* History */}
      <div className="sidebar-section-label">Recents</div>
      <div className="sidebar-history">
        {loading && <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading…</div>}
        {!loading && history.length === 0 && (
          <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>No conversations yet</div>
        )}
        {history.map((conv) => (
          <div
            key={conv.id}
            className={`history-item ${conv.id === activeConvId ? 'active' : ''}`}
            onClick={() => onSelectConv(conv)}
            style={{ padding: '10px 12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.8 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span className="history-item-title">{conv.title || 'Untitled'}</span>
            </div>
            <button className="history-item-del" onClick={(e) => deleteConv(e, conv.id)} title="Delete">✕</button>
          </div>
        ))}
      </div>

      {/* User footer */}
      <div className="sidebar-footer" style={{ borderTop: 'none', padding: '12px 0 4px' }}>
        <div className="user-profile" style={{ padding: '8px', gap: '12px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            {user?.image ? (
              <img src={user.image} alt="avatar" className="user-avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="user-avatar" style={{ background: '#d4563b' }}>{initials}</div>
            )}
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-plan" style={{ fontSize: '0.7rem' }}>{user?.email}</div>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }} onClick={() => signOut()}><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>
    </div>
  );
}
