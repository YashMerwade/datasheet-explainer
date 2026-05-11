'use client';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function Sidebar({ session, activeConvId, onSelectConv, onNewChat }) {
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
      <div className="sidebar-header">
        <span className="sidebar-logo-icon">⚡</span>
        <div>
          <div className="sidebar-logo-text">Datasheet AI</div>
        </div>
      </div>

      {/* New Chat */}
      <button className="sidebar-btn new-chat" onClick={onNewChat}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
        </svg>
        New chat
      </button>

      {/* Nav items */}
      {[
        { icon: '🔍', label: 'Search chats' },
        { icon: '📁', label: 'Projects' },
      ].map(({ icon, label }) => (
        <button key={label} className="sidebar-btn">
          <span style={{ fontSize: '1rem' }}>{icon}</span>
          {label}
        </button>
      ))}

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
          >
            <span className="history-item-title">{conv.title || 'Untitled'}</span>
            <button className="history-item-del" onClick={(e) => deleteConv(e, conv.id)} title="Delete">✕</button>
          </div>
        ))}
      </div>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-profile">
          {user?.image ? (
            <img src={user.image} alt="avatar" className="user-avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div className="user-avatar">{initials}</div>
          )}
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-plan">{user?.email}</div>
          </div>
          <button className="logout-btn" onClick={() => signOut()} title="Sign out">↩</button>
        </div>
      </div>
    </div>
  );
}
