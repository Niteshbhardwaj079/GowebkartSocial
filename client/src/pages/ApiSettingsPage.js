import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { HelpIcon, StepGuide, InfoBox, GuideField, FloatingHelp, HelpLink, GUIDES } from '../components/common/HelpSystem';

const apiSettingsService = {
  getSettings:  ()  => api.get('/api-settings'),
  saveFacebook: (d) => api.post('/api-settings/facebook', d),
  saveTwitter:  (d) => api.post('/api-settings/twitter', d),
  saveLinkedIn: (d) => api.post('/api-settings/linkedin', d),
  saveYouTube:  (d) => api.post('/api-settings/youtube', d),
  deleteKeys:   (p) => api.delete(`/api-settings/${p}`),
  getOAuthUrl:  (p) => api.get(`/api-settings/oauth/${p}`),
};

// ── Platform Card ──
function PlatformCard({ platform, icon, color, title, fields, settings, guide, onSave, onDelete, onConnect }) {
  const [open,   setOpen]   = useState(false);
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);
  const isConfigured = settings?.isConfigured;
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    // Validate - empty fields check
    const emptyField = fields.filter(f => f.required).find(f => !form[f.key]?.trim());
    if (emptyField) { toast.error(`${emptyField.label} required hai`); return; }
    setSaving(true);
    try {
      await onSave(form);
      setOpen(false);
      setForm({});
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${isConfigured ? color+'55' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 14,
      boxShadow: isConfigured ? `0 4px 16px ${color}12` : 'var(--shadow2)',
      transition: 'all 0.2s'
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', flexWrap:'wrap' }}>
        <div style={{ width:46, height:46, borderRadius:12, background:color+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
          {icon}
        </div>
        <div style={{ flex:1, minWidth:160 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
            <span style={{ fontSize:14, fontWeight:800 }}>{title}</span>
            <span style={{
              fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20,
              background: isConfigured ? '#e8fff5' : '#fff8e8',
              color: isConfigured ? 'var(--success)' : 'var(--warning)',
              border: `1px solid ${isConfigured ? '#b3f0d8' : '#ffe0a0'}`
            }}>
              {isConfigured ? '✅ Configured' : '⚠️ Setup needed'}
            </span>
          </div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>
            {isConfigured
              ? `Last updated: ${new Date(settings.configuredAt).toLocaleDateString('en-IN')}`
              : 'Keys add karo → Connect karo → Post karo!'}
          </div>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {isConfigured && (
            <button className="btn btn-primary btn-sm" onClick={() => onConnect(platform)}
              style={{ background:`linear-gradient(135deg,${color},${color}cc)` }}>
              🔗 Connect
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setOpen(!open)}>
            {open ? '✕ Close' : isConfigured ? '✏️ Edit Keys' : '+ Setup'}
          </button>
          {isConfigured && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(platform)}>🗑️</button>
          )}
        </div>
      </div>

      {/* Form */}
      {open && (
        <div style={{ padding:'0 18px 18px', borderTop:'1px solid var(--border)', background:'#fafcff' }}>
          <div style={{ marginTop:14 }}>
            <StepGuide {...guide} collapsed={false} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8 }}>
            {fields.map(f => (
              <GuideField key={f.key} label={f.label} helpText={f.help} required={f.required} example={f.example}>
                <input
                  className="form-input"
                  type={f.secret ? 'password' : 'text'}
                  placeholder={f.placeholder}
                  value={form[f.key] || ''}
                  onChange={set(f.key)}
                  autoComplete="off"
                />
              </GuideField>
            ))}
          </div>

          <InfoBox type="warning" dismissible>
            API keys kisi ke saath share mat karo. Ye encrypted store hoti hain.
          </InfoBox>

          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '⟳ Saving...' : '💾 Save & Verify'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setOpen(false); setForm({}); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──
export default function ApiSettingsPage() {
  const [settings, setSettings] = useState({
    facebook: { isConfigured: false },
    twitter:  { isConfigured: false },
    linkedin: { isConfigured: false },
    youtube:  { isConfigured: false },
  });
  const [loading,  setLoading]  = useState(true);
  const [serverOk, setServerOk] = useState(true);

  useEffect(() => {
    apiSettingsService.getSettings()
      .then(r => {
        setSettings(r.data.settings || settings);
        setServerOk(true);
      })
      .catch(e => {
        if (e.response?.status === 404 || !e.response) {
          setServerOk(false);
        }
        // Settings default rahegi - page crash nahi hoga
      })
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    apiSettingsService.getSettings()
      .then(r => setSettings(r.data.settings || settings))
      .catch(() => {});
  };

  const handleSave = (platform) => async (form) => {
    const savers = {
      facebook: apiSettingsService.saveFacebook,
      twitter:  apiSettingsService.saveTwitter,
      linkedin: apiSettingsService.saveLinkedIn,
      youtube:  apiSettingsService.saveYouTube,
    };
    await savers[platform](form);
    toast.success(`✅ ${platform} keys saved!`);
    refresh();
  };

  const handleDelete = async (platform) => {
    if (!window.confirm(`${platform} keys remove karein?`)) return;
    try {
      await apiSettingsService.deleteKeys(platform);
      toast.success('Keys removed');
      refresh();
    } catch { toast.error('Delete failed'); }
  };

  const handleConnect = async (platform) => {
    try {
      const res = await apiSettingsService.getOAuthUrl(platform);
      if (res.data.url) window.location.href = res.data.url;
    } catch (e) {
      toast.error(e.response?.data?.message || `${platform} connect failed`);
    }
  };

  const PLATFORMS = [
    {
      platform:'facebook', icon:'📘', color:'#1877f2', title:'Facebook & Instagram',
      guide: GUIDES.facebook,
      fields:[
        { key:'appId',     label:'App ID',     placeholder:'123456789012345', help:'developers.facebook.com → App → Settings → Basic → App ID', required:true, example:'123456789012345' },
        { key:'appSecret', label:'App Secret', placeholder:'Your App Secret',  help:'Settings → Basic → App Secret → Show', required:true, secret:true },
      ]
    },
    {
      platform:'twitter', icon:'🐦', color:'#1da1f2', title:'Twitter (X)',
      guide: GUIDES.twitter,
      fields:[
        { key:'apiKey',    label:'API Key',    placeholder:'Twitter API Key',    help:'developer.twitter.com → App → Keys and Tokens', required:true },
        { key:'apiSecret', label:'API Secret', placeholder:'Twitter API Secret', help:'Keys and Tokens tab mein milega', required:true, secret:true },
        { key:'bearerToken', label:'Bearer Token', placeholder:'Optional', help:'Advanced use ke liye', required:false },
      ]
    },
    {
      platform:'linkedin', icon:'💼', color:'#0077b5', title:'LinkedIn',
      guide: GUIDES.linkedin,
      fields:[
        { key:'clientId',     label:'Client ID',     placeholder:'LinkedIn Client ID',     help:'linkedin.com/developers → App → Auth tab', required:true },
        { key:'clientSecret', label:'Client Secret', placeholder:'LinkedIn Client Secret', help:'Auth tab mein hi milega', required:true, secret:true },
      ]
    },
    {
      platform:'youtube', icon:'📺', color:'#ff0000', title:'YouTube',
      guide: {
        title: 'YouTube (Google) Setup', color: '#ff0000',
        steps: [
          { text: 'console.cloud.google.com par jaao', link:'https://console.cloud.google.com', linkText:'Google Cloud Console' },
          { text: 'New Project → APIs & Services → YouTube Data API v3 enable karo' },
          { text: 'Credentials → Create → OAuth 2.0 Client ID → Web Application' },
          { text: 'Redirect URI:', code:'http://localhost:5000/api/social/callback/youtube' },
          { text: 'Client ID aur Client Secret copy karo' },
        ]
      },
      fields:[
        { key:'clientId',     label:'Client ID',     placeholder:'Google OAuth Client ID', help:'Cloud Console → Credentials → OAuth 2.0', required:true },
        { key:'clientSecret', label:'Client Secret', placeholder:'Client Secret',          help:'Same page par milega', required:true, secret:true },
      ]
    },
  ];

  const done = PLATFORMS.filter(p => settings?.[p.platform]?.isConfigured).length;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="page-title">🔑 API Settings</div>
          <HelpIcon text="Har social media ke liye developer portal par free account banao → API keys copy karo → Yahan paste karo → Connect!" size={20} />
        </div>
        <div className="page-sub">Social media apps ki keys add karo — tab accounts connect honge</div>
      </div>

      {/* Server warning */}
      {!serverOk && (
        <InfoBox type="warning" title="Server Connect Nahi Hua">
          Server localhost:5000 par nahi chal raha. Terminal mein check karo:
          <code style={{ display:'block', marginTop:6, background:'#fff', padding:'6px 10px', borderRadius:6, fontSize:12 }}>
            cd server → npm run dev
          </code>
          Server start hone ke baad page refresh karo.
        </InfoBox>
      )}

      {/* Progress */}
      <div style={{ background:'#f0f7ff', border:'1px solid #c0d4ff', borderRadius:'var(--radius)', padding:'14px 18px', marginBottom:18 }}>
        <div className="flex justify-between mb-2">
          <span style={{ fontWeight:700, fontSize:13 }}>
            {done === 0 ? '👋 Shuru karo — pehli platform setup karo' :
             done === 4 ? '🎉 Sab platforms configured!' :
             `✅ ${done}/4 platforms configured`}
          </span>
          <span style={{ fontWeight:800, color:'#0066cc', fontSize:16 }}>{done}/4</span>
        </div>
        <div className="progress-wrap">
          <div className="progress-fill" style={{ width:`${(done/4)*100}%` }} />
        </div>
      </div>

      {/* How it works */}
      <InfoBox type="tip" title="Kaise kaam karta hai?">
        <ol style={{ paddingLeft:16, lineHeight:1.9, marginTop:4 }}>
          <li>Platform ke developer portal par <strong>free account</strong> banao</li>
          <li><strong>App ID + Secret</strong> copy karo (guide har card mein hai)</li>
          <li>Yahan paste karo → <strong>Save & Verify</strong></li>
          <li><strong>"Connect"</strong> click karo → Account link ho jayega!</li>
        </ol>
        <div className="flex gap-2 mt-2" style={{ flexWrap:'wrap' }}>
          <HelpLink text="FB Guide"       url="https://developers.facebook.com" type="external" />
          <HelpLink text="Twitter Guide"  url="https://developer.twitter.com"   type="external" />
          <HelpLink text="LinkedIn Guide" url="https://linkedin.com/developers"  type="external" />
        </div>
      </InfoBox>

      {/* Platform Cards */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>⟳</div>
          Loading settings...
        </div>
      ) : (
        PLATFORMS.map(p => (
          <PlatformCard
            key={p.platform}
            {...p}
            settings={settings?.[p.platform]}
            onSave={handleSave(p.platform)}
            onDelete={handleDelete}
            onConnect={handleConnect}
          />
        ))
      )}

      <FloatingHelp pageGuide={{
        title: 'API Settings Help', color: '#0066cc',
        steps:[
          { text: 'Server chal raha hai? Terminal mein: npm run dev' },
          { text: 'Har platform ka developer portal open karo → Free account banao' },
          { text: 'App banao → App ID + Secret copy karo' },
          { text: '"+Setup" click → Keys paste → Save & Verify' },
          { text: '"Connect" se account link karo', link:'/accounts', linkText:'Accounts' },
        ]
      }} />
    </div>
  );
}