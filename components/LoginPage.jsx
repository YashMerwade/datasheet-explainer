'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">
      {/* ── LEFT PANEL ── */}
      <div className="login-left">
        <div className="login-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">Datasheet AI</span>
        </div>

        <div className="login-hero">
          <h1 className="hero-heading">
            Explain fast,<br />
            <span className="hero-highlight">learn faster</span>
          </h1>
          <p className="hero-sub">
            AI-powered analysis for any electronic component datasheet.
          </p>
        </div>

        <div className="login-features">
          <div className="feature-item">
            <div className="feature-icon">📄</div>
            <div className="feature-text">
              <h3>Upload datasheets</h3>
              <p>PDF files, instantly processed</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">💬</div>
            <div className="feature-text">
              <h3>Chat with AI</h3>
              <p>Ask anything about the component</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">⚖️</div>
            <div className="feature-text">
              <h3>Compare components</h3>
              <p>Side-by-side analysis made simple</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🕒</div>
            <div className="feature-text">
              <h3>Saved history</h3>
              <p>All your datasheets in one place</p>
            </div>
          </div>
        </div>

        <div className="login-footer">
          © 2025 Datasheet AI. All rights reserved. &nbsp; • &nbsp; Powered by Groq
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="login-right">
        <div className="login-card">
          <div className="card-header">
            <div className="card-icon">⚡</div>
            <h2>Welcome back</h2>
            <p>Sign in to continue to Datasheet AI</p>
          </div>

          <button className="btn-google" onClick={() => signIn('google')}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <form className="login-form" onSubmit={(e) => e.preventDefault()}>
            <div className="input-group">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><polyline points="3 7 12 13 21 7"></polyline></svg>
              <input type="email" placeholder="Email address" />
            </div>

            <div className="input-group">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <input type={showPassword ? "text" : "password"} placeholder="Password" />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>

            <div className="form-actions">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="btn-signin">
              Sign in
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </form>

          <div className="card-footer">
            Don't have an account? <a href="#">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
}
