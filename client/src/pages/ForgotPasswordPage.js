import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(1);     // 1=email, 2=otp+password
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [timer, setTimer]       = useState(0);

  useEffect(() => { if (timer>0) { const t=setTimeout(()=>setTimer(v=>v-1),1000); return ()=>clearTimeout(t); } }, [timer]);

  const sendOTP = async (e) => {
    e?.preventDefault();
    if (!email) return toast.error('Email dalein');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      toast.success('✅ OTP bheja gaya — email check karein');
      setStep(2); setTimer(60); setOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      toast.success('✅ Naya OTP bheja gaya');
      setTimer(60); setOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('6 digit OTP dalein');
    if (password.length < 6) return toast.error('Password 6+ characters ka hona chahiye');
    if (password !== confirm) return toast.error('Passwords match nahi kar rahe');

    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp, password });
      toast.success('🎉 Password change ho gaya — ab login karein');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
      setOtp('');
    } finally { setLoading(false); }
  };

  const formStyle = { background:'#fff', borderRadius:20, padding:36, width:'100%', maxWidth:420, boxShadow:'0 8px 40px rgba(0,0,0,0.12)', border:'1px solid var(--border)' };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20 }}>
      <div style={formStyle}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:64,height:64,background:'linear-gradient(135deg,#0066cc,#0099ff)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 14px' }}>🔑</div>
          <div style={{ fontFamily:"'Poppins',sans-serif",fontSize:22,fontWeight:800,marginBottom:8 }}>
            {step === 1 ? 'Password Reset' : 'Naya Password Set Karein'}
          </div>
          <div style={{ fontSize:13,color:'var(--muted)',lineHeight:1.6 }}>
            {step === 1
              ? 'Apna registered email daalein — OTP bheja jaayega'
              : <>OTP bheja gaya: <strong style={{color:'#0066cc'}}>{email}</strong></>
            }
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={sendOTP}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={email} onChange={e=>setEmail(e.target.value)} required autoFocus />
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? '⟳ Bhej raha hai...' : '📧 OTP Bhejein'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset}>
            <div style={{ fontSize:12,color:'var(--muted)',textAlign:'center',marginBottom:6 }}>6-digit OTP</div>
            <OTPInput value={otp} onChange={setOtp} />

            <div className="form-group">
              <label className="form-label">Naya Password</label>
              <PasswordInput value={password} onChange={e=>setPassword(e.target.value)} required />
              <div style={{fontSize:11,color:'var(--muted)',marginTop:3}}>Minimum 6 characters</div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <PasswordInput value={confirm} onChange={e=>setConfirm(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg"
              disabled={loading || otp.length!==6 || password.length<6}>
              {loading ? '⟳ Set ho raha hai...' : '✅ Password Reset Karein'}
            </button>

            <div style={{ textAlign:'center',marginTop:16,fontSize:13,color:'var(--muted)' }}>
              OTP nahi mila?{' '}
              {timer>0
                ? <span>{timer}s mein resend</span>
                : <button type="button" style={{ background:'none',border:'none',color:'#0066cc',cursor:'pointer',fontWeight:700,fontSize:13 }} onClick={handleResend} disabled={loading}>🔄 Dobara bhejein</button>
              }
            </div>

            <button type="button" style={{ display:'block',margin:'14px auto 0',background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13 }}
              onClick={()=>{ setStep(1); setOtp(''); setPassword(''); setConfirm(''); }}>
              ← Email change karein
            </button>
          </form>
        )}

        <div style={{ marginTop:14,background:'#f0f7ff',borderRadius:8,padding:'10px 14px',fontSize:11,color:'var(--muted)',textAlign:'center' }}>
          🔒 OTP kisi se share na karein • 10 min mein expire hoga
        </div>

        <div style={{ textAlign:'center',marginTop:18,fontSize:13 }}>
          <Link to="/login" style={{ color:'#0066cc',textDecoration:'none',fontWeight:600 }}>← Login pe wapas jao</Link>
        </div>
      </div>
    </div>
  );
}
