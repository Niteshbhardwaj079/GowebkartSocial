import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';

const accountsAPI = {
  getAccounts:    ()  => api.get('/social/accounts'),
  disconnect:     (id)=> api.delete(`/social/accounts/${id}`),
  connectFacebook:()  => api.get('/social/facebook/connect'),
  connectTwitter: ()  => api.get('/social/twitter/connect'),
  connectLinkedIn:()  => api.get('/social/linkedin/connect'),
  diagnostics:    ()  => api.get('/social/diagnostics'),
};

const PLATFORMS = [
  { id:'facebook',  label:'Facebook',  icon:'📘', color:'#1877f2', desc:'Pages + Instagram accounts' },
  { id:'instagram', label:'Instagram', icon:'📷', color:'#e1306c', desc:'Business/Creator account (via Facebook)' },
  { id:'twitter',   label:'Twitter',   icon:'🐦', color:'#1da1f2', desc:'Tweet, replies, DMs' },
  { id:'linkedin',  label:'LinkedIn',  icon:'💼', color:'#0077b5', desc:'Personal + Company pages' },
  { id:'youtube',   label:'YouTube',   icon:'📺', color:'#ff0000', desc:'Upload videos, community posts' },
];

export default function AccountsPage() {
  const { user } = useSelector(s => s.auth);
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const loadAccounts = () => {
    accountsAPI.getAccounts()
      .then(r => setAccounts(r.data.accounts || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAccounts(); }, []);

  // Surface OAuth callback result via query params (?connected=facebook&pages=2&ig=1 / ?error=fb&msg=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    const msg   = params.get('msg');
    if (connected === 'facebook') {
      const pages = params.get('pages') || 0;
      const ig    = params.get('ig')    || 0;
      toast.success(`✅ Facebook connected — ${pages} page(s), ${ig} Instagram account(s)`);
    } else if (connected) {
      toast.success(`✅ ${connected} connected`);
    } else if (error) {
      toast.error(`❌ ${error.toUpperCase()} connect failed: ${msg || 'unknown error'}`);
    }
    if (connected || error) {
      // Clean the URL so refresh doesn't re-trigger
      window.history.replaceState({}, '', '/accounts');
    }
  }, []);

  const handleConnect = async (platform) => {
    try {
      const connectors = { facebook: accountsAPI.connectFacebook, twitter: accountsAPI.connectTwitter, linkedin: accountsAPI.connectLinkedIn };
      if (!connectors[platform]) { toast.info(`${platform} ke liye pehle API Settings mein keys add karein`); window.location.href='/api-settings'; return; }
      const res = await connectors[platform]();
      if (res.data.url) window.location.href = res.data.url;
    } catch (e) { toast.error(e.response?.data?.message || 'Connection failed'); }
  };

  const handleDisconnect = async (id, name) => {
    if (!window.confirm(`${name} ko disconnect karein?`)) return;
    await accountsAPI.disconnect(id);
    toast.success('Account disconnected');
    loadAccounts();
  };

  const connectedIds = accounts.map(a => a.platform);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">🔗 Social Accounts</div>
        <div className="page-sub">
          {accounts.length > 0 ? `${accounts.length} account${accounts.length>1?'s':''} connected` : 'Koi account connect nahi'}
        </div>
      </div>

      {/* Usage */}
      {user?.plan && (
        <div style={{ background:'#f0f7ff', border:'1px solid #c0d4ff', borderRadius:'var(--radius)', padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:13 }}>
            <strong>{accounts.length}</strong> / <strong>{user.plan==='pro'?'Unlimited':user.plan==='basic'?10:3}</strong> accounts used ({user.plan} plan)
          </span>
          {user.plan !== 'pro' && <a href="/plans" className="btn btn-secondary btn-sm">⬆️ Upgrade</a>}
        </div>
      )}

      {/* Platform Cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {PLATFORMS.map(p => {
          const connected = accounts.filter(a => a.platform === p.id);
          const isConnected = connected.length > 0;
          return (
            <div key={p.id} style={{ background:'#fff', border:`2px solid ${isConnected?p.color+'55':'var(--border)'}`, borderRadius:'var(--radius)', padding:'16px 20px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', boxShadow: isConnected?`0 4px 16px ${p.color}12`:'var(--shadow2)' }}>
              <div style={{ width:48, height:48, borderRadius:14, background:p.color+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{p.icon}</div>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:15, fontWeight:800 }}>{p.label}</span>
                  {isConnected && <span style={{ fontSize:10, background:'#e8fff5', color:'#00b86b', border:'1px solid #b3f0d8', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>✅ Connected</span>}
                </div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>{p.desc}</div>
                {connected.map(acc => (
                  <div key={acc._id} style={{ marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
                    {acc.profilePicture && <img src={acc.profilePicture} alt="" style={{ width:20, height:20, borderRadius:'50%' }} />}
                    <span style={{ fontSize:12, fontWeight:600 }}>{acc.displayName || acc.platformUsername}</span>
                    <span style={{ fontSize:10, color:'var(--muted)' }}>{acc.accountType}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {isConnected ? (
                  connected.map(acc => (
                    <button key={acc._id} className="btn btn-danger btn-sm" onClick={() => handleDisconnect(acc._id, acc.displayName||p.label)}>
                      🔗 Disconnect
                    </button>
                  ))
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => handleConnect(p.id)} style={{ background:`linear-gradient(135deg,${p.color},${p.color}cc)` }}>
                    + Connect {p.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* API Settings Notice */}
      <div style={{ marginTop:20, background:'#fff8e8', border:'1px solid #ffe0a0', borderRadius:'var(--radius)', padding:'12px 16px', fontSize:13 }}>
        💡 <strong>Pehle API keys add karein:</strong> Accounts connect karne ke liye pehle <a href="/api-settings" style={{ color:'#0066cc', fontWeight:700 }}>API Settings</a> mein app keys daalni hongi.
      </div>
    </div>
  );
}
