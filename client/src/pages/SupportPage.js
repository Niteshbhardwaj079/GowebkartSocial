import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const supportAPI = {
  getTickets:   ()  => api.get('/support/tickets'),
  createTicket: (d) => api.post('/support/tickets', d),
};

const STATUS_COLORS = {
  open:        { bg:'#fff8e8', color:'#dd8800', border:'#ffe0a0', label:'Open' },
  in_progress: { bg:'#f0f7ff', color:'#0066cc', border:'#c0d4ff', label:'In Progress' },
  resolved:    { bg:'#f0fff8', color:'#00b86b', border:'#b3f0d8', label:'Resolved' },
  closed:      { bg:'#f5f5f5', color:'var(--muted)', border:'#ddd', label:'Closed' },
};

const PRIORITY_COLORS = {
  low:    { color:'var(--success)', label:'Low' },
  medium: { color:'#dd8800',        label:'Medium' },
  high:   { color:'var(--danger)',  label:'High' },
  urgent: { color:'#e53e3e',        label:'🚨 Urgent' },
};

export default function SupportPage() {
  const [tickets,   setTickets]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('tickets');
  const [showForm,  setShowForm]  = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [selected,  setSelected]  = useState(null);
  const [form, setForm] = useState({
    subject: '', description: '', category: 'technical', priority: 'medium'
  });

  useEffect(() => {
    supportAPI.getTickets()
      .then(r => setTickets(r.data.tickets || []))
      .finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Subject aur description required hai'); return;
    }
    setSubmitting(true);
    try {
      const res = await supportAPI.createTicket(form);
      toast.success(res.data.message);
      setTickets(prev => [res.data.ticket, ...prev]);
      setForm({ subject:'', description:'', category:'technical', priority:'medium' });
      setShowForm(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submit failed');
    } finally { setSubmitting(false); }
  };

  const CATEGORIES = [
    { value:'technical',       label:'🔧 Technical Issue' },
    { value:'billing',         label:'💳 Billing / Payment' },
    { value:'account',         label:'👤 Account Problem' },
    { value:'social_media',    label:'📱 Social Media' },
    { value:'feature_request', label:'💡 Feature Request' },
    { value:'bug',             label:'🐛 Bug Report' },
    { value:'other',           label:'📝 Kuch Aur' },
  ];

  return (
    <div className="page fade-in">
      <div className="page-header flex justify-between items-center" style={{ flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="page-title">🎫 Support Center</div>
          <div className="page-sub">Help chahiye? Ticket submit karo — 24 ghante mein reply milegi</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : '+ New Ticket'}
        </button>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-3 mb-4">
        {[
          { icon:'💬', title:'AI Chatbot', desc:'Instant answers — dashboard pe neeche right corner', action:'https://...' },
          { icon:'📧', title:'Email Support', desc:'support@socialsaas.com', action:'mailto:support@socialsaas.com' },
          { icon:'📖', title:'Help Guides', desc:'API Settings, Storage, aur sab features ka guide', action:'/api-settings' },
        ].map((item, i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:16, boxShadow:'var(--shadow2)' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{item.icon}</div>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{item.title}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="card mb-4" style={{ border:'1.5px solid #c0d4ff', background:'#fafcff' }}>
          <div className="card-title mb-3">🎫 New Support Ticket</div>

          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input className="form-input" placeholder="Kya problem hai? (e.g. Image upload nahi ho rahi)" value={form.subject} onChange={set('subject')} />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={set('priority')}>
                <option value="low">🟢 Low — Urgent nahi</option>
                <option value="medium">🟡 Medium — Normal</option>
                <option value="high">🔴 High — Jaldi chahiye</option>
                <option value="urgent">🚨 Urgent — Bahut zaroori</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" placeholder="Detail mein batao — kya ho raha hai, kab se, kya try kiya, kya error aa raha hai..." value={form.description} onChange={set('description')} style={{ minHeight:120 }} />
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '⟳ Submitting...' : '🎫 Submit Ticket'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>

          <div style={{ marginTop:12, fontSize:12, color:'var(--muted)', background:'var(--bg3)', borderRadius:8, padding:'8px 12px' }}>
            ✅ Submit karte hi: <strong>Aapko</strong> confirmation email + <strong>Admin ko</strong> notification email — dono jayenge!
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div className="card-title">My Tickets ({tickets.length})</div>
          <div style={{ display:'flex', gap:6 }}>
            {['all','open','in_progress','resolved'].map(s => (
              <button key={s} onClick={() => setTab(s)}
                className={`btn btn-sm ${tab===s?'btn-primary':'btn-secondary'}`}
                style={{ fontSize:11, padding:'4px 10px' }}>
                {s === 'all' ? 'All' : STATUS_COLORS[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>⟳ Loading...</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign:'center', padding:40 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎫</div>
            <div style={{ fontWeight:700, marginBottom:6 }}>Koi ticket nahi</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>Koi problem hai to naya ticket create karein</div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Ticket</button>
          </div>
        ) : (
          <div>
            {tickets
              .filter(t => tab === 'all' || t.status === tab)
              .map(t => {
                const sc = STATUS_COLORS[t.status] || STATUS_COLORS.open;
                const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium;
                const isSelected = selected === t._id;

                return (
                  <div key={t._id} style={{ border:'1px solid var(--border)', borderRadius:10, marginBottom:8, overflow:'hidden', transition:'all 0.2s' }}>
                    {/* Ticket Header */}
                    <div onClick={() => setSelected(isSelected ? null : t._id)}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer', background: isSelected?'#f5f9ff':'#fff' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{t.subject}</div>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>
                            {sc.label}
                          </span>
                          <span style={{ fontSize:11, fontWeight:700, color:pc.color }}>
                            {pc.label}
                          </span>
                          <span style={{ fontSize:11, color:'var(--muted)' }}>#{t.ticketId}</span>
                          <span style={{ fontSize:11, color:'var(--muted)' }}>
                            {new Date(t.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize:14, color:'var(--muted)', flexShrink:0 }}>{isSelected ? '▲' : '▼'}</span>
                    </div>

                    {/* Expanded Detail */}
                    {isSelected && (
                      <div style={{ padding:'0 16px 16px', background:'#fafcff', borderTop:'1px solid var(--border)' }}>
                        <div style={{ marginTop:12 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', marginBottom:6 }}>Your Message:</div>
                          <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.7, background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
                            {t.description}
                          </div>
                        </div>

                        {t.adminReply && (
                          <div style={{ marginTop:12 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:'#0066cc', textTransform:'uppercase', marginBottom:6 }}>Admin Reply:</div>
                            <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.7, background:'#f0f7ff', border:'1px solid #c0d4ff', borderLeft:'3px solid #0066cc', borderRadius:8, padding:'10px 14px' }}>
                              {t.adminReply}
                            </div>
                            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>
                              Replied: {new Date(t.repliedAt).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        )}

                        {!t.adminReply && t.status === 'open' && (
                          <div style={{ marginTop:12, background:'#fff8e8', border:'1px solid #ffe0a0', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
                            ⏳ Reply pending — usually 24 ghante mein milti hai
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}