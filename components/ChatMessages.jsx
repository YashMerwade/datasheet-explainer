'use client';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Mermaid from './Mermaid';
import GeneratedImage from './GeneratedImage';

const markdownComponents = {
  a({node, href, children, ...props}) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }} {...props}>{children}</a>;
  },
  code({node, inline, className, children, ...props}) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match && match[1] === 'mermaid') {
      return <Mermaid chart={String(children).replace(/\n$/, '')} />;
    }
    if (!inline && match && match[1] === 'image') {
      return <GeneratedImage prompt={String(children).replace(/\n$/, '')} />;
    }
    return <code className={className} {...props}>{children}</code>;
  }
};

export default function ChatMessages({ messages, isTyping, userImage }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="messages-container">
      {messages.map((msg, i) => (
        <div key={i} className={`msg-row ${msg.role}`}>
          <div className="msg-avatar">
            {msg.role === 'user' ? (
              userImage ? <img src={userImage} alt="you" /> : '👤'
            ) : (
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 20, height: 20 }}>
                <defs><linearGradient id="gradS_chat" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f9b16e" /><stop offset="100%" stopColor="#e65c53" /></linearGradient></defs>
                <path d="M50 10 L85 30 L85 45 L50 25 L30 37 L30 63 L50 75 L85 55 L85 70 L50 90 L15 70 L15 30 Z" fill="url(#gradS_chat)" />
              </svg>
            )}
          </div>
          <div className="msg-bubble">
            {msg.file && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', background: 'var(--bg-main)',
                borderRadius: '8px', marginBottom: '10px',
                border: '1px solid var(--border)', maxWidth: '100%',
                width: 'fit-content'
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '6px',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0
                }}>
                  {msg.file.toLowerCase().endsWith('.pdf') ? '📄' : 
                   msg.file.toLowerCase().match(/\.(jpg|jpeg|png|webp|bmp|tiff|tif)$/i) ? '🖼️' : 
                   msg.file.toLowerCase().endsWith('.csv') ? '📊' : 
                   msg.file.toLowerCase().endsWith('.txt') ? '📃' : '📎'}
                </div>
                <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: 'var(--text-primary)' }}>
                    {msg.file}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Document
                  </div>
                </div>
              </div>
            )}
            <div className="markdown-body">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ))}
      {isTyping && (
        <div className="msg-row assistant">
          <div className="msg-avatar">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 20, height: 20 }}>
              <defs><linearGradient id="gradS_chat_typing" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f9b16e" /><stop offset="100%" stopColor="#e65c53" /></linearGradient></defs>
              <path d="M50 10 L85 30 L85 45 L50 25 L30 37 L30 63 L50 75 L85 55 L85 70 L50 90 L15 70 L15 30 Z" fill="url(#gradS_chat_typing)" />
            </svg>
          </div>
          <div className="msg-bubble" style={{ background: 'var(--bg-surface)', borderRadius: '4px 18px 18px 18px' }}>
            <div className="typing-indicator">
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
