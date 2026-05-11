'use client';
import { useEffect, useRef } from 'react';

function formatMessage(text) {
  // Simple markdown-like rendering
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^#{1,3} (.+)$/gm, '<strong>$1</strong>')
    .replace(/^[-•] (.+)$/gm, '• $1')
    .split('\n')
    .map((line) => `<p>${line || '&nbsp;'}</p>`)
    .join('');
}

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
            ) : '⚡'}
          </div>
          <div
            className="msg-bubble"
            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
          />
        </div>
      ))}
      {isTyping && (
        <div className="msg-row assistant">
          <div className="msg-avatar">⚡</div>
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
