import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';

const inboxAPI = {
  getAll:       (p) => api.get('/inbox', { params: p }),
  replyComment: (d) => api.post('/inbox/reply/comment', d),
  replyMessage: (d) => api.post('/inbox/reply/message', d),
  hideComment:  (d) => api.post('/inbox/comment/hide', d),
  likeComment:  (d) => api.post('/inbox/comment/like', d),
};

const PLATFORM_COLORS = {
  facebook:  { bg: '#e8f0ff', color: '#1877f2', icon: '📘' },
  instagram: { bg: '#fff0f5', color: '#e1306c', icon: '📷' },
};

const TIME_FORMAT = (t) => {
  if (!t) return '';
  const d = new Date(t);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)  return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return d.toLocaleDateString();
};

export default function InboxPage() {
  const { user }    = useSelector(s => s.auth);
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending,   setSending]   = useState(false);
  const [filter,    setFilter]    = useState({ type: '', platform: '' });
  const [accounts,  setAccounts]  = useState([]);
  const msgEndRef = useRef(null);

  useEffect(() => {
    loadInbox();
    loadAccounts();
  }, [filter]);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const res = await inboxAPI.getAll(filter);
      setItems(res.data.items || []);
    } catch (e) {
      // Agar accounts connected nahi hain
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await api.get('/social/accounts');
      setAccounts(res.data.accounts || []);
    } catch {}
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const account = accounts.find(a => a.platform === selected.platform);
      if (!account) return toast.error('Account not connected');

      if (selected.type === 'comment') {
        await inboxAPI.replyComment({
          commentId: selected.id,
          message:   replyText,
          platform:  selected.platform,
          accountId: account._id
        });
      } else {
        const recipientId = selected.participants?.find(p => p.id !== account.platformUserId)?.id;
        await inboxAPI.replyMessage({
          recipientId,
          message:   replyText,
          accountId: account._id
        });
      }

      toast.success('✅ Reply sent!');
      setReplyText('');
      // Optimistic update — reply dikhao
      setSelected(prev => ({
        ...prev,
        messages: [...(prev.messages || []), {
          message: replyText,
          text:    replyText,
          from:    { name: 'You' },
          isOwn:   true,
          created_time: new Date().toISOString()
        }]
      }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reply failed');
    } finally {
      setSending(false);
    }
  };

  const handleHide = async (item) => {
    try {
      const account = accounts.find(a => a.platform === item.platform);
      await inboxAPI.hideComment({ commentId: item.id, hide: true, accountId: account._id });
      toast.success('Comment hidden');
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (e) { toast.error('Failed to hide'); }
  };

  const handleLike = async (item) => {
    try {
      const account = accounts.find(a => a.platform === item.platform);
      await inboxAPI.likeComment({ commentId: item.id, accountId: account._id });
      toast.success('❤️ Liked!');
    } catch (e) { toast.error('Failed to like'); }
  };

  const connectedPlatforms = accounts.filter(a => ['facebook', 'instagram'].includes(a.platform));
  const filteredItems = items.filter(item => {
    if (filter.type && item.type !== filter.type) return false;
    if (filter.platform && item.platform !== filter.platform) return false;
    return true;
  });

  const unreadCount = filteredItems.filter(i => i.unread).length;

  return (
    <div className="page fade-in" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ padding: '20px 28px 0', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="page-title">📬 Unified Inbox</div>
            <div className="page-sub">
              Facebook & Instagram messages + comments — ek jagah
              {unreadCount > 0 && <span style={{ marginLeft: 8, background: '#0066cc', color: '#fff', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20 }}>{unreadCount} new</span>}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadInbox}>🔄 Refresh</button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-0" style={{ overflowX: 'auto' }}>
          {[
            { label: 'All',       type: '',        platform: '' },
            { label: '💬 Messages', type: 'message', platform: '' },
            { label: '🗨️ Comments', type: 'comment', platform: '' },
            { label: '📘 Facebook', type: '',        platform: 'facebook'  },
            { label: '📷 Instagram',type: '',        platform: 'instagram' },
          ].map((f, i) => (
            <button key={i}
              onClick={() => setFilter({ type: f.type, platform: f.platform })}
              style={{
                padding: '8px 16px', borderRadius: '8px 8px 0 0', fontSize: 12, fontWeight: 600,
                border: '1px solid var(--border)', borderBottom: 'none', cursor: 'pointer',
                background: filter.type === f.type && filter.platform === f.platform ? '#0066cc' : '#fff',
                color:      filter.type === f.type && filter.platform === f.platform ? '#fff' : 'var(--muted)',
                whiteSpace: 'nowrap'
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* No accounts connected */}
      {connectedPlatforms.length === 0 && (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Facebook ya Instagram connect karo</div>
          <div style={{ color: 'var(--muted)', marginBottom: 24 }}>Inbox use karne ke liye pehle API Settings mein keys add karo</div>
          <a href="/api-settings" className="btn btn-primary">🔑 API Settings →</a>
        </div>
      )}

      {connectedPlatforms.length > 0 && (
        <div style={{ display: 'flex', height: 'calc(100vh - 140px)' }}>

          {/* Left sidebar — conversations list */}
          <div className="inbox-sidebar">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>⟳ Loading inbox...</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Koi messages nahi</div>
                <div style={{ fontSize: 12 }}>Jab koi message ya comment karega tab yahan dikhega</div>
              </div>
            ) : (
              filteredItems.map(item => {
                const plt = PLATFORM_COLORS[item.platform];
                const isSelected = selected?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`inbox-item ${item.unread ? 'unread' : ''} ${isSelected ? 'active' : ''}`}
                    onClick={() => { setSelected(item); setReplyText(''); }}
                  >
                    {/* Avatar */}
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: plt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, border: `2px solid ${plt.color}22` }}>
                      {plt.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex justify-between items-center mb-1">
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                          {item.from?.name || item.from?.username || 'Unknown'}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>
                          {TIME_FORMAT(item.latestTime || item.createdTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: plt.bg, color: plt.color }}>
                          {plt.icon} {item.type === 'message' ? 'Message' : 'Comment'}
                        </span>
                        {item.postText && (
                          <span style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            on: {item.postText}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.latestMsg || item.message || 'Media message'}
                      </div>
                    </div>
                    {item.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0066cc', flexShrink: 0, marginTop: 4 }} />}
                  </div>
                );
              })
            )}
          </div>

          {/* Right — conversation detail */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8faff' }}>
            {!selected ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Conversation select karo</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Left side se koi bhi message ya comment click karo</div>
              </div>
            ) : (
              <>
                {/* Conversation header */}
                <div style={{ padding: '14px 20px', background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: PLATFORM_COLORS[selected.platform].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {PLATFORM_COLORS[selected.platform].icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.from?.name || selected.from?.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ padding: '1px 6px', borderRadius: 10, background: PLATFORM_COLORS[selected.platform].bg, color: PLATFORM_COLORS[selected.platform].color, fontWeight: 600 }}>
                        {PLATFORM_COLORS[selected.platform].icon} {selected.platform}
                      </span>
                      <span>{selected.type === 'message' ? 'Direct Message' : `Comment on: ${selected.postText}`}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {selected.type === 'comment' && (
                      <>
                        <button className="btn btn-sm btn-secondary" title="Like comment" onClick={() => handleLike(selected)}>❤️ Like</button>
                        <button className="btn btn-sm btn-danger" title="Hide comment" onClick={() => handleHide(selected)}>🙈 Hide</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.type === 'comment' ? (
                    /* Single comment view */
                    <div>
                      <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid var(--border)', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: PLATFORM_COLORS[selected.platform].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                            {PLATFORM_COLORS[selected.platform].icon}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{selected.from?.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{TIME_FORMAT(selected.createdTime)}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)', paddingLeft: 40 }}>{selected.message}</div>
                      </div>

                      {/* Previous replies */}
                      {selected.messages?.filter(m => m.isOwn).map((m, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div className="message-bubble outgoing">{m.message || m.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Message thread view */
                    selected.messages?.map((msg, i) => {
                      const isOwn = msg.isOwn || msg.from?.name === 'You';
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                          {!isOwn && (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e8f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginRight: 6, flexShrink: 0 }}>
                              {PLATFORM_COLORS[selected.platform].icon}
                            </div>
                          )}
                          <div className={`message-bubble ${isOwn ? 'outgoing' : 'incoming'}`}>
                            {msg.message || msg.text || 'Media'}
                            <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: 'right' }}>
                              {TIME_FORMAT(msg.created_time || msg.timestamp)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={msgEndRef} />
                </div>

                {/* Reply box */}
                <div style={{ padding: '14px 20px', background: '#fff', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <textarea
                      className="form-textarea"
                      placeholder={`Reply to ${selected.from?.name}...`}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                      style={{ flex: 1, minHeight: 60, maxHeight: 120, resize: 'none' }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleReply}
                      disabled={sending || !replyText.trim()}
                      style={{ flexShrink: 0, height: 60 }}
                    >
                      {sending ? '⟳' : '📤 Send'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                    Enter = send &nbsp;|&nbsp; Shift+Enter = new line
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
