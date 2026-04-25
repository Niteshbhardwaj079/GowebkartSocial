import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '../store';

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector(s => s.analytics);
  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  const PLATFORMS = ['facebook','instagram','twitter','linkedin','youtube'];
  const COLORS = { facebook:'#1877f2', instagram:'#e1306c', twitter:'#1da1f2', linkedin:'#0077b5', youtube:'#ff0000' };
  const maxBar = Math.max(...(data?.last7Days?.map(d => d.count)||[1]));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">📊 Analytics</div>
        <div className="page-sub">Aapke posts ka performance dekho</div>
      </div>

      <div className="grid grid-4 mb-4">
        {[
          { label:'Total Posts',    value:data?.stats?.total||0,     icon:'📝', c:'#0066cc' },
          { label:'Published',      value:data?.stats?.published||0,  icon:'✅', c:'#00b86b' },
          { label:'Total Likes',    value:data?.engagement?.likes||0, icon:'❤️', c:'#e53e3e' },
          { label:'Total Comments', value:data?.engagement?.comments||0,icon:'💬',c:'#dd8800' },
        ].map((s,i) => (
          <div key={i} className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:32, fontWeight:900, color:s.c }}>{s.value.toLocaleString('en-IN')}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid mb-4" style={{ gridTemplateColumns:'3fr 2fr', gap:16 }}>
        <div className="card">
          <div className="card-title mb-3">📈 Last 7 Days Activity</div>
          {data?.last7Days?.length > 0 ? (
            <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:140 }}>
              {data.last7Days.map((d,i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:11, color:'var(--muted)', fontWeight:700 }}>{d.count}</div>
                  <div style={{ width:'100%', height:`${Math.max((d.count/maxBar)*110,6)}px`, background:'linear-gradient(to top,#0066cc,#0099ff)', borderRadius:'6px 6px 0 0', transition:'height 0.5s', minHeight:6 }} />
                  <span style={{ fontSize:9, color:'var(--muted)' }}>{d._id?.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Posts create karo to chart dikhega</div>
          )}
        </div>

        <div className="card">
          <div className="card-title mb-3">🌐 Platform Performance</div>
          {data?.platformStats?.length > 0 ? (
            data.platformStats.map((p,i) => {
              const max = Math.max(...(data.platformStats.map(x=>x.count)||[1]));
              return (
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                    <span style={{ fontWeight:600, textTransform:'capitalize', display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:10, height:10, borderRadius:'50%', background:COLORS[p._id]||'#999', display:'inline-block' }} />
                      {p._id}
                    </span>
                    <span style={{ fontWeight:700, color:COLORS[p._id]||'#0066cc' }}>{p.count}</span>
                  </div>
                  <div style={{ background:'var(--bg3)', borderRadius:4, height:6, overflow:'hidden' }}>
                    <div style={{ width:`${(p.count/max)*100}%`, height:'100%', background:COLORS[p._id]||'#0066cc', borderRadius:4, transition:'width 0.5s' }} />
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:20 }}>Social accounts connect karein</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title mb-3">💡 Post Kab Karein? (Best Times)</div>
        <div className="grid grid-3">
          {[
            { platform:'📘 Facebook',  time:'Wednesday 1pm–3pm / Thursday 12pm–2pm', tip:'Lunch time pe zyada engagement' },
            { platform:'📷 Instagram', time:'Monday–Friday 11am–1pm / Wednesday 11am', tip:'Morning aur lunch best hai' },
            { platform:'🐦 Twitter',   time:'Wednesday 9am, Tue–Thu 9am–3pm', tip:'Working hours mein best' },
          ].map((t,i) => (
            <div key={i} style={{ background:'var(--bg3)', borderRadius:10, padding:14 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>{t.platform}</div>
              <div style={{ fontSize:12, color:'#0066cc', fontWeight:600, marginBottom:4 }}>⏰ {t.time}</div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>💡 {t.tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
