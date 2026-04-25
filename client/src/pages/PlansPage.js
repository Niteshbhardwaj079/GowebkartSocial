import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';

const payAPI = {
  getConfig:    ()           => api.get('/payment/config'),
  createOrder:  (d)          => api.post('/payment/order', d),
  verifyPayment:(d)          => api.post('/payment/verify', d),
  getSubscription: ()        => api.get('/payment/subscription'),
  getHistory:   ()           => api.get('/payment/history'),
};

const loadRazorpay = () => new Promise(resolve => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload  = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

export function ExpiryBanner({ info }) {
  if (!info?.showBanner) return null;
  const c = info.urgency==='high' ? { bg:'#fff0f0',border:'#ffcccc',text:'#e53e3e' } : info.urgency==='medium' ? { bg:'#fff8e8',border:'#ffe0a0',text:'#dd8800' } : { bg:'#f0f7ff',border:'#c0d4ff',text:'#0066cc' };
  return (
    <div style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:'var(--radius)', padding:'12px 18px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:22 }}>{info.urgency==='high'?'🚨':info.urgency==='medium'?'⚠️':'📢'}</span>
        <div>
          <div style={{ fontWeight:800, fontSize:13, color:c.text }}>
            {info.isExpired ? '❌ Plan Expire Ho Gaya!' : `${info.daysLeft} din mein ${info.plan?.toUpperCase()} plan expire hoga`}
          </div>
          {info.endDate && <div style={{ fontSize:11, color:'var(--muted)' }}>Valid till: {new Date(info.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>}
        </div>
      </div>
      <a href="/plans" style={{ background:c.text, color:'#fff', textDecoration:'none', padding:'7px 18px', borderRadius:8, fontWeight:700, fontSize:12, whiteSpace:'nowrap' }}>⚡ Renew Karein</a>
    </div>
  );
}

export default function PlansPage() {
  const { user } = useSelector(s => s.auth);
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [payConfig, setPayConfig] = useState(null);
  const [sub, setSub] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('plans');

  useEffect(() => {
    payAPI.getConfig().then(r => setPayConfig(r.data)).catch(()=>{});
    payAPI.getSubscription().then(r => setSub(r.data.subscription)).catch(()=>{});
    payAPI.getHistory().then(r => setHistory(r.data.payments||[])).catch(()=>{});
  }, []);

  const PLANS = [
    { name:'free',  label:'Free',  price:{monthly:0,yearly:0},    color:'var(--muted)', popular:false, badge:null,
      features:['30 posts/month','3 social accounts','5 AI uses/day','Basic analytics','Content calendar'],
      missing:['Ads Manager','Bulk Upload','Advanced Analytics'] },
    { name:'basic', label:'Basic', price:{monthly:999,yearly:799}, color:'#0066cc', popular:true, badge:'⭐ Most Popular',
      features:['100 posts/month','10 social accounts','20 AI uses/day','Advanced analytics','Ads Manager','Bulk CSV','Priority support'],
      missing:['White Label','API Access'] },
    { name:'pro',   label:'Pro',   price:{monthly:2499,yearly:1999},color:'#7c3aed', popular:false, badge:'🚀 Best Value',
      features:['Unlimited posts','Unlimited accounts','Unlimited AI','Full analytics','Ads Manager','White Label','API access','Dedicated support'],
      missing:[] },
  ];

  const handleBuy = async (plan) => {
    if (plan.name==='free') return;
    if (!payConfig?.isConfigured) { toast.info('Payment gateway setup nahi hai. Admin se contact karein.'); return; }
    setLoading(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) { toast.error('Razorpay load nahi hua. Refresh karein.'); setLoading(false); return; }

      const { data } = await payAPI.createOrder({ plan: plan.name, billingCycle: billing });
      const { order, userInfo } = data;

      new window.Razorpay({
        key:         payConfig.keyId,
        amount:      order.amount,
        currency:    order.currency,
        name:        'SocialSaaS',
        description: `${plan.label} Plan — ${billing==='yearly'?'Yearly':'Monthly'}`,
        order_id:    order.id,
        prefill:     { name: userInfo.name, email: userInfo.email },
        theme:       { color: plan.color },
        modal:       { ondismiss: () => setLoading(false) },
        handler: async (res) => {
          try {
            const vRes = await payAPI.verifyPayment({
              razorpayOrderId:   res.razorpay_order_id,
              razorpayPaymentId: res.razorpay_payment_id,
              razorpaySignature: res.razorpay_signature,
              plan: plan.name, billingCycle: billing,
            });
            if (vRes.data.success) {
              toast.success(`🎉 ${plan.label} Plan activate ho gaya! Email check karein.`);
              setTimeout(() => window.location.reload(), 2000);
            }
          } catch { toast.error('Payment verify nahi hua. Support se contact karein.'); }
          finally   { setLoading(false); }
        },
      }).open();
    } catch(e) { toast.error(e.response?.data?.message||'Payment start nahi hua'); setLoading(false); }
  };

  const price    = (p) => p.price[billing];
  const total    = (p) => billing==='yearly' ? p.price.yearly*12 : p.price.monthly;
  const savings  = (p) => billing==='yearly' ? (p.price.monthly - p.price.yearly)*12 : 0;

  return (
    <div className="page fade-in">
      {sub?.showBanner && <ExpiryBanner info={sub} />}

      <div style={{ display:'flex', gap:4, marginBottom:20 }}>
        {[['plans','💎 Plans'],['history','📋 History']].map(([id,label]) => (
          <button key={id} className={`btn btn-sm ${tab===id?'btn-primary':'btn-secondary'}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'plans' && <>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div className="page-title" style={{ fontSize:26 }}>💎 Choose Your Plan</div>
          <div className="page-sub" style={{ marginTop:6 }}>Start free, upgrade jab chahein. Kabhi bhi cancel kar sakte ho.</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:14 }}>
            <div className="toggle-wrap" style={{ width:200 }}>
              <div className={`toggle-btn ${billing==='monthly'?'active':''}`} onClick={()=>setBilling('monthly')}>Monthly</div>
              <div className={`toggle-btn ${billing==='yearly'?'active':''}`}  onClick={()=>setBilling('yearly')}>
                Yearly <span style={{ fontSize:9, background:'#00b86b', color:'#fff', padding:'1px 5px', borderRadius:10, marginLeft:3, fontWeight:700 }}>-20%</span>
              </div>
            </div>
            {billing==='yearly' && <span style={{ fontSize:12, color:'var(--success)', fontWeight:700 }}>🎉 2 months FREE!</span>}
          </div>
        </div>

        <div className="grid grid-3" style={{ maxWidth:880, margin:'0 auto 24px' }}>
          {PLANS.map((plan, i) => {
            const isCurrent = user?.plan === plan.name;
            return (
              <div key={i} style={{ background:'#fff', border:`2px solid ${plan.popular?plan.color:isCurrent?plan.color+'66':'var(--border)'}`, borderRadius:'var(--radius)', padding:22, position:'relative', boxShadow:plan.popular?`0 8px 28px ${plan.color}20`:'var(--shadow2)', transform:plan.popular?'translateY(-4px)':'none' }}>
                {plan.badge && <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:plan.color, color:'#fff', fontSize:10, fontWeight:800, padding:'2px 14px', borderRadius:20, whiteSpace:'nowrap' }}>{plan.badge}</div>}
                {isCurrent && <div style={{ position:'absolute', top:10, right:10, background:'#e8fff5', color:'var(--success)', border:'1px solid #b3f0d8', fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:20 }}>✓ Current</div>}

                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:17, fontWeight:800 }}>{plan.label}</div>
                <div style={{ margin:'10px 0' }}>
                  <span style={{ fontFamily:"'Poppins',sans-serif", fontSize:32, fontWeight:900, color:plan.name==='free'?'var(--muted)':plan.color }}>₹{price(plan)}</span>
                  <span style={{ fontSize:13, color:'var(--muted)' }}>/mo</span>
                  {billing==='yearly' && plan.name!=='free' && <>
                    <div style={{ fontSize:11, marginTop:3 }}>
                      <span style={{ color:'var(--muted)', textDecoration:'line-through' }}>₹{plan.price.monthly}/mo</span>
                      {' '}<span style={{ color:'var(--success)', fontWeight:700 }}>₹{savings(plan)} save/yr</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>₹{total(plan)}/year billed</div>
                  </>}
                </div>

                <div style={{ height:1, background:'var(--border)', margin:'12px 0' }} />
                {plan.features.map((f,j) => <div key={j} style={{ display:'flex', gap:8, fontSize:12, color:'var(--text)', padding:'3px 0' }}><span style={{ color:'var(--success)', fontWeight:700, flexShrink:0 }}>✓</span>{f}</div>)}
                {plan.missing.map((f,j)  => <div key={j} style={{ display:'flex', gap:8, fontSize:12, color:'var(--muted)', padding:'3px 0' }}><span style={{ flexShrink:0 }}>✗</span>{f}</div>)}

                <button className="btn w-full" onClick={() => !isCurrent && plan.name!=='free' && handleBuy(plan)}
                  disabled={loading || isCurrent || plan.name==='free'}
                  style={{ marginTop:16, justifyContent:'center', padding:12,
                    background: isCurrent?'#f0f4f8' : plan.name==='free'?'var(--bg3)' : `linear-gradient(135deg,${plan.color},${plan.color}bb)`,
                    color: isCurrent||plan.name==='free' ? 'var(--muted)' : '#fff',
                    border: isCurrent?'1px solid var(--border)':'none',
                    cursor: isCurrent||plan.name==='free'?'default':'pointer',
                  }}>
                  {loading ? '⟳ Processing...' : isCurrent ? '✓ Current Plan' : plan.name==='free' ? 'Free Plan' : `⚡ Get ${plan.label} — ₹${price(plan)}/mo`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment methods */}
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6 }}>Secure Payment — Powered by Razorpay</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
            {['💳 Card','🏦 Net Banking','📱 UPI','💰 Paytm','📲 PhonePe','🏪 Wallet'].map(m => (
              <span key={m} style={{ fontSize:11, background:'#f0f4f8', padding:'3px 9px', borderRadius:20, color:'var(--muted)', fontWeight:600 }}>{m}</span>
            ))}
          </div>
        </div>

        {!payConfig?.isConfigured && (
          <div style={{ background:'#fff8e8', border:'1.5px solid #ffe0a0', borderRadius:'var(--radius)', padding:'16px 20px', maxWidth:560, margin:'0 auto', textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>⚠️</div>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>Payment Gateway Setup Pending</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:12, lineHeight:1.7 }}>
              Abhi Razorpay configure nahi hua hai.<br/>
              <strong>Server ke <code style={{ background:'#fff', padding:'1px 6px', borderRadius:4 }}>.env</code> mein add karo:</strong>
            </div>
            <div style={{ background:'#1a2332', color:'#7fff7f', padding:'10px 14px', borderRadius:8, fontSize:12, fontFamily:'monospace', textAlign:'left', marginBottom:12 }}>
              RAZORPAY_KEY_ID=rzp_test_xxxx<br/>
              RAZORPAY_KEY_SECRET=xxxx
            </div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>
              razorpay.com → Free account → Settings → API Keys
            </div>
          </div>
        )}

        {sub?.hasSubscription && (
          <div style={{ background:'#f0f7ff', border:'1px solid #c0d4ff', borderRadius:'var(--radius)', padding:'12px 18px', maxWidth:550, margin:'14px auto 0', fontSize:13, display:'flex', justifyContent:'space-between' }}>
            <span><strong>{sub.plan?.toUpperCase()}</strong> Plan active</span>
            <span style={{ color: sub.daysLeft<=7?'var(--danger)':'var(--success)', fontWeight:700 }}>{sub.daysLeft>0?`${sub.daysLeft} days left`:'Expired'}</span>
          </div>
        )}
      </>}

      {tab === 'history' && (
        <div className="card">
          <div className="card-title mb-3">📋 Payment History</div>
          {history.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>
              <div style={{ fontSize:32, mb:12 }}>💳</div>
              <div>Koi payment nahi hua abhi tak</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Plan</th><th>Billing</th><th>Amount</th><th>Order ID</th><th>Status</th></tr></thead>
                <tbody>
                  {history.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontSize:12, color:'var(--muted)' }}>{new Date(p.paidAt).toLocaleDateString('en-IN')}</td>
                      <td><strong style={{ textTransform:'uppercase' }}>{p.plan}</strong></td>
                      <td style={{ fontSize:12, textTransform:'capitalize' }}>{p.billingCycle}</td>
                      <td><strong style={{ color:'var(--success)' }}>₹{p.amount}</strong></td>
                      <td style={{ fontSize:10, fontFamily:'monospace', color:'var(--muted)' }}>{p.razorpayOrderId?.slice(-10)}</td>
                      <td><span style={{ fontSize:10, background:'#e8fff5', color:'var(--success)', border:'1px solid #b3f0d8', padding:'2px 7px', borderRadius:20, fontWeight:700 }}>✅ Paid</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}