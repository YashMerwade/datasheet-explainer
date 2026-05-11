'use client';
import { useSession } from 'next-auth/react';
import { useState, useRef, useCallback } from 'react';
import LoginPage from '@/components/LoginPage';
import Sidebar from '@/components/Sidebar';
import ChatMessages from '@/components/ChatMessages';

const SUGGESTIONS = [
  { icon: '📄', label: 'Explain datasheet', prompt: 'Explain this datasheet in simple terms' },
  { icon: '📌', label: 'List all pins', prompt: 'List all pins and their functions' },
  { icon: '⚡', label: 'Key specs', prompt: 'What are the key electrical specifications?' },
  { icon: '🔌', label: 'Arduino wiring', prompt: 'How do I connect this to an Arduino?' },
  { icon: '🔍', label: 'Alternatives', prompt: 'What are alternative components to this one?' },
  { icon: '</>', label: 'Applications', prompt: 'What are typical applications for this component?' },
];

// Accepted file types
const ACCEPT = '.pdf,.docx,.txt,.csv,.md,.jpg,.jpeg,.png,.webp,.bmp,.tiff,.tif';

const FILE_ICONS = {
  pdf: '📄', docx: '📝', txt: '📃', csv: '📊', md: '📋',
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', webp: '🖼️', bmp: '🖼️', tiff: '🖼️', tif: '🖼️',
};

function getFileIcon(name = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext] || '📎';
}

function genId() { return Math.random().toString(36).slice(2, 10); }

export default function Home() {
  const { data: session, status } = useSession();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null); // { file, name, text, uploading }
  const [convId, setConvId] = useState(() => genId());
  const [activeConv, setActiveConv] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Upload & extract file ──────────────────────────────────────────
  const processFile = async (file) => {
    if (!file) return;
    setUploadedFile({ file, name: file.name, text: null, uploading: true });

    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', 'summary');

    try {
      const r = await fetch('/api/explain', { method: 'POST', body: fd });
      const data = await r.json();
      setUploadedFile({ file, name: file.name, text: data.text || data.result || '', uploading: false });
    } catch {
      setUploadedFile((prev) => ({ ...prev, uploading: false, text: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag & drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ── Send message ───────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: messages,
          datasheetText: uploadedFile?.text || '',
          conversationId: convId,
          datasheetName: uploadedFile?.name || 'No file',
        }),
      });
      const data = await r.json();
      setMessages([...newMessages, { role: 'assistant', content: data.answer || 'Sorry, I could not process that.' }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Error connecting to AI. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, uploadedFile, convId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── New chat ───────────────────────────────────────────────────────
  const newChat = () => {
    setMessages([]);
    setUploadedFile(null);
    setConvId(genId());
    setActiveConv(null);
    setInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectConv = (conv) => {
    setActiveConv(conv);
    setMessages(conv.messages || []);
    setConvId(conv.id);
  };

  // ── Loading screen ─────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#212121' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!session) return <LoginPage />;

  return (
    <div className="app-shell">
      <Sidebar session={session} activeConvId={convId} onSelectConv={selectConv} onNewChat={newChat} />

      <div className="main-content">
        {/* Topbar — no tabs */}
        <div className="topbar">
          <span className="topbar-title">
            {uploadedFile
              ? <>{getFileIcon(uploadedFile.name)} {uploadedFile.name}</>
              : 'AI Datasheet Explainer'}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>LLaMA 3.3 · Groq</span>
        </div>

        {/* Chat area */}
        <div
          className={`chat-area${dragOver ? ' drag-active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {messages.length === 0 ? (
            <div className="landing">
              <div className="landing-icon">⚡</div>
              <div>
                <div className="landing-title">AI Datasheet Explainer</div>
                <div className="landing-subtitle" style={{ marginTop: 8 }}>
                  Upload any file — PDF, DOCX, image, or text — and ask anything about it.
                </div>
              </div>

              {/* File type badges */}
              <div className="file-type-badges">
                {['PDF', 'DOCX', 'JPG/PNG', 'TXT', 'CSV'].map((t) => (
                  <span key={t} className="file-badge">{t}</span>
                ))}
              </div>

              <div className="suggestion-chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s.label} className="chip" onClick={() => sendMessage(s.prompt)}>
                    <span className="chip-icon">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>

              {dragOver && (
                <div className="drop-overlay">
                  <div className="drop-overlay-inner">📎 Drop your file here</div>
                </div>
              )}
            </div>
          ) : (
            <ChatMessages messages={messages} isTyping={isTyping} userImage={session.user?.image} />
          )}
        </div>

        {/* Input Bar */}
        <div className="input-area">
          <div className="input-box">
            {/* File indicator strip */}
            {uploadedFile && (
              <div className="file-indicator">
                {getFileIcon(uploadedFile.name)} {uploadedFile.name}
                {uploadedFile.uploading && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> extracting…
                  </span>
                )}
                {!uploadedFile.uploading && uploadedFile.text !== null && (
                  <span style={{ color: '#4caf77', marginLeft: 6, fontSize: '0.72rem' }}>✓ ready</span>
                )}
                <button
                  className="file-indicator-remove"
                  onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                >✕</button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              className="input-textarea"
              placeholder={uploadedFile ? `Ask about ${uploadedFile.name}…` : 'Upload a file or ask anything…'}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={handleKeyDown}
              rows={1}
            />

            <div className="input-toolbar">
              <div className="input-left">
                {/* Upload button */}
                <button
                  className="icon-btn upload-icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload file (PDF, DOCX, image, TXT…)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="icon-btn-label">Attach</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  PDF · DOCX · JPG · PNG · TXT · CSV
                </span>
              </div>
              <div className="input-right">
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping || uploadedFile?.uploading}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="input-hint">AI can make mistakes. Always verify critical specs from the original datasheet.</div>
        </div>
      </div>
    </div>
  );
}
