import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';

const supportAPI = {
  chat:        (message) => api.post('/support/chat', { message }),
  quickReplies:()        => api.get('/support/chat/quick-replies'),
  createTicket:(d)       => api.post('/support/tickets', d),
};

// ── Message Bubble ──
function Message({ msg }) {
  const isBot = msg.from === 'bot';

  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Code
      line = line.replace(/`(.*?)`/g, '<code style="background:#f0f4f8;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>');
      return <span key={i} dangerouslySetInnerHTML={{ __html: line }} />;
    }).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <br key={`br-${i}`} />, el], []);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: isBot ? 'flex-start' : 'flex-end',
      marginBottom: 10,
      alignItems: 'flex-end',
      gap: 6,
    }}>
      {isBot && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #0066cc, #0099ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginBottom: 2 }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth: '80%',
        padding: '10px 14px',
        borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
        background: isBot ? '#f0f4f8' : 'linear-gradient(135deg, #0066cc, #0099ff)',
        color: isBot ? '#1a2332' : '#fff',
        fontSize: 13,
        lineHeight: 1.6,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <div>{renderText(msg.text)}</div>

        {/* Links */}
        {msg.links?.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {msg.links.map((link, i) => (
              link.action === 'openTicket' ? (
                <button key={i} onClick={msg.onOpenTicket} style={{
                  background: '#fff', color: '#0066cc', border: '1.5px solid #0066cc',
                  borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer',
                }}>
                  🎫 Submit Ticket
                </button>
              ) : (
                <a key={i} href={link.url} target={link.external ? '_blank' : '_self'} rel="noreferrer" style={{
                  background: '#fff', color: '#0066cc', border: '1.5px solid #c0d4ff',
                  borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                  textDecoration: 'none', display: 'inline-block',
                }}>
                  {link.text} →
                </a>
              )
            ))}
          </div>
        )}

        <div style={{ fontSize: 10, color: isBot ? '#94a3b8' : 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'right' }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
}

// ── Ticket Form ──
function TicketForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ subject: '', description: '', category: 'technical', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Subject aur description required hai');
      return;
    }
    setSubmitting(true);
    try { await onSubmit(form); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ padding: '14px 16px', background: '#f8faff', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#0066cc' }}>🎫 Support Ticket Submit Karein</div>

      <div style={{ marginBottom: 8 }}>
        <input className="form-input" placeholder="Subject — kya problem hai?" value={form.subject} onChange={set('subject')} style={{ fontSize: 13, padding: '8px 12px' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <select className="form-select" value={form.category} onChange={set('category')} style={{ fontSize: 12, padding: '7px 10px' }}>
          <option value="technical">Technical Issue</option>
          <option value="billing">Billing/Payment</option>
          <option value="account">Account Problem</option>
          <option value="social_media">Social Media</option>
          <option value="feature_request">Feature Request</option>
          <option value="bug">Bug Report</option>
          <option value="other">Kuch Aur</option>
        </select>
        <select className="form-select" value={form.priority} onChange={set('priority')} style={{ fontSize: 12, padding: '7px 10px' }}>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="urgent">🚨 Urgent</option>
        </select>
      </div>

      <textarea className="form-textarea" placeholder="Detail mein batao — kya ho raha hai, kab se, kya try kiya..." value={form.description} onChange={set('description')} style={{ fontSize: 13, minHeight: 80, padding: '8px 12px', marginBottom: 8 }} />

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSubmit} disabled={submitting}>
          {submitting ? '⟳ Submitting...' : '🎫 Submit Ticket'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN CHATBOT WIDGET
// ══════════════════════════════════════════
export default function ChatbotWidget() {
  const { user } = useSelector(s => s.auth);
  const [open,         setOpen]         = useState(false);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [showTicket,   setShowTicket]   = useState(false);
  const [unread,       setUnread]       = useState(0);
  const messagesEndRef = useRef(null);

  // Welcome message
  useEffect(() => {
    const welcome = {
      id: 1, from: 'bot', time: getTime(),
      text: `Namaste ${user?.name?.split(' ')[0] || 'aap'}! 👋\n\nMain **SocialSaaS Assistant** hoon. Aapki kya help kar sakta hoon?\n\nNeeche se koi topic choose karein ya seedha likhein:`,
      links: []
    };
    setMessages([welcome]);
    loadQuickReplies();
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadQuickReplies = async () => {
    try {
      const res = await supportAPI.quickReplies();
      setQuickReplies(res.data.quickReplies);
    } catch {}
  };

  const getTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');
    setLoading(true);

    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: userMsg, time: getTime() }]);

    try {
      const res = await supportAPI.chat(userMsg);
      const bot = res.data.response;

      // Add bot response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1, from: 'bot', time: getTime(),
          text: bot.text,
          links: (bot.links || []).map(l => ({ ...l, onOpenTicket: () => setShowTicket(true) })),
          onOpenTicket: () => setShowTicket(true),
        }]);

        if (res.data.quickReplies?.length > 0) {
          setQuickReplies(res.data.quickReplies);
        } else {
          setQuickReplies([]);
        }
      }, 600);

    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', time: getTime(), text: 'Kuch galat ho gaya. Please try again!', links: [] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (form) => {
    try {
      const res = await supportAPI.createTicket(form);
      setShowTicket(false);
      toast.success(res.data.message);
      setMessages(prev => [...prev, {
        id: Date.now(), from: 'bot', time: getTime(),
        text: `✅ **Ticket Submitted!**\n\nTicket ID: **${res.data.ticket.ticketId}**\n\nAapki email par confirmation aa gaya hoga. Hum 24 ghante mein reply karenge! 🙏`,
        links: [{ text: 'My Tickets', url: '/support' }]
      }]);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Ticket submit failed');
    }
  };

  const handleOpen = () => { setOpen(true); setUnread(0); };

  return (
    <>
      {/* ── Floating Button ── */}
      <button onClick={() => open ? setOpen(false) : handleOpen()} style={{
        position: 'fixed', bottom: 74, right: 16,
        width: 52, height: 52, borderRadius: '50%',
        background: open ? '#e53e3e' : 'linear-gradient(135deg, #0066cc, #0099ff)',
        color: '#fff', border: 'none', cursor: 'pointer',
        fontSize: 22, boxShadow: '0 4px 20px rgba(0,102,204,0.4)',
        zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s',
        animation: !open ? 'pulse 3s ease infinite' : 'none',
      }}>
        {open ? '✕' : '💬'}
        {!open && unread > 0 && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, background: '#e53e3e', borderRadius: '50%', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unread}
          </div>
        )}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 134, right: 16,
          width: 340, height: 500,
          background: '#fff', borderRadius: 16,
          border: '1.5px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          zIndex: 599, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', animation: 'slideUp 0.3s ease',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0066cc, #0099ff)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>SocialSaaS Assistant</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>• Online — instant help!</div>
            </div>
            <button onClick={() => setShowTicket(!showTicket)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
              🎫 Ticket
            </button>
          </div>

          {/* Ticket Form */}
          {showTicket && (
            <TicketForm onSubmit={handleTicketSubmit} onCancel={() => setShowTicket(false)} />
          )}

          {/* Messages */}
          {!showTicket && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', background: '#fafcff' }}>
                {messages.map(msg => (
                  <Message key={msg.id} msg={{ ...msg, onOpenTicket: () => setShowTicket(true) }} />
                ))}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #0066cc, #0099ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
                    <div style={{ background: '#f0f4f8', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0066cc', animation: 'pulse 1s ease infinite', animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              {quickReplies.length > 0 && (
                <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap', background: '#fff' }}>
                  {quickReplies.slice(0, 4).map((qr, i) => (
                    <button key={i} onClick={() => sendMessage(qr.message)} style={{
                      background: '#f0f7ff', color: '#0066cc', border: '1px solid #c0d4ff',
                      borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {qr.text}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: '#fff' }}>
                <input
                  style={{ flex: 1, padding: '9px 14px', borderRadius: 20, border: '1.5px solid var(--border)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                  placeholder="Kuch puchna hai..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  onFocus={e => e.target.style.borderColor = '#0066cc'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none',
                  background: input.trim() ? 'linear-gradient(135deg, #0066cc, #0099ff)' : '#e0e0e0',
                  color: '#fff', cursor: input.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                  transition: 'all 0.2s',
                }}>
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
