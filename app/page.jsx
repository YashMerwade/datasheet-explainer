'use client';
import { useSession } from 'next-auth/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import LoginPage from '@/components/LoginPage';
import Sidebar from '@/components/Sidebar';
import ChatMessages from '@/components/ChatMessages';

const SUGGESTIONS = [
  { icon: '📄', label: 'Explain datasheet', subtitle: 'Get clear explanations', prompt: 'Explain this datasheet in simple terms' },
  { icon: '📌', label: 'List all pins', subtitle: 'Pin functions & details', prompt: 'List all pins and their functions' },
  { icon: '⚡', label: 'Key specs', subtitle: 'Important specifications', prompt: 'What are the key electrical specifications?' },
  { icon: '🔌', label: 'Arduino wiring', subtitle: 'Connections guide', prompt: 'How do I connect this to an Arduino?' },
  { icon: '🔍', label: 'Alternatives', subtitle: 'Find similar components', prompt: 'What are alternative components to this one?' },
  { icon: '</>', label: 'Applications', subtitle: 'Use cases & ideas', prompt: 'What are typical applications for this component?' },
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
  const [theme, setTheme] = useState('light');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [baseInput, setBaseInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (listening) {
      setInput(baseInput + (baseInput && transcript ? ' ' : '') + transcript);
    }
  }, [transcript, listening, baseInput]);

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      setBaseInput(input);
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

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
    SpeechRecognition.stopListening();
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setBaseInput('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }

    // Check if the current uploaded file hasn't been attached to a message in this conversation yet
    const isFileAttachedNow = uploadedFile && !messages.some(m => m.file === uploadedFile.name);

    const newMsg = { 
      role: 'user', 
      content: msg,
      ...(isFileAttachedNow && { file: uploadedFile.name })
    };

    const newMessages = [...messages, newMsg];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: messages, // Send history before this new message
          datasheetText: uploadedFile?.text || '',
          conversationId: convId,
          datasheetName: uploadedFile?.name || 'No file',
          attachedFile: isFileAttachedNow ? uploadedFile.name : null,
          useWebSearch: webSearchEnabled
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
    setSidebarOpen(false);
  };

  const selectConv = (conv) => {
    setActiveConv(conv);
    setMessages(conv.messages || []);
    setConvId(conv.id);
    setSidebarOpen(false);
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
    <div className={`app-shell ${theme}`}>
      <Sidebar 
        session={session} 
        activeConvId={convId} 
        onSelectConv={selectConv} 
        onNewChat={newChat} 
        webSearchEnabled={webSearchEnabled}
        onToggleWebSearch={setWebSearchEnabled}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)} title="Open Sidebar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <span className="topbar-title" style={{ fontFamily: 'Lora, Georgia, serif' }}>
              {uploadedFile
                ? <>{getFileIcon(uploadedFile.name)} {uploadedFile.name}</>
                : <>AI Datasheet Explainer</>}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="topbar-model-badge" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '20px' }}>
              <span style={{ color: '#4caf50', fontSize: '0.6rem' }}>●</span> LLaMA 3.3 · Groq
            </span>
            <button className="icon-btn" style={{ border: '1px solid var(--border)', background: 'transparent' }} title="Toggle Theme" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </button>
          </div>
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
              <div className="landing-icon">
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
                <div className="landing-title">AI Datasheet Explainer</div>
                <div className="landing-subtitle" style={{ marginTop: 12 }}>
                  Upload any file — PDF, DOCX, image, or text —<br/>and ask anything about it.
                </div>
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
                {browserSupportsSpeechRecognition && (
                  <button
                    className={`icon-btn mic-btn ${listening ? 'listening' : ''}`}
                    onClick={toggleListening}
                    title={listening ? "Stop listening" : "Start voice input"}
                    style={{ 
                      color: listening ? '#e65c53' : 'var(--text-muted)',
                      border: listening ? '1px solid #e65c53' : 'none',
                      background: listening ? 'rgba(230, 92, 83, 0.1)' : 'transparent',
                      marginRight: '8px'
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </button>
                )}
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping || uploadedFile?.uploading}
                  title="Send message"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
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
