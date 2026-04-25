import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const settingsAPI = {
  get:          ()  => api.get('/payment/admin/expiry-settings'),
  save:         (d) => api.put('/payment/admin/expiry-settings', d),
  checkNow:     ()  => api.post('/payment/admin/check-expiry'),
  getPayments:  ()  => api.get('/payment/admin/payments'),
  activatePlan: (d) => api.post('/payment/admin/activate', d),
};

// ── Toggle Switch ──
function Toggle({ value, onChange, label, desc }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize:14, fontWeight:600 }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{desc}</div>}
      </div>
      <div onClick={() => onChange(!value)} style={{ width:46, height:24, borderRadius:12, background:value?'#0066cc':'#ddd', position:'relative', cursor:'pointer', transition:'all 0.2s', flexShrink:0, marginLeft:16 }}>
        <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:value?25:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}

// ── Days Input with chips ──
function DaysSelector({ value, onChange, label, desc }) {
  const [input, setInput] = useState('');
  const days = value || [];

  const addDay = () => {
    const n = parseInt(input);
    if (!n || n < 1 || n > 365) return;
    if (!days.includes(n)) onChange([...days, n].sort((a, b) => b - a));
    setInput('');
  };

  const removeDay = (d) => onChange(days.filter(x => x !== d));

  return (
    <div style={{ marginBottom:16 }}>
      <label className="form-label">{label}</label>
      {desc && <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>{desc}</div>}

      {/* Current days as chips */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
        {days.map(d => (
          <div key={d} style={{ display:'flex', alignItems:'center', gap:4, background:'#e8f0ff', border:'1.5px solid #c0d4ff', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700, color:'#0066cc' }}>
            {d} din
            <button onClick={() => removeDay(d)} style={{ background:'none', border:'none', cursor:'pointer', color:'#0066cc', fontSize:14, padding:'0 0 0 2px', lineHeight:1 }}>✕</button>
          </div>
        ))}
        {days.length === 0 && <span style={{ fontSize:12, color:'var(--muted)' }}>Koi din select nahi</span>}
      </div>

      {/* Add day input */}
      <div style={{ display:'flex', gap:8 }}>
        <input
          className="form-input"
          type="number" min="1" max="365"
          placeholder="Din daalo (e.g. 7)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addDay()}
          style={{ maxWidth:150, fontSize:13 }}
        />
        <button className="btn btn-secondary btn-sm" onClick={addDay}>+ Add</button>
      </div>

      {/* Quick presets */}
      <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
        <span style={{ fontSize:11, color:'var(--muted)' }}>Quick add:</span>
        {[1, 3, 5, 7, 10, 15, 30].map(d => (
          !days.includes(d) && (
            <button key={d} onClick={() => onChange([...days, d].sort((a, b) => b - a))}
              style={{ fontSize:11, background:'#f0f4f8', border:'1px solid var(--border)', borderRadius:20, padding:'2px 8px', cursor:'pointer', fontWeight:600 }}>
              {d}d
            </button>
          )
        ))}
      </div>
    </div>
  );
}

export default function ExpirySettingsPage() {
  const [settings,  setSettings]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [checking,  setChecking]  = useState(false);
  const [payments,  setPayments]  = useState([]);
  const [tab,       setTab]       = useState('settings');
  const [activateModal, setActivateModal] = useState(null);

  useEffect(() => {
    Promise.all([
      settingsAPI.get().then(r => setSettings(r.data.settings)),
      settingsAPI.getPayments().then(r => setPayments(r.data.payments || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (key) => (val) => setSettings(s => ({ ...s, [key]: val }));
  const setEmail = (i, val) => {
    const emails = [...(settings.adminEmails || [])];
    emails[i] = val;
    setSettings(s => ({ ...s, adminEmails: emails }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.save(settings);
      toast.success('✅ Settings save ho gayi!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      const res = await settingsAPI.checkNow();
      toast.success(res.data.message);
    } catch { toast.error('Check failed'); }
    finally { setChecking(false); }
  };

  const handleActivate = async (userId, plan, months) => {
    try {
      await settingsAPI.activatePlan({ userId, plan, months });
      toast.success(`✅ ${plan} plan activated for ${months} month(s)!`);
      setActivateModal(null);
    } catch { toast.error('Activation failed'); }
  };

  if (loading) return <div className="page"><div style={{ padding:40, color:'var(--muted)' }}>⟳ Loading...</div></div>;

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="page fade-in">
      <div className="page-header flex justify-between items-center" style={{ flexWrap:'wrap', gap:10 }}>
        <div>
          <div className="page-title">💎 Plans & Payment Management</div>
          <div className="page-sub">Expiry alerts configure karein, payments dekho, plans manually assign karo</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={handleCheckNow} disabled={checking}>
            {checking ? '⟳ Checking...' : '🔍 Check Expiry Now'}
          </button>
          {tab === 'settings' && (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '⟳ Saving...' : '💾 Save Settings'}
            </button>
          )}
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-4 mb-4">
        {[
          { label:'Total Revenue', value:`₹${totalRevenue.toLocaleString('en-IN')}`, icon:'💰', color:'#00b86b' },
          { label:'Total Payments', value:payments.length, icon:'📋', color:'#0066cc' },
          { label:'This Month', value:`₹${payments.filter(p => new Date(p.paidAt) > new Date(Date.now()-30*86400000)).reduce((s,p)=>s+p.amount,0).toLocaleString('en-IN')}`, icon:'📅', color:'#7c3aed' },
          { label:'Avg Order', value:`₹${payments.length ? Math.round(totalRevenue/payments.length).toLocaleString('en-IN') : 0}`, icon:'📊', color:'#dd8800' },
        ].map((stat, i) => (
          <div key={i} className="stat-card purple">
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ fontSize:22 }}>{stat.icon}</div>
            </div>
            <div className="stat-value" style={{ color:stat.color, fontSize:22 }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20 }}>
        {[['settings','⚙️ Alert Settings'],['payments','💳 Payments'],['activate','⚡ Manual Activate']].map(([id,label]) => (
          <button key={id} className={`btn btn-sm ${tab===id?'btn-primary':'btn-secondary'}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && settings && (
        <div className="grid grid-2">
          <div>
            {/* Client Alert Days */}
            <div className="card mb-4">
              <div className="card-title">📧 Client Ko Alert Kab Bhejein?</div>
              <div className="card-sub">Client ko kitne din pehle email jayegi</div>

              <DaysSelector
                label="Alert Days"
                desc="In dates par client ko expiry warning email jayegi"
                value={settings.clientAlertDays}
                onChange={set('clientAlertDays')}
              />

              <Toggle value={settings.clientEmailEnabled} onChange={set('clientEmailEnabled')}
                label="Client Email Alerts"
                desc="Clients ko expiry warning emails bhejein" />

              <div className="form-group mt-3">
                <label className="form-label">Dashboard Banner — Kitne Din Pehle Dikhaye?</label>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input className="form-input" type="number" min="1" max="60"
                    value={settings.dashboardBannerDays || 10}
                    onChange={e => set('dashboardBannerDays')(Number(e.target.value))}
                    style={{ maxWidth:100 }}
                  />
                  <span style={{ fontSize:13, color:'var(--muted)' }}>din pehle banner dikhega</span>
                </div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>
                  💡 Client ke dashboard par orange/red banner dikhega
                </div>
              </div>
            </div>

            {/* Admin Alert Days */}
            <div className="card mb-4">
              <div className="card-title">👑 Admin Ko Alert Kab Bhejein?</div>
              <div className="card-sub">Admin/Super admin ko kab notify karein</div>

              <DaysSelector
                label="Admin Alert Days"
                desc="In dates par admin ko email jayegi ki client ka plan expire ho raha hai"
                value={settings.adminAlertDays}
                onChange={set('adminAlertDays')}
              />

              <Toggle value={settings.adminEmailEnabled} onChange={set('adminEmailEnabled')}
                label="Admin Email Alerts"
                desc="Admins ko client expiry emails bhejein" />

              {/* Admin emails */}
              <div className="form-group mt-3">
                <label className="form-label">Alert Emails (Admin)</label>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>
                  In emails par admin alerts aayenge (khali chhodo = superadmin ka email use hoga)
                </div>
                {(settings.adminEmails || ['']).map((email, i) => (
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                    <input className="form-input" type="email" placeholder="admin@example.com"
                      value={email} onChange={e => setEmail(i, e.target.value)} />
                    {i > 0 && <button className="btn btn-danger btn-sm" onClick={() => setSettings(s => ({ ...s, adminEmails: s.adminEmails.filter((_, j) => j !== i) }))}>✕</button>}
                  </div>
                ))}
                <button className="btn btn-secondary btn-sm" onClick={() => setSettings(s => ({ ...s, adminEmails: [...(s.adminEmails||['']), ''] }))}>
                  + Add Email
                </button>
              </div>
            </div>
          </div>

          <div>
            {/* Grace Period */}
            <div className="card mb-4">
              <div className="card-title">⏳ Grace Period Settings</div>
              <div className="card-sub">Expire hone ke baad kitna time milega</div>

              <div className="form-group">
                <label className="form-label">Grace Period (Days)</label>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input className="form-input" type="number" min="0" max="30"
                    value={settings.gracePeriodDays || 3}
                    onChange={e => set('gracePeriodDays')(Number(e.target.value))}
                    style={{ maxWidth:100 }}
                  />
                  <span style={{ fontSize:13, color:'var(--muted)' }}>din grace period</span>
                </div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>
                  💡 Expire hone ke baad is kitne din tak account chal sakta hai. 0 = turant band.
                </div>
              </div>

              <Toggle value={settings.inAppEnabled} onChange={set('inAppEnabled')}
                label="In-App Notifications"
                desc="Dashboard par expiry banner dikhao" />
            </div>

            {/* Alert Preview */}
            <div className="card mb-4" style={{ background:'#f8faff' }}>
              <div className="card-title mb-3">📋 Alert Schedule Preview</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>
                Ek client ke liye yeh alerts jayenge (example: plan 30 din mein expire hoga):
              </div>

              <div style={{ position:'relative', paddingLeft:20 }}>
                {/* Timeline line */}
                <div style={{ position:'absolute', left:6, top:10, bottom:10, width:2, background:'#c0d4ff', borderRadius:2 }} />

                {[...(settings.clientAlertDays||[])].sort((a,b) => b-a).map((day, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, position:'relative' }}>
                    <div style={{ width:12, height:12, borderRadius:'50%', background:day<=3?'#e53e3e':day<=7?'#dd8800':'#0066cc', flexShrink:0, zIndex:1 }} />
                    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'6px 12px', flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700 }}>📧 Client Email</div>
                      <div style={{ fontSize:11, color:'var(--muted)' }}>
                        Expire se <strong style={{ color:day<=3?'#e53e3e':day<=7?'#dd8800':'#0066cc' }}>{day} din</strong> pehle
                        {day <= 3 && <span style={{ background:'#fff0f0', color:'#e53e3e', padding:'1px 5px', borderRadius:10, marginLeft:5, fontSize:10, fontWeight:700 }}>URGENT</span>}
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, position:'relative' }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background:'#e53e3e', flexShrink:0, zIndex:1 }} />
                  <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', borderRadius:8, padding:'6px 12px', flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#e53e3e' }}>❌ Plan Expired Email</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>Expire hone par — free plan mein convert</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENTS TAB ── */}
      {tab === 'payments' && (
        <div className="card">
          <div className="card-title mb-3">💳 All Payments ({payments.length})</div>
          {payments.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>💳</div>
              <div>Koi payment nahi hua abhi tak</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Billing</th>
                    <th>Order ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontSize:12, color:'var(--muted)', whiteSpace:'nowrap' }}>
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </td>
                      <td style={{ fontWeight:600 }}>{p.user?.name || '—'}</td>
                      <td style={{ fontSize:12, color:'var(--muted)' }}>{p.user?.email || '—'}</td>
                      <td>
                        <span style={{ fontWeight:700, textTransform:'uppercase', color: p.plan==='pro'?'#7c3aed':'#0066cc' }}>{p.plan}</span>
                      </td>
                      <td><strong style={{ color:'var(--success)' }}>₹{p.amount?.toLocaleString('en-IN')}</strong></td>
                      <td style={{ fontSize:12, textTransform:'capitalize' }}>{p.billingCycle}</td>
                      <td style={{ fontSize:10, fontFamily:'monospace', color:'var(--muted)' }}>{p.razorpayOrderId?.slice(-10)}</td>
                      <td>
                        <span style={{ fontSize:10, background:'#e8fff5', color:'var(--success)', border:'1px solid #b3f0d8', padding:'2px 7px', borderRadius:20, fontWeight:700 }}>
                          ✅ {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MANUAL ACTIVATE TAB ── */}
      {tab === 'activate' && (
        <div className="card">
          <div className="card-title mb-1">⚡ Manual Plan Activate</div>
          <div className="card-sub mb-4">Kisi bhi client ko manually plan assign karo — payment ke bina bhi</div>

          <div style={{ background:'#fff8e8', border:'1px solid #ffe0a0', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:13 }}>
            ⚠️ <strong>Note:</strong> Yeh feature testing ya special cases ke liye hai. Normal payments Razorpay se honi chahiye.
          </div>

          <ManualActivateForm onActivate={handleActivate} />
        </div>
      )}
    </div>
  );
}

// ── Manual Activate Form ──
function ManualActivateForm({ onActivate }) {
  const [form, setForm] = useState({ userId: '', plan: 'basic', months: 1 });
  const [submitting, setSubmitting] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.userId.trim()) { return; }
    setSubmitting(true);
    try { await onActivate(form.userId, form.plan, Number(form.months)); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ maxWidth:500 }}>
      <div className="form-group">
        <label className="form-label">User ID *</label>
        <input className="form-input" placeholder="MongoDB User ID (24 char)" value={form.userId} onChange={set('userId')} />
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>
          💡 Super Admin → Users tab → User ke saamne Copy ID button se copy karo
        </div>
      </div>

      <div className="grid grid-2">
        <div className="form-group">
          <label className="form-label">Plan</label>
          <select className="form-select" value={form.plan} onChange={set('plan')}>
            <option value="basic">Basic — ₹999/month</option>
            <option value="pro">Pro — ₹2499/month</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Months</label>
          <select className="form-select" value={form.months} onChange={set('months')}>
            {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} month{m>1?'s':''}</option>)}
          </select>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !form.userId.trim()}>
        {submitting ? '⟳ Activating...' : '⚡ Activate Plan'}
      </button>
    </div>
  );
}