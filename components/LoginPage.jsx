'use client';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div className="claude-login">
      {/* ── LEFT PANEL (dark) ── */}
      <div className="claude-login-left">
        {/* Logo */}
        <div className="claude-nav">
          <div className="claude-brand">
            <span className="claude-star">✳</span>
            <span className="claude-brand-name">Datasheet AI</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="claude-hero">
          <h1 className="claude-heading">
            Explain fast,<br />learn faster
          </h1>
          <p className="claude-sub">
            AI-powered analysis for any electronic component datasheet.
          </p>
        </div>

        {/* Auth buttons */}
        <div className="claude-auth">
          <button className="claude-google-btn" onClick={() => signIn('google')}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Features */}
        <div className="claude-features">
          {[
            ['📄', 'Upload PDF datasheets — get instant AI explanations'],
            ['💬', 'Chat with any component like talking to an expert'],
            ['⚖️', 'Compare two components side by side'],
            ['📂', 'Full history saved per Google account'],
          ].map(([icon, text]) => (
            <div className="claude-feature-row" key={text}>
              <span className="claude-feature-dot" />
              <span className="claude-feature-text">{icon} {text}</span>
            </div>
          ))}
        </div>

        <div className="claude-login-footer">
          Powered by Groq · LLaMA 3.3 70B · Firebase · Next.js
        </div>
      </div>

      {/* ── RIGHT PANEL (light preview) ── */}
      <div className="claude-login-right">
        <div className="claude-preview-card">
          {/* Mock topbar */}
          <div className="mock-topbar">
            <div className="mock-logo">⚡ Datasheet AI</div>
            <div className="mock-tabs">
              <span className="mock-tab active">💬 Chat</span>
              <span className="mock-tab">🧠 Explain</span>
              <span className="mock-tab">⚖️ Compare</span>
            </div>
          </div>

          {/* Mock sidebar + chat */}
          <div className="mock-body">
            <div className="mock-sidebar">
              <div className="mock-sidebar-item active">NE555 Timer</div>
              <div className="mock-sidebar-item">LM358 OpAmp</div>
              <div className="mock-sidebar-item">ATmega328P</div>
              <div className="mock-sidebar-item">L298N Driver</div>
            </div>
            <div className="mock-chat">
              <div className="mock-msg ai">
                <span className="mock-avatar">⚡</span>
                <div className="mock-bubble">
                  The NE555 is a versatile timer IC. It can operate in <strong>astable</strong> or <strong>monostable</strong> mode with operating voltage 4.5V–16V...
                </div>
              </div>
              <div className="mock-msg user">
                <div className="mock-bubble user">
                  What is the max output current?
                </div>
                <span className="mock-avatar user">Y</span>
              </div>
              <div className="mock-msg ai">
                <span className="mock-avatar">⚡</span>
                <div className="mock-bubble">
                  The NE555 can source or sink up to <strong>200mA</strong> of output current, making it suitable for directly driving relays and LEDs.
                </div>
              </div>
              <div className="mock-input-bar">
                <span className="mock-input-placeholder">Ask about the datasheet…</span>
                <span className="mock-send">➤</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
