import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '../store';
import { ExpiryBanner } from './PlansPage';
import api from '../services/api';
import { useState } from 'react';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector(s => s.analytics);
  const { user }          = useSelector(s => s.auth);
  const [expiryInfo, setExpiryInfo] = useState(null);

  useEffect(() => {
    dispatch(fetchDashboard());
    api.get('/payment/subscription').then(r => setExpiryInfo(r.data.subscription)).catch(()=>{});
  }, [dispatch]);

  const STATS = [
    { label:'Total Posts',  value: data?.stats?.total     || 0, icon:'📝', color:'purple' },
    { label:'Scheduled',    value: data?.stats?.scheduled  || 0, icon:'⏰', color:'pink'   },
    { label:'Published',    value: data?.stats?.published  || 0, icon:'✅', color:'green'  },
    { label:'Failed',       value: data?.stats?.failed     || 0, icon:'❌', color:'orange' },
  ];

  const maxBar = Math.max(...(data?.last7Days?.map(d => d.count) || [1]));

  const PLATFORM_COLORS = { facebook:'#1877f2', instagram:'#e1306c', twitter:'#1da1f2', linkedin:'#0077b5', youtube:'#ff0000' };

  if (loading && !data) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center', color:'var(--muted)' }}>
        <div style={{ fontSize:40, marginBottom:12, animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</div>
        <div>Loading dashboard...</div>
      </div>
    </div>
  );

  return (
    <div className="page fade-in">
      {/* Expiry Banner */}
      {expiryInfo?.showBanner && <ExpiryBanner info={expiryInfo} />}

      <div className="page-header flex justify-between items-center" style={{ flexWrap:'wrap', gap:10 }}>
        <div>
          <div className="page-title">🏠 Dashboard</div>
          <div className="page-sub">Welcome back, <strong>{user?.name?.split(' ')[0]}</strong>! Aapka overview.</div>
        </div>
        <a href="/create" className="btn btn-primary">✏️ Create Post</a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4 mb-4">
        {STATS.map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid mb-4" style={{ gridTemplateColumns:'2fr 1fr', gap:16 }}>
        {/* Activity Chart */}
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="card-title">📈 Post Activity</div>
              <div className="card-sub">Last 7 days</div>
            </div>
          </div>
          {data?.last7Days?.length > 0 ? (
            <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:100, marginTop:8 }}>
              {data.last7Days.map((d, i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div title={`${d.count} posts`}
                    style={{ width:'100%', height:`${Math.max((d.count/maxBar)*80, 4)}px`, background:'linear-gradient(to top, #0066cc, #0099ff)', borderRadius:'4px 4px 0 0', transition:'height 0.5s', minHeight:4 }} />
                  <span style={{ fontSize:9, color:'var(--muted)' }}>{d._id?.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:30, color:'var(--muted)' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📝</div>
              <div style={{ fontSize:13 }}>Koi posts nahi — pehli post banao!</div>
              <a href="/create" className="btn btn-primary btn-sm mt-2">Create Post →</a>
            </div>
          )}
        </div>

        {/* Platform Breakdown */}
        <div className="card">
          <div className="card-title mb-3">📱 Platforms</div>
          {data?.platformStats?.length > 0 ? (
            data.platformStats.slice(0,5).map((p, i) => (
              <div key={i} style={{ marginBottom:10 }}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize:13, fontWeight:600, textTransform:'capitalize', display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:PLATFORM_COLORS[p._id]||'#999', display:'inline-block' }} />
                    {p._id}
                  </span>
                  <span style={{ fontSize:12, color:'var(--muted)' }}>{p.count}</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-fill" style={{ width:`${Math.min((p.count/10)*100,100)}%`, background:PLATFORM_COLORS[p._id]||'#0066cc' }} />
                </div>
              </div>
            ))
          ) : (
            <div style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:'20px 0' }}>
              Social accounts connect karein stats dekhne ke liye
            </div>
          )}
        </div>
      </div>

      {/* Engagement Stats */}
      {data?.engagement && (
        <div className="card mb-4">
          <div className="card-title mb-3">❤️ Engagement Overview</div>
          <div className="grid grid-3">
            {[
              { label:'Total Likes',    value: data.engagement.likes    || 0, icon:'❤️', color:'#e53e3e' },
              { label:'Comments',       value: data.engagement.comments || 0, icon:'💬', color:'#0066cc' },
              { label:'Shares',         value: data.engagement.shares   || 0, icon:'🔁', color:'#00b86b' },
            ].map((e, i) => (
              <div key={i} style={{ textAlign:'center', padding:'14px', background:'var(--bg3)', borderRadius:10 }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{e.icon}</div>
                <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:28, fontWeight:800, color:e.color }}>{e.value.toLocaleString('en-IN')}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>{e.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div className="card-title">📋 Recent Posts</div>
          <a href="/posts" className="btn btn-secondary btn-sm">View All →</a>
        </div>
        {data?.recent?.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Platforms</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map(post => (
                  <tr key={post._id}>
                    <td style={{ maxWidth:200 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13 }}>
                        {post.content?.text?.slice(0,60) || '📷 Media post'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {post.platforms?.map(p => (
                          <span key={p.platform} style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'#f0f7ff', color:'#0066cc', border:'1px solid #c0d4ff' }}>
                            {p.platform}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${post.status}`}>{post.status}</span>
                    </td>
                    <td style={{ fontSize:12, color:'var(--muted)' }}>
                      {new Date(post.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📝</div>
            <div style={{ fontWeight:700, marginBottom:8 }}>Koi posts nahi abhi tak</div>
            <a href="/create" className="btn btn-primary">Create First Post →</a>
          </div>
        )}
      </div>
    </div>
  );
}
