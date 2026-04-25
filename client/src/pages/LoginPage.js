import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser, demoLogin } from '../store';
import api from '../services/api';
import { toast } from 'react-toastify';
import PasswordInput from '../components/common/PasswordInput';

function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.padEnd(6, '').split('').slice(0,6);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const d = [...digits]; d[i] = val.slice(-1);
    onChange(d.join('').replace(/ /g,''));
    if (val && i < 5) inputs.current[i+1]?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key==='Backspace' && !digits[i] && i>0) inputs.current[i-1]?.focus();
  };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (p.length===6) onChange(p);
  };

  return (
    <div style={{ display:'flex', gap:10, justifyContent:'center', margin:'20px 0' }}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} ref={el=>inputs.current[i]=el} type="text" inputMode="numeric" maxLength={1}
          value={digits[i]===undefined||digits[i]===' '?'':digits[i]}
          onChange={e=>handleChange(i,e.target.value)}
          onKeyDown={e=>handleKey(i,e)} onPaste={handlePaste}
          style={{ width:50,height:58,textAlign:'center',fontSize:26,fontWeight:900,border:`2px solid ${digits[i]&&digits[i]!==' '?'#0066cc':'var(--border)'}`,borderRadius:10,outline:'none',background:digits[i]&&digits[i]!==' '?'#f0f7ff':'#fff',color:'#1a2332',fontFamily:'monospace',transition:'all 0.15s' }} />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const [tab, setTab]           = useState('login');
  const [otpMode, setOtpMode]   = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpVal, setOtpVal]     = useState('');
  const [timer, setTimer]       = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', companyName:'' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useSelector(s => s.auth);

  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated, navigate]);
  useEffect(() => { if (timer>0) { const t=setTimeout(()=>setTimer(v=>v-1),1000); return ()=>clearTimeout(t); } }, [timer]);

  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tab==='login') {
      const res = await dispatch(loginUser({ email:form.email, password:form.password }));
      if (res?.payload?.requireOTP || res?.error) {
        const payload = res.payload || {};
        if (payload.requireOTP || (typeof payload==='string' && payload.includes('OTP'))) {
          setOtpEmail(form.email); setOtpMode(true); setTimer(60);
        }
      }
    } else {
      const res = await dispatch(registerUser(form));
      if (res?.payload?.requireOTP || res?.payload?.email) {
        setOtpEmail(form.email); setOtpMode(true); setTimer(60);
      }
    }
  };

  const handleVerify = async () => {
    if (otpVal.replace(/ /g,'').length!==6) return toast.error('6 digit OTP dalein');
    setVerifying(true);
    try {
      const res = await api.post('/auth/verify-otp', { email:otpEmail, otp:otpVal });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        toast.success('🎉 Email verify ho gaya!');
        window.location.href = '/dashboard';
      }
    } catch(e) { toast.error(e.response?.data?.message||'OTP galat hai'); setOtpVal(''); }
    finally { setVerifying(false); }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { email:otpEmail });
      toast.success('✅ Naya OTP bheja gaya!'); setTimer(60); setOtpVal('');
    } catch(e) { toast.error(e.response?.data?.message||'Failed'); }
  };

  const formStyle = { background:'#fff', borderRadius:20, padding:36, width:'100%', maxWidth:380, boxShadow:'0 8px 40px rgba(0,0,0,0.12)', border:'1px solid var(--border)' };

  // OTP Screen
  if (otpMode) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={formStyle}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:64,height:64,background:'linear-gradient(135deg,#0066cc,#0099ff)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 14px' }}>📧</div>
          <div style={{ fontFamily:"'Poppins',sans-serif",fontSize:22,fontWeight:800,marginBottom:8 }}>Email Verify Karein</div>
          <div style={{ fontSize:13,color:'var(--muted)',lineHeight:1.6 }}>
            <strong style={{color:'#0066cc'}}>{otpEmail}</strong> par 6-digit OTP bheja gaya hai
          </div>
        </div>

        <OTPInput value={otpVal} onChange={setOtpVal} />

        <button className="btn btn-primary w-full btn-lg" onClick={handleVerify} disabled={verifying||otpVal.replace(/ /g,'').length!==6}>
          {verifying?'⟳ Verify ho raha hai...':'✅ Verify Karein'}
        </button>

        <div style={{ textAlign:'center',marginTop:16,fontSize:13,color:'var(--muted)' }}>
          OTP nahi mila?{' '}
          {timer>0 ? <span>{timer}s mein resend</span> :
            <button style={{ background:'none',border:'none',color:'#0066cc',cursor:'pointer',fontWeight:700,fontSize:13 }} onClick={handleResend}>🔄 Dobara bhejein</button>}
        </div>

        <div style={{ marginTop:14,background:'#f0f7ff',borderRadius:8,padding:'10px 14px',fontSize:11,color:'var(--muted)',textAlign:'center' }}>
          🔒 OTP kisi se share na karein • 10 min mein expire hoga
        </div>
        <button style={{ display:'block',margin:'14px auto 0',background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13 }} onClick={()=>setOtpMode(false)}>← Wapas jao</button>
      </div>
    </div>
  );

  // Login Screen
  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg)', overflow:'hidden' }}>
      {/* Left Hero */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:40,position:'relative' }}>
        <div style={{ position:'absolute',width:500,height:500,background:'radial-gradient(circle,rgba(0,102,204,0.07) 0%,transparent 70%)',top:'50%',left:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none' }} />
        <div style={{ maxWidth:460,textAlign:'center',position:'relative' }}>
          <div style={{ fontFamily:"'Poppins',sans-serif",fontSize:42,fontWeight:800,lineHeight:1.2,marginBottom:16,color:'var(--text)' }}>
            Manage all your{' '}
            <span style={{ background:'linear-gradient(135deg,#0066cc,#0099ff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>social media</span>
            {' '}from one place
          </div>
          <p style={{ color:'var(--muted)',marginBottom:32,fontSize:15,lineHeight:1.7 }}>
            Schedule posts, AI captions, unified inbox — sab free mein shuru karein!
          </p>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {[['📅','Smart Scheduler','Auto-post at best times'],['🤖','AI Writer','Unlimited captions Hindi+English'],['📬','Unified Inbox','FB, IG, Twitter, LinkedIn'],['🔒','OTP Secured','Fake accounts nahi bante'],['📊','Analytics','Sab platforms ka data']].map(([ic,t,d],i)=>(
              <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'#fff',border:'1px solid var(--border)',borderRadius:10,boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ width:34,height:34,background:'#e8f0ff',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0 }}>{ic}</div>
                <div style={{ textAlign:'left' }}><div style={{ fontSize:13,fontWeight:700 }}>{t}</div><div style={{ fontSize:11,color:'var(--muted)' }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div style={{ width:440,background:'#fff',borderLeft:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',padding:36 }}>
        <div style={{ width:'100%',maxWidth:340 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:24,justifyContent:'center' }}>
            <div style={{ width:34,height:34,background:'linear-gradient(135deg,#0066cc,#0099ff)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>⚡</div>
            <span style={{ fontFamily:"'Poppins',sans-serif",fontSize:18,fontWeight:800 }}>Social<span style={{color:'#0066cc'}}>SAAS</span></span>
          </div>

          <div className="toggle-wrap mb-4">
            {['login','register'].map(t=>(
              <div key={t} className={`toggle-btn ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
                {t==='login'?'Sign In':'Create Account'}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {tab==='register' && <>
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" placeholder="Rahul Sharma" value={form.name} onChange={set('name')} required /></div>
              <div className="form-group"><label className="form-label">Company (Optional)</label><input className="form-input" placeholder="My Business" value={form.companyName} onChange={set('companyName')} /></div>
            </>}
            <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required /></div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <PasswordInput value={form.password} onChange={set('password')} required />
              {tab==='register'&&<div style={{fontSize:11,color:'var(--muted)',marginTop:3}}>Minimum 6 characters</div>}
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading?'⟳ Please wait...':tab==='login'?'Sign In →':'Create Account →'}
            </button>
            {tab==='login' && (
              <div style={{ textAlign:'right',marginTop:10 }}>
                <Link to="/forgot-password" style={{ color:'#0066cc',fontSize:12,textDecoration:'none',fontWeight:600 }}>
                  Password bhool gaye?
                </Link>
              </div>
            )}
          </form>

          <div style={{ position:'relative',textAlign:'center',margin:'16px 0' }}>
            <div style={{ position:'absolute',top:'50%',left:0,right:0,height:1,background:'var(--border)' }} />
            <span style={{ position:'relative',background:'#fff',padding:'0 10px',fontSize:12,color:'var(--muted)' }}>ya</span>
          </div>

          <button className="btn btn-secondary w-full" onClick={()=>dispatch(demoLogin())} disabled={loading}>🎭 Demo Try Karein</button>

          {tab==='register'&&(
            <div style={{ marginTop:14,background:'#f0f7ff',borderRadius:8,padding:'10px 12px',fontSize:11,color:'var(--muted)',textAlign:'center' }}>
              🔒 Register ke baad email par OTP aayega.<br/>Sirf real email se account ban sakta hai!
            </div>
          )}
          <p style={{ textAlign:'center',fontSize:11,color:'var(--muted)',marginTop:14 }}>Terms & Privacy Policy se agree karte hain</p>
        </div>
      </div>
    </div>
  );
}
