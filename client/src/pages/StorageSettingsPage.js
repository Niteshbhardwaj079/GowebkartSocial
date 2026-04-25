import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';
import { HelpIcon, StepGuide, InfoBox, GuideField, FloatingHelp, HelpLink, GUIDES } from '../components/common/HelpSystem';

const storageAPI = {
  getSettings:    ()         => api.get('/storage/settings'),
  setActive:      (provider) => api.put('/storage/settings/active', { provider }),
  saveCloudinary: (d)        => api.post('/storage/settings/cloudinary', d),
  saveS3:         (d)        => api.post('/storage/settings/aws-s3', d),
  saveImageKit:   (d)        => api.post('/storage/settings/imagekit', d),
  test:           (provider) => api.get(`/storage/settings/test/${provider}`),
  remove:         (provider) => api.delete(`/storage/settings/${provider}`),
};

function ProviderCard({ id, name, icon, color, tagline, freeLimit, pricing, bestFor, guide, formFields, settings, onSave, onRemove, onTest, onSetActive, isDemo }) {
  const [open,    setOpen]    = useState(false);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [testing, setTesting] = useState(false);

  const isConfigured = settings?.isConfigured;
  const isActive     = settings?.isActive;
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (isDemo) return;
    setSaving(true);
    try { await onSave(id, form); setOpen(false); setForm({}); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    try { await onTest(id); }
    finally { setTesting(false); }
  };

  return (
    <div style={{ background:'#fff', border:`2px solid ${isActive ? color : isConfigured ? color+'44' : 'var(--border)'}`, borderRadius:'var(--radius)', overflow:'hidden', marginBottom:14, boxShadow: isActive ? `0 4px 20px ${color}22` : 'var(--shadow2)', transition:'all 0.2s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', flexWrap:'wrap' }}>
        <div style={{ width:50, height:50, borderRadius:14, background:color+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0, border:`1.5px solid ${color}30` }}>{icon}</div>
        <div style={{ flex:1, minWidth:160 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontSize:15, fontWeight:800 }}>{name}</span>
            {isActive && <span style={{ fontSize:10, background:color, color:'#fff', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>✓ ACTIVE</span>}
            {isConfigured && !isActive && <span style={{ fontSize:10, background:'#e8fff5', color:'var(--success)', border:'1px solid #b3f0d8', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>✅ Ready</span>}
          </div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>{tagline}</div>
          <div style={{ display:'flex', gap:6, marginTop:5, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, background:'#e8fff5', color:'var(--success)', padding:'1px 7px', borderRadius:20, fontWeight:600 }}>🆓 {freeLimit}</span>
            <span style={{ fontSize:11, background:'#f0f7ff', color:'#0066cc', padding:'1px 7px', borderRadius:20, fontWeight:600 }}>💰 {pricing}</span>
            <span style={{ fontSize:11, background:'#f8f8f8', color:'var(--muted)', padding:'1px 7px', borderRadius:20, fontWeight:600 }}>Best: {bestFor}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {isConfigured && !isActive && <button className="btn btn-primary btn-sm" onClick={() => onSetActive(id)}>⚡ Use This</button>}
          {isConfigured && <button className="btn btn-secondary btn-sm" onClick={handleTest} disabled={testing}>{testing?'⟳':'🔌 Test'}</button>}
          <button className="btn btn-secondary btn-sm" onClick={() => setOpen(!open)}>{open?'✕':isConfigured?'✏️ Edit':'+ Setup'}</button>
          {isConfigured && <button className="btn btn-danger btn-sm" onClick={() => onRemove(id)}>🗑️</button>}
        </div>
      </div>

      {open && (
        <div style={{ padding:'0 18px 18px', borderTop:'1px solid var(--border)', background:'#fafcff' }}>
          <div style={{ marginTop:14 }}>
            <StepGuide {...guide} collapsed={false} />
          </div>
          {isDemo ? (
            <div style={{ background:'#fff8e8', border:'1px solid #ffe0a0', borderRadius:10, padding:'14px 16px', marginTop:8 }}>
              <div style={{ fontWeight:700, color:'#dd8800', marginBottom:6 }}>🎭 Demo Mode</div>
              <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7 }}>
                Demo mein apni keys add nahi ho sakti. Real account banane ke baad yahan apni Cloudinary/S3/ImageKit keys add karein.
              </div>
              <button className="btn btn-ghost btn-sm mt-2" onClick={() => setOpen(false)}>Close</button>
            </div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8 }}>
                {formFields.map(f => (
                  <GuideField key={f.key} label={f.label} helpText={f.help} required={f.required} example={f.example}>
                    <input className="form-input" type={f.secret?'password':'text'} placeholder={f.placeholder} value={form[f.key]||''} onChange={set(f.key)} />
                  </GuideField>
                ))}
              </div>
              <InfoBox type="warning" dismissible>API keys secure hain — encrypted store hoti hain. Share mat karo.</InfoBox>
              <div className="flex gap-3">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'⟳ Connecting...':'💾 Save & Verify'}</button>
                <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function StorageSettingsPage() {
  const { user } = useSelector(s => s.auth);
  const isDemo   = user?.isDemo || false;
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { storageAPI.getSettings().then(r => setSettings(r.data.settings)).catch(() => {}).finally(() => setLoading(false)); }, []);
  const refresh = () => storageAPI.getSettings().then(r => setSettings(r.data.settings));

  const handleSave = async (provider, form) => {
    const s = { cloudinary: storageAPI.saveCloudinary, aws_s3: storageAPI.saveS3, imagekit: storageAPI.saveImageKit };
    await s[provider](form); toast.success(`✅ ${provider} connected!`); refresh();
  };
  const handleTest = async (p) => { const r = await storageAPI.test(p); r.data.success ? toast.success(r.data.message) : toast.error(r.data.message); };
  const handleSetActive = async (p) => { await storageAPI.setActive(p); toast.success(`✅ ${p} active storage!`); refresh(); };
  const handleRemove = async (p) => { if (!window.confirm(`${p} keys remove?`)) return; await storageAPI.remove(p); toast.success('Removed'); refresh(); };

  const PROVIDERS = [
    {
      id:'cloudinary', name:'Cloudinary', icon:'☁️', color:'#0088cc',
      tagline:'Images + Videos — CDN included, Auto-optimization',
      freeLimit:'25GB + 25GB/mo bandwidth', pricing:'~₹1.2/GB', bestFor:'Most users',
      guide: GUIDES.cloudinary,
      formFields:[
        { key:'cloudName', label:'Cloud Name',  placeholder:'your-cloud-name',     help:'Dashboard par top-left mein bada naam dikhega', required:true, example:'mycompany123' },
        { key:'apiKey',    label:'API Key',      placeholder:'123456789012345',     help:'Settings → Access Keys section mein milega', required:true },
        { key:'apiSecret', label:'API Secret',   placeholder:'Your API Secret',     help:'Access Keys section mein hi milega — private rakho!', required:true, secret:true },
        { key:'folder',    label:'Folder Name',  placeholder:'social-saas',        help:'Files kahan save hon (optional) — default: social-saas', required:false, example:'my-company-media' },
      ]
    },
    {
      id:'aws_s3', name:'AWS S3', icon:'🪣', color:'#ff9900',
      tagline:'Enterprise storage — unlimited scale, very cheap',
      freeLimit:'5GB (first 12 months)', pricing:'~₹1.8/GB', bestFor:'Large files',
      guide: GUIDES.aws_s3,
      formFields:[
        { key:'accessKeyId',     label:'Access Key ID',     placeholder:'AKIAIOSFODNN7EXAMPLE',   help:'IAM → Users → Security Credentials → Create Access Key', required:true },
        { key:'secretAccessKey', label:'Secret Access Key', placeholder:'Secret Key here',        help:'Access Key banate waqt ek baar dikhta hai — copy kar lo!', required:true, secret:true },
        { key:'region',          label:'Region',            placeholder:'ap-south-1',             help:'ap-south-1 = Mumbai (India ke liye best)', required:true, example:'ap-south-1' },
        { key:'bucketName',      label:'Bucket Name',       placeholder:'my-socialsaas-bucket',   help:'S3 mein aapne jo bucket banaya uska exact naam', required:true },
      ]
    },
    {
      id:'imagekit', name:'ImageKit', icon:'🖼️', color:'#9b59b6',
      tagline:'Image optimization + transformation CDN',
      freeLimit:'20GB + 20GB/mo bandwidth', pricing:'~₹0.6/GB', bestFor:'Image-heavy apps',
      guide: GUIDES.imagekit,
      formFields:[
        { key:'publicKey',   label:'Public Key',    placeholder:'public_xxxxxxxxxxxx',             help:'imagekit.io → Developer Options → Public Key', required:true },
        { key:'privateKey',  label:'Private Key',   placeholder:'private_xxxxxxxxxxxx',            help:'Developer Options → Private Key — private rakho!', required:true, secret:true },
        { key:'urlEndpoint', label:'URL Endpoint',  placeholder:'https://ik.imagekit.io/your_id', help:'Dashboard → URL-endpoint field mein milega', required:true, example:'https://ik.imagekit.io/abc123' },
      ]
    },
  ];

  const activeProvider = settings?.activeProvider;
  const configuredCount = PROVIDERS.filter(p => settings?.[p.id]?.isConfigured).length;

  if (loading) return <div className="page"><div style={{padding:40,color:'var(--muted)'}}>⟳ Loading...</div></div>;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="page-title">💾 Storage Settings</div>
          <HelpIcon text="Apna cloud storage choose karo jahan images/videos upload honge. Cloudinary sabse aasan hai shuru karne ke liye — 25GB free milta hai!" size={20} position="right" />
        </div>
        <div className="page-sub">Ek provider setup karo — phir images/videos upload honge</div>
      </div>

      {/* Status */}
      <div style={{ background: activeProvider && activeProvider!=='local' ? '#f0f7ff' : '#fff8e8', border:`1px solid ${activeProvider && activeProvider!=='local' ? '#c0d4ff' : '#ffe0a0'}`, borderRadius:'var(--radius)', padding:'14px 18px', marginBottom:18 }}>
        <div className="flex justify-between items-center">
          <div>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>
              {activeProvider && activeProvider!=='local'
                ? `✅ Active: ${PROVIDERS.find(p=>p.id===activeProvider)?.name}`
                : '⚠️ Storage configure nahi — images upload nahi honge!'}
            </div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>
              {activeProvider && activeProvider!=='local' ? 'Files yahan store ho rahi hain' : 'Koi ek provider neeche se setup karo'}
            </div>
          </div>
          <div style={{ fontSize:24, fontWeight:800, color:'#0066cc' }}>{configuredCount}/3</div>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {isDemo && (
        <div style={{ background:'linear-gradient(135deg,#f0f7ff,#e8f4ff)', border:'1.5px solid #0066cc44', borderRadius:'var(--radius)', padding:'14px 18px', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:28 }}>🎭</span>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:'#0066cc', marginBottom:4 }}>Demo Mode — Hamari Storage Use Ho Rahi Hai</div>
              <div style={{ fontSize:13, color:'var(--muted)' }}>
                Demo mein images humari Cloudinary pe upload hongi. Real account banane ke baad aap apni storage add kar sakte hain.
              </div>
            </div>
          </div>
        </div>
      )}

      <InfoBox type="tip" title="Kaise kaam karta hai?">
        <ol style={{ paddingLeft:16, lineHeight:1.9, marginTop:4 }}>
          <li>Neeche se koi ek provider choose karo — <strong>Cloudinary recommend</strong> (easiest)</li>
          <li>Unka <strong>free account</strong> banao (link har card mein diya hai)</li>
          <li>API keys copy karo → yahan paste karo → <strong>Save & Verify</strong></li>
          <li><strong>"Use This"</strong> click karo → Ab images upload hone lagenge!</li>
        </ol>
        <div className="flex gap-2 mt-2" style={{ flexWrap:'wrap' }}>
          <HelpLink text="Cloudinary Free Account" url="https://cloudinary.com/users/register_free" type="external" />
          <HelpLink text="AWS S3 Free Tier"        url="https://aws.amazon.com/s3/pricing/"         type="external" />
          <HelpLink text="ImageKit Free Account"   url="https://imagekit.io/registration"           type="external" />
        </div>
      </InfoBox>

      {/* Comparison quick view */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
        {PROVIDERS.map(p => (
          <div key={p.id} style={{ background:'#fff', border:`1px solid ${settings?.[p.id]?.isConfigured ? p.color+'44':'var(--border)'}`, borderRadius:10, padding:'12px 14px', textAlign:'center', cursor:'pointer' }} onClick={() => {}}>
            <div style={{ fontSize:24, marginBottom:4 }}>{p.icon}</div>
            <div style={{ fontSize:13, fontWeight:700 }}>{p.name}</div>
            <div style={{ fontSize:11, color:'var(--success)', fontWeight:600 }}>🆓 {p.freeLimit}</div>
          </div>
        ))}
      </div>

      {PROVIDERS.map(p => (
        <ProviderCard key={p.id} {...p}
          isDemo={isDemo}
          settings={{ ...settings?.[p.id], isActive: activeProvider===p.id }}
          onSave={handleSave} onRemove={handleRemove} onTest={handleTest} onSetActive={handleSetActive} />
      ))}

      <FloatingHelp pageGuide={{ title:'Storage Setup Help', color:'#0066cc', steps:[
        { text:'Cloudinary recommend hai — fastest setup' },
        { text:'cloudinary.com par free account banao', link:'https://cloudinary.com/users/register_free', linkText:'Cloudinary Free' },
        { text:'Dashboard → Cloud Name + API Key + API Secret copy karo' },
        { text:'Yahan paste karo → Save & Verify → Use This click karo' },
        { text:'Ab Create Post mein images upload hone lagenge!', link:'/create', linkText:'Create Post' },
      ]}} />
    </div>
  );
}