import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';

const notifAPI = {
  get:       () => api.get('/notifications/settings'),
  update:    (d) => api.put('/notifications/settings', d),
  testEmail: () => api.post('/notifications/test-email'),
};

function Toggle({ value, onChange, label, desc }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{desc}</div>}
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width:48, height:26, borderRadius:13,
          background: value ? '#0066cc' : '#ddd',
          position:'relative', cursor:'pointer', transition:'all 0.2s',
          flexShrink:0, marginLeft:16
        }}>
        <div style={{
          width:20, height:20, borderRadius:'50%', background:'#fff',
          position:'absolute', top:3,
          left: value ? 25 : 3,
          transition:'left 0.2s',
          boxShadow:'0 1px 4px rgba(0,0,0,0.2)'
        }} />
      </div>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const { user } = useSelector(s => s.auth);
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [testing,  setTesting]  = useState(false);

  useEffect(() => {
    notifAPI.get()
      .then(r => setSettings(r.data.settings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (path, val) => {
    const keys = path.split('.');
    setSettings(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      let obj = copy;
      for (let i=0; i < keys.length-1; i++) obj = obj[keys[i]];
      obj[keys[keys.length-1]] = val;
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await notifAPI.update(settings);
      toast.success('✅ Notification settings save ho gayi!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      const res = await notifAPI.testEmail();
      if (res.data.dev) {
        toast.info('⚠️ Email configured nahi hai. .env mein EMAIL_USER aur EMAIL_PASS add karein.');
      } else {
        toast.success(`✅ Test email ${user?.email} par bheja gaya!`);
      }
    } catch { toast.error('Test email failed'); }
    finally { setTesting(false); }
  };

  if (loading || !settings) return <div className="page"><div style={{ padding:40,color:'var(--muted)' }}>⟳ Loading...</div></div>;

  return (
    <div className="page fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <div className="page-title">🔔 Notification Settings</div>
          <div className="page-sub">Tag, mention, abuse alerts configure karein — email par turant notification</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={handleTestEmail} disabled={testing}>
            {testing ? '⟳ Bhej raha...' : '📧 Test Email Bhejo'}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⟳ Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>

      {/* Email config warning */}
      <div style={{ background:'#fff8e8', border:'1px solid #ffe0a0', borderRadius:'var(--radius2)', padding:'12px 16px', marginBottom:24, fontSize:13 }}>
        <strong style={{ color:'var(--warning)' }}>⚠️ Email Setup Required:</strong>{' '}
        <span style={{ color:'var(--muted)' }}>
          Server ke <code style={{ background:'#fff', padding:'1px 6px', borderRadius:4 }}>server/.env</code> mein add karein:
          <strong> EMAIL_USER=your@gmail.com</strong> aur
          <strong> EMAIL_PASS=app_password</strong>
          {' '}(Gmail → 2FA Enable → App Password banao)
        </span>
      </div>

      <div className="grid grid-2">
        <div>
          {/* Master Toggle */}
          <div className="card mb-4">
            <div className="card-title mb-1">📧 Email Notifications</div>
            <div className="card-sub">Kab email bhejni hai yeh set karein</div>

            <Toggle
              value={settings.email?.enabled}
              onChange={v => set('email.enabled', v)}
              label="Email Notifications Enable"
              desc="Sab email alerts on/off"
            />

            {settings.email?.enabled && <>
              <Toggle value={settings.email?.onTagged}        onChange={v=>set('email.onTagged',v)}        label="🏷️ Tag Alert"          desc="Jab koi aapko tag kare (@mention) — turant email" />
              <Toggle value={settings.email?.onMentioned}     onChange={v=>set('email.onMentioned',v)}     label="💬 Mention Alert"       desc="Jab koi aapka username mention kare" />
              <Toggle value={settings.email?.onAbuseDetected} onChange={v=>set('email.onAbuseDetected',v)} label="🚨 Abuse/Gali Alert"    desc="Offensive ya abusive content detect hone par — IMPORTANT!" />
              <Toggle value={settings.email?.onNewMessage}    onChange={v=>set('email.onNewMessage',v)}    label="✉️ New Message"         desc="New DM/Message aane par" />
              <Toggle value={settings.email?.onNewComment}    onChange={v=>set('email.onNewComment',v)}    label="💭 New Comment"         desc="Har new comment par (bahut emails aa sakti hain)" />
              <Toggle value={settings.email?.onPostPublished} onChange={v=>set('email.onPostPublished',v)} label="✅ Post Published"       desc="Post successfully publish hone par" />
              <Toggle value={settings.email?.onPostFailed}    onChange={v=>set('email.onPostFailed',v)}    label="❌ Post Failed"          desc="Post fail hone par" />
            </>}
          </div>

          {/* Alert Email */}
          <div className="card mb-4">
            <div className="card-title mb-1">📮 Alert Email Address</div>
            <div className="card-sub">Alerts kahan bhejne hain? (default: account email)</div>
            <div className="form-group mb-0">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder={user?.email || 'alerts@yourcompany.com'} value={settings.alertEmail || ''} onChange={e => set('alertEmail', e.target.value)} />
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>
                Khali rakhne par account email ({user?.email}) use hogi
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Platform Alerts */}
          <div className="card mb-4">
            <div className="card-title mb-1">📱 Platform Alerts</div>
            <div className="card-sub">Kis platform ke alerts chahiye?</div>
            {[
              { key:'facebook',  icon:'📘', label:'Facebook'  },
              { key:'instagram', icon:'📷', label:'Instagram' },
              { key:'twitter',   icon:'🐦', label:'Twitter'   },
              { key:'linkedin',  icon:'💼', label:'LinkedIn'  },
              { key:'youtube',   icon:'📺', label:'YouTube'   },
            ].map(p => (
              <Toggle key={p.key}
                value={settings.platforms?.[p.key] !== false}
                onChange={v => set(`platforms.${p.key}`, v)}
                label={`${p.icon} ${p.label}`}
                desc={`${p.label} ke alerts`}
              />
            ))}
          </div>

          {/* Abuse Detection Info */}
          <div style={{ background:'#fff0f0', border:'1px solid #ffc0c0', borderRadius:'var(--radius)', padding:20 }}>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:14, fontWeight:700, color:'var(--danger)', marginBottom:10 }}>
              🛡️ Abuse Detection System
            </div>
            <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8 }}>
              Yeh system automatically detect karta hai:
            </div>
            <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6 }}>
              {[
                '🚫 Galiyan aur abusive language (Hindi + English)',
                '🏷️ Unwanted tags aur mentions',
                '⚠️ Offensive content aur threats',
                '📢 Spam-like messages',
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text)' }}>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ marginTop:12, fontSize:11, color:'var(--muted)', background:'#fff', borderRadius:8, padding:'8px 12px' }}>
              💡 Jab detect hoga: Email alert aayega → Inbox mein message highlight hoga → Aap turant reply/hide kar sakte ho
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card mt-4">
        <div className="card-title mb-3">📖 Kaise Kaam Karta Hai?</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {[
            { step:'1', icon:'👤', title:'Koi tag kare', desc:'Facebook/Instagram/Twitter par koi aapko tag ya mention kare' },
            { step:'2', icon:'🔍', title:'System detect kare', desc:'Hamar AI system content analyze karta hai — gali/abuse/tag detect' },
            { step:'3', icon:'📧', title:'Email aaye', desc:'Aapko turant email notification milti hai detail ke saath' },
            { step:'4', icon:'📬', title:'Inbox mein reply', desc:'Inbox page par jao → message dekho → reply ya hide karo' },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:'center', padding:'16px 12px', background:'var(--bg3)', borderRadius:12, border:'1px solid var(--border)' }}>
              <div style={{ width:36,height:36,background:'#0066cc',borderRadius:'50%',color:'#fff',fontWeight:800,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px' }}>{s.step}</div>
              <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{s.title}</div>
              <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
