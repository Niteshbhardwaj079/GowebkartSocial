import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

export default function AdsPage() {
  const { user } = useSelector(s => s.auth);
  const [campaigns, setCampaigns] = useState([]);
  const isLocked = user?.plan === 'free';

  useEffect(() => {
    if (!isLocked) {
      api.get('/ads/campaigns').then(r => setCampaigns(r.data.campaigns||[])).catch(()=>{});
    }
  }, [isLocked]);

  if (isLocked) return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">📢 Ads Manager</div>
        <div className="page-sub">Facebook & Instagram paid campaigns</div>
      </div>
      <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🔒</div>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:24, fontWeight:800, marginBottom:12 }}>Ads Manager</div>
        <div style={{ fontSize:15, color:'var(--muted)', marginBottom:24, maxWidth:400, margin:'0 auto 24px' }}>
          Facebook aur Instagram ads directly yahan se manage karein. Sirf Basic aur Pro plan mein available hai.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:480, margin:'0 auto 28px' }}>
          {['🎯 Targeted Ads','💰 Budget Control','📊 Ad Analytics'].map((f,i)=>(
            <div key={i} style={{ background:'var(--bg3)', borderRadius:10, padding:'12px 8px', fontSize:13, fontWeight:600 }}>{f}</div>
          ))}
        </div>
        <a href="/plans" className="btn btn-primary btn-lg">⚡ Upgrade to Basic</a>
      </div>
    </div>
  );

  return (
    <div className="page fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <div className="page-title">📢 Ads Manager</div>
          <div className="page-sub">{campaigns.length} campaigns</div>
        </div>
        <button className="btn btn-primary">+ New Campaign</button>
      </div>
      {campaigns.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📢</div>
          <div style={{ fontWeight:700, marginBottom:8 }}>Koi campaign nahi</div>
          <div style={{ color:'var(--muted)', marginBottom:20, fontSize:13 }}>Pehle Facebook account connect karein aur naya campaign banayein</div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Campaign</th><th>Objective</th><th>Budget</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontWeight:600 }}>{c.name}</td>
                    <td style={{ fontSize:12, textTransform:'capitalize' }}>{c.objective?.toLowerCase()}</td>
                    <td>₹{c.budget?.amount} ({c.budget?.type})</td>
                    <td><span className={`status-badge ${c.status}`}>{c.status}</span></td>
                    <td><button className="btn btn-secondary btn-sm">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
