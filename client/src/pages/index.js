import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard, fetchPosts, fetchAccounts, deletePost, createPost, logout } from '../store';
import { aiAPI, uploadAPI, socialAPI, adsAPI, adminAPI, authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// ── Helper Components ──
const PlatformBadge = ({ p }) => {
  const icons = { facebook:'📘',instagram:'📷',twitter:'🐦',linkedin:'💼',youtube:'📺' };
  return <span className={`platform-badge ${p}`}>{icons[p]} {p}</span>;
};

const StatusBadge = ({ s }) => {
  const icons = { scheduled:'🕐',published:'✅',draft:'📝',failed:'❌',publishing:'⏳' };
  return <span className={`status-badge ${s}`}>{icons[s]} {s}</span>;
};

const Spinner = () => <div style={{display:'flex',justifyContent:'center',padding:40,color:'var(--muted)'}}>⟳ Loading...</div>;

// ══════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════
export function DashboardPage() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector(s => s.analytics);
  const { user } = useSelector(s => s.auth);

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  if (loading || !data) return <Spinner />;

  const stats = [
    { label:'Total Posts',      value: data.stats?.total || 0,     icon:'📝', color:'purple', change: '+this month' },
    { label:'Scheduled',        value: data.stats?.scheduled || 0, icon:'⏰', color:'pink',   change: 'upcoming posts' },
    { label:'Published',        value: data.stats?.published || 0, icon:'✅', color:'green',  change: 'this month' },
    { label:'Failed',           value: data.stats?.failed || 0,    icon:'❌', color:'orange', change: 'need attention' },
  ];

  const maxBar = Math.max(...(data.last7Days?.map(d => d.count) || [1]));

  return (
    <div className="page fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <div className="page-title">Dashboard 🏠</div>
          <div className="page-sub">Welcome back, {user?.name?.split(' ')[0]}! Here's your overview.</div>
        </div>
        <a href="/create" className="btn btn-primary">+ Create Post</a>
      </div>

      <div className="grid grid-4 mb-4">
        {stats.map((s,i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-change up">↑ {s.change}</div>
          </div>
        ))}
      </div>

      <div className="grid mb-4" style={{gridTemplateColumns:'2fr 1fr',gap:16}}>
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <div><div className="card-title">Post Activity</div><div className="card-sub">Last 7 days</div></div>
          </div>
          <div style={{display:'flex',alignItems:'flex-end',gap:6,height:100}}>
            {data.last7Days?.length > 0 ? data.last7Days.map((d,i) => (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div title={`${d.count} posts`} style={{width:'100%',height:`${(d.count/maxBar)*100}%`,minHeight:4,background:'linear-gradient(to top, var(--accent), rgba(124,106,255,0.3))',borderRadius:'4px 4px 0 0',transition:'all 0.3s'}} />
                <span style={{fontSize:9,color:'var(--muted)'}}>{d._id?.slice(5)}</span>
              </div>
            )) : <div style={{color:'var(--muted)',fontSize:13}}>No posts yet. Create your first post!</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-title mb-3">Platforms</div>
          {data.platformStats?.length > 0 ? data.platformStats.map((p,i) => (
            <div key={i} style={{marginBottom:12}}>
              <div className="flex justify-between mb-1">
                <span style={{fontSize:13,fontWeight:600,textTransform:'capitalize'}}>{p._id}</span>
                <span style={{fontSize:12,color:'var(--muted)'}}>{p.count} posts</span>
              </div>
              <div className="progress-wrap">
                <div className="progress-fill" style={{width:`${(p.count/10)*100}%`,background:'var(--accent)'}} />
              </div>
            </div>
          )) : <div style={{color:'var(--muted)',fontSize:13}}>Connect social accounts to see stats</div>}
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div className="card-title">Recent Posts</div>
          <a href="/posts" className="btn btn-secondary btn-sm">View All</a>
        </div>
        {data.recent?.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Content</th><th>Platforms</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {data.recent.map(post => (
                  <tr key={post._id}>
                    <td style={{maxWidth:250}} className="truncate">{post.content?.text || 'Media post'}</td>
                    <td><div className="flex gap-2" style={{flexWrap:'wrap'}}>{post.platforms?.map(p => <PlatformBadge key={p.platform} p={p.platform} />)}</div></td>
                    <td><StatusBadge s={post.status} /></td>
                    <td style={{fontSize:12,color:'var(--muted)'}}>{new Date(post.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{textAlign:'center',padding:40,color:'var(--muted)'}}>
            <div style={{fontSize:32,marginBottom:12}}>📝</div>
            <div style={{fontWeight:700,marginBottom:8}}>No posts yet</div>
            <a href="/create" className="btn btn-primary btn-sm">Create your first post →</a>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// CREATE POST PAGE
// ══════════════════════════════════════════════
export function CreatePostPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accounts } = useSelector(s => s.social);
  const [form, setForm]   = useState({ text:'', platforms:[], scheduleType:'now', scheduledAt:'', platformContent:{}, status:'draft' });
  const [files, setFiles] = useState([]);
  const [aiTopic, setAiTopic]   = useState('');
  const [aiLang,  setAiLang]    = useState('en');
  const [aiTone,  setAiTone]    = useState('professional');
  const [aiData,  setAiData]    = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [showAI, setShowAI]       = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState([]);

  useEffect(() => { dispatch(fetchAccounts()); }, [dispatch]);

  const PLATFORMS = [
    {id:'facebook',label:'Facebook',icon:'📘'},
    {id:'instagram',label:'Instagram',icon:'📷'},
    {id:'twitter',label:'Twitter',icon:'🐦'},
    {id:'linkedin',label:'LinkedIn',icon:'💼'},
    {id:'youtube',label:'YouTube',icon:'📺'},
  ];

  const togglePlatform = (id) => {
    setForm(f => ({...f, platforms: f.platforms.includes(id) ? f.platforms.filter(p=>p!==id) : [...f.platforms, id]}));
  };

  const handleFiles = async (e) => {
    const fileList = Array.from(e.target.files);
    if (!fileList.length) return;
    setUploading(true);
    try {
      const res = await uploadAPI.media(fileList);
      setUploadedMedia(prev => [...prev, ...res.data.files]);
      toast.success(`${res.data.files.length} file(s) uploaded!`);
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const generateAI = async () => {
    if (!aiTopic.trim()) return toast.error('Enter a topic first');
    setAiLoading(true);
    try {
      const res = await aiAPI.caption({ topic: aiTopic, language: aiLang, tone: aiTone, platform: form.platforms[0] || 'instagram' });
      setAiData(res.data);
    } catch {} finally { setAiLoading(false); }
  };

  const handleSubmit = async (publish = false) => {
    if (!form.text.trim() && uploadedMedia.length === 0) return toast.error('Write something or upload media');
    if (form.platforms.length === 0) return toast.error('Select at least one platform');

    setSaving(true);
    try {
      const connectedAccounts = accounts.filter(a => form.platforms.includes(a.platform));

      const postData = {
        content: { text: form.text, media: uploadedMedia },
        platforms: form.platforms.map(p => {
          const acc = connectedAccounts.find(a => a.platform === p);
          return { platform: p, socialAccountId: acc?._id || null, status: 'pending' };
        }),
        scheduling: form.scheduleType === 'schedule' ? { scheduledAt: form.scheduledAt } : {},
        status: publish ? (form.scheduleType === 'now' ? 'publishing' : 'scheduled') : 'draft',
        platformContent: form.platformContent
      };

      await dispatch(createPost(postData)).unwrap();
      navigate('/posts');
    } catch {} finally { setSaving(false); }
  };

  const charLimit = form.platforms.includes('twitter') ? 280 : 5000;
  const charCls   = form.text.length > charLimit ? 'over' : form.text.length > charLimit*0.8 ? 'warn' : '';

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">Create Post ✍️</div>
        <div className="page-sub">Compose and schedule content across all platforms</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20}}>
        <div>
          {/* Platform selector */}
          <div className="card mb-4">
            <div className="card-title mb-3">Select Platforms</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {PLATFORMS.map(p => (
                <div key={p.id} onClick={() => togglePlatform(p.id)} style={{
                  display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:20,border:`1px solid ${form.platforms.includes(p.id)?'var(--accent)':'var(--border)'}`,
                  cursor:'pointer',fontSize:12,fontWeight:600,transition:'all 0.15s',
                  background: form.platforms.includes(p.id) ? 'rgba(124,106,255,0.1)' : 'var(--bg3)',
                  color: form.platforms.includes(p.id) ? 'var(--text)' : 'var(--muted)'
                }}>
                  {p.icon} {p.label} {form.platforms.includes(p.id) && '✓'}
                </div>
              ))}
            </div>
            {accounts.filter(a=>form.platforms.includes(a.platform)).length === 0 && form.platforms.length > 0 && (
              <div style={{marginTop:10,fontSize:12,color:'var(--warning)'}}>⚠️ No connected accounts for selected platforms. <a href="/accounts" style={{color:'var(--accent)'}}>Connect accounts →</a></div>
            )}
          </div>

          {/* Text */}
          <div className="card mb-4">
            <div className="flex justify-between items-center mb-3">
              <div className="card-title">Post Content</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAI(!showAI)}>🤖 AI Writer</button>
            </div>
            <textarea className="form-textarea" placeholder="Write your post here..." value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))} style={{minHeight:140}} />
            <div className={`char-counter ${charCls}`}>{form.text.length} / {charLimit} {form.platforms.includes('twitter') && '(Twitter: 280 limit)'}</div>
          </div>

          {/* Media */}
          <div className="card mb-4">
            <div className="card-title mb-3">📁 Add Media</div>
            <label style={{display:'block',border:'2px dashed var(--border)',borderRadius:'var(--radius2)',padding:'32px 20px',textAlign:'center',cursor:'pointer',transition:'all 0.2s',color:'var(--muted)'}}>
              <input type="file" multiple accept="image/*,video/*" onChange={handleFiles} style={{display:'none'}} />
              {uploading ? <div>⟳ Uploading to Cloudinary...</div> : <>
                <div style={{fontSize:32,marginBottom:8}}>📁</div>
                <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Click to upload images or videos</div>
                <div style={{fontSize:12}}>Max 100MB per file</div>
              </>}
            </label>
            {uploadedMedia.length > 0 && (
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
                {uploadedMedia.map((m,i) => (
                  <div key={i} style={{position:'relative'}}>
                    <img src={m.thumbnail||m.url} alt="" style={{width:80,height:80,objectFit:'cover',borderRadius:8,border:'1px solid var(--border)'}} />
                    <button onClick={()=>setUploadedMedia(prev=>prev.filter((_,j)=>j!==i))} style={{position:'absolute',top:-4,right:-4,background:'var(--danger)',color:'#fff',border:'none',borderRadius:'50%',width:18,height:18,fontSize:10,cursor:'pointer'}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="card mb-4">
            <div className="card-title mb-3">⏰ Schedule</div>
            <div className="toggle-wrap mb-3">
              {['now','schedule'].map(t => (
                <div key={t} className={`toggle-btn ${form.scheduleType===t?'active':''}`} onClick={()=>setForm(f=>({...f,scheduleType:t}))}>
                  {t==='now'?'Post Now':'Schedule Later'}
                </div>
              ))}
            </div>
            {form.scheduleType==='schedule' && (
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input type="datetime-local" className="form-input" value={form.scheduledAt} onChange={e=>setForm(f=>({...f,scheduledAt:e.target.value}))} />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button className="btn btn-secondary" onClick={() => handleSubmit(false)} disabled={saving}>💾 Save Draft</button>
            <button className="btn btn-primary" style={{flex:1}} onClick={() => handleSubmit(true)} disabled={saving}>
              {saving ? '⟳ Saving...' : form.scheduleType==='now' ? '🚀 Publish Now' : '📅 Schedule Post'}
            </button>
          </div>
        </div>

        {/* AI Panel + Preview */}
        <div>
          {showAI && (
            <div style={{background:'linear-gradient(135deg, rgba(124,106,255,0.08), rgba(255,106,155,0.05))',border:'1px solid rgba(124,106,255,0.2)',borderRadius:'var(--radius)',padding:16,marginBottom:16}} className="slide-in">
              <div style={{display:'flex',alignItems:'center',gap:8,color:'var(--accent)',fontWeight:700,fontSize:13,marginBottom:12}}>🤖 AI Caption Writer</div>
              <div className="form-group">
                <label className="form-label">Topic</label>
                <input className="form-input" placeholder="e.g. Digital Marketing, Food" value={aiTopic} onChange={e=>setAiTopic(e.target.value)} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                <select className="form-select" value={aiTone} onChange={e=>setAiTone(e.target.value)}>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="funny">Funny</option>
                  <option value="motivational">Motivational</option>
                </select>
                <select className="form-select" value={aiLang} onChange={e=>setAiLang(e.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
              <button className="btn btn-primary w-full mb-3" onClick={generateAI} disabled={aiLoading}>
                {aiLoading ? '⟳ Generating...' : '✨ Generate'}
              </button>
              {aiData && (
                <>
                  <div onClick={()=>setForm(f=>({...f,text:aiData.caption}))} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius2)',padding:'10px 12px',fontSize:13,cursor:'pointer',marginBottom:8,lineHeight:1.6}} className="slide-in">
                    {aiData.caption}
                    <div style={{marginTop:4,fontSize:11,color:'var(--accent)'}}>Click to use →</div>
                  </div>
                  {aiData.suggestions?.map((s,i) => (
                    <div key={i} onClick={()=>setForm(f=>({...f,text:s}))} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius2)',padding:'8px 12px',fontSize:12,cursor:'pointer',marginBottom:6,color:'var(--muted)'}}>
                      {s}
                    </div>
                  ))}
                  {aiData.hashtags?.length > 0 && (
                    <>
                      <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',margin:'8px 0'}}>HASHTAGS</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                        {aiData.hashtags.slice(0,10).map(h => (
                          <span key={h} className="tag" onClick={()=>setForm(f=>({...f,text:f.text+' '+h}))}>{h}</span>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="card">
            <div className="card-title mb-3">👀 Preview</div>
            <div style={{background:'var(--bg3)',borderRadius:'var(--radius2)',padding:16,border:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),var(--accent2))'}} />
                <div><div style={{fontSize:13,fontWeight:700}}>Your Account</div><div style={{fontSize:11,color:'var(--muted)'}}>Just now</div></div>
              </div>
              <div style={{fontSize:13,lineHeight:1.6,color:form.text?'var(--text)':'var(--muted)',minHeight:60}}>
                {form.text||'Your post will appear here...'}
              </div>
              {uploadedMedia[0] && (
                <img src={uploadedMedia[0].thumbnail||uploadedMedia[0].url} alt="" style={{width:'100%',borderRadius:8,marginTop:10,maxHeight:200,objectFit:'cover'}} />
              )}
              {form.text && (
                <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)',display:'flex',gap:16,fontSize:12,color:'var(--muted)'}}>
                  <span>❤️ Like</span><span>💬 Comment</span><span>🔁 Share</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// POSTS LIST PAGE
// ══════════════════════════════════════════════
export function PostsPage() {
  const dispatch = useDispatch();
  const { items: posts, loading, pagination } = useSelector(s => s.posts);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchPosts({ status: filter === 'all' ? undefined : filter, search }));
  }, [dispatch, filter, search]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this post?')) dispatch(deletePost(id));
  };

  return (
    <div className="page fade-in">
      <div className="page-header flex justify-between items-center">
        <div><div className="page-title">All Posts 📋</div><div className="page-sub">{pagination?.total || 0} total posts</div></div>
        <a href="/create" className="btn btn-primary">+ New Post</a>
      </div>

      <div className="flex gap-3 mb-4" style={{flexWrap:'wrap'}}>
        <input className="form-input" placeholder="🔍 Search posts..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,maxWidth:300}} />
        <div className="flex gap-2">
          {['all','draft','scheduled','published','failed'].map(s => (
            <button key={s} className={`btn btn-sm ${filter===s?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(s)}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? <Spinner /> : posts.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Content</th><th>Platforms</th><th>Status</th><th>Scheduled</th><th>Actions</th></tr></thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post._id}>
                    <td style={{maxWidth:280}}>
                      <div className="truncate" style={{fontSize:13,fontWeight:500}}>{post.content?.text||'Media post'}</div>
                    </td>
                    <td>
                      <div className="flex gap-1" style={{flexWrap:'wrap'}}>
                        {post.platforms?.map(p => <PlatformBadge key={p.platform} p={p.platform} />)}
                      </div>
                    </td>
                    <td><StatusBadge s={post.status} /></td>
                    <td style={{fontSize:12,color:'var(--muted)'}}>
                      {post.scheduling?.scheduledAt ? new Date(post.scheduling.scheduledAt).toLocaleString() : '—'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <a href="/create" className="btn btn-ghost btn-sm">✏️</a>
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(post._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{textAlign:'center',padding:60,color:'var(--muted)'}}>
            <div style={{fontSize:40,marginBottom:12}}>📭</div>
            <div style={{fontWeight:700,marginBottom:8}}>No posts found</div>
            <a href="/create" className="btn btn-primary btn-sm">Create your first post →</a>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// CALENDAR PAGE
// ══════════════════════════════════════════════
export function CalendarPage() {
  const { items: posts } = useSelector(s => s.posts);
  const dispatch = useDispatch();
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end   = new Date(month.getFullYear(), month.getMonth()+1, 0);
    dispatch(fetchPosts({ start, end }));
  }, [dispatch, month]);

  const firstDay    = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
  const today       = new Date();

  const postsByDay = {};
  posts.forEach(p => {
    if (p.scheduling?.scheduledAt) {
      const d = new Date(p.scheduling.scheduledAt).getDate();
      if (!postsByDay[d]) postsByDay[d] = [];
      postsByDay[d].push(p);
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const colors = ['#7c6aff','#ff6a9b','#6affce','#ffb86a'];

  return (
    <div className="page fade-in">
      <div className="page-header flex justify-between items-center">
        <div><div className="page-title">Content Calendar 📅</div><div className="page-sub">Visual schedule of all planned posts</div></div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={()=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()-1))}>◀</button>
          <button className="btn btn-secondary" style={{fontWeight:700}}>{month.toLocaleString('en',{month:'long',year:'numeric'})}</button>
          <button className="btn btn-secondary" onClick={()=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()+1))}>▶</button>
          <a href="/create" className="btn btn-primary">+ Post</a>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1,background:'var(--border)',borderRadius:'var(--radius)',overflow:'hidden'}}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{background:'var(--card2)',padding:10,textAlign:'center',fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{d}</div>
        ))}
        {cells.map((day,i) => {
          const isToday = day && today.getDate()===day && today.getMonth()===month.getMonth() && today.getFullYear()===month.getFullYear();
          const dayPosts = day ? (postsByDay[day]||[]) : [];
          return (
            <div key={i} style={{background: isToday?'rgba(124,106,255,0.08)':'var(--card)',minHeight:90,padding:8,opacity:day?1:0.3}}>
              {day && <>
                <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',width:24,height:24,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',background:isToday?'var(--accent)':'transparent',color:isToday?'#fff':'var(--muted)',marginBottom:4}}>{day}</div>
                {dayPosts.slice(0,2).map((p,j) => (
                  <div key={j} style={{fontSize:10,padding:'2px 5px',borderRadius:3,background:colors[j%colors.length]+'22',color:colors[j%colors.length],border:`1px solid ${colors[j%colors.length]}44`,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {p.content?.text?.slice(0,20)||'Post'}
                  </div>
                ))}
                {dayPosts.length > 2 && <div style={{fontSize:10,color:'var(--muted)'}}>+{dayPosts.length-2} more</div>}
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// ANALYTICS PAGE
// ══════════════════════════════════════════════
export function AnalyticsPage() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector(s => s.analytics);

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  if (loading || !data) return <Spinner />;

  const ovStats = [
    { label:'Total Posts',   value: data.stats?.total || 0,     icon:'📝', color:'purple' },
    { label:'Published',     value: data.stats?.published || 0, icon:'✅', color:'pink'   },
    { label:'Total Likes',   value: data.engagement?.likes || 0, icon:'❤️', color:'green'  },
    { label:'Total Comments',value: data.engagement?.comments || 0, icon:'💬', color:'orange' },
  ];

  return (
    <div className="page fade-in">
      <div className="page-header flex justify-between items-center">
        <div><div className="page-title">Analytics 📊</div><div className="page-sub">Performance across all platforms</div></div>
        <select className="form-select" style={{width:'auto'}}>
          <option>Last 30 Days</option><option>Last 7 Days</option><option>All Time</option>
        </select>
      </div>

      <div className="grid grid-4 mb-4">
        {ovStats.map((s,i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <div className="card-title mb-1">Daily Posts</div>
          <div className="card-sub">Last 7 days</div>
          {data.last7Days?.length > 0 ? (
            <div style={{display:'flex',alignItems:'flex-end',gap:8,height:120}}>
              {data.last7Days.map((d,i) => {
                const max = Math.max(...data.last7Days.map(x=>x.count),1);
                return (
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <span style={{fontSize:10,color:'var(--muted)'}}>{d.count}</span>
                    <div style={{width:'100%',height:`${(d.count/max)*100}%`,minHeight:4,background:'linear-gradient(to top, var(--accent2), rgba(255,106,155,0.3))',borderRadius:'4px 4px 0 0'}} />
                    <span style={{fontSize:9,color:'var(--muted)'}}>{d._id?.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          ) : <div style={{color:'var(--muted)',fontSize:13,padding:'20px 0'}}>No data yet</div>}
        </div>

        <div className="card">
          <div className="card-title mb-1">Platform Breakdown</div>
          <div className="card-sub">Posts per platform</div>
          {data.platformStats?.map((p,i) => (
            <div key={i} style={{marginBottom:14}}>
              <div className="flex justify-between mb-1">
                <span style={{fontSize:13,fontWeight:600,textTransform:'capitalize'}}>{p._id}</span>
                <span style={{fontSize:12,color:'var(--muted)'}}>{p.count} posts</span>
              </div>
              <div className="progress-wrap">
                <div className="progress-fill" style={{width:`${Math.min(p.count*10,100)}%`,background:'var(--accent)'}} />
              </div>
            </div>
          ))}
          {(!data.platformStats || data.platformStats.length === 0) && <div style={{color:'var(--muted)',fontSize:13}}>Publish posts to see platform stats</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-title mb-3">Usage This Month</div>
        <div className="grid grid-3">
          {[
            { label:'Posts Used',    used: data.usage?.postsThisMonth||0, total: data.usage?.plan==='pro'?'∞':data.usage?.plan==='basic'?100:30, color:'var(--accent)' },
            { label:'AI Calls Today',used: data.usage?.aiUsageToday||0,   total: data.usage?.plan==='pro'?'∞':data.usage?.plan==='basic'?20:5,   color:'var(--accent2)' },
          ].map((u,i) => (
            <div key={i} className="card" style={{background:'var(--bg3)'}}>
              <div style={{fontWeight:700,marginBottom:4}}>{u.label}</div>
              <div style={{fontSize:24,fontWeight:800,color:u.color}}>{u.used}</div>
              <div style={{fontSize:12,color:'var(--muted)'}}>of {u.total}</div>
            </div>
          ))}
          <div className="card" style={{background:'var(--bg3)'}}>
            <div style={{fontWeight:700,marginBottom:4}}>Current Plan</div>
            <div style={{fontSize:24,fontWeight:800,color:'var(--accent3)',textTransform:'capitalize'}}>{data.usage?.plan||'free'}</div>
            <a href="/plans" style={{fontSize:12,color:'var(--accent)'}}>Upgrade →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// ACCOUNTS PAGE
// ══════════════════════════════════════════════
export function AccountsPage() {
  const dispatch = useDispatch();
  const { accounts, loading } = useSelector(s => s.social);
  const { user } = useSelector(s => s.auth);

  useEffect(() => { dispatch(fetchAccounts()); }, [dispatch]);

  const PLATFORMS = [
    { id:'facebook',  label:'Facebook',  icon:'📘', color:'#1877f2', note:'Required for Ads too' },
    { id:'instagram', label:'Instagram', icon:'📷', color:'#e1306c', note:'Connect via Facebook' },
    { id:'twitter',   label:'Twitter',   icon:'🐦', color:'#1da1f2', note:'Twitter Developer App needed' },
    { id:'linkedin',  label:'LinkedIn',  icon:'💼', color:'#0077b5', note:'LinkedIn Developer App needed' },
    { id:'youtube',   label:'YouTube',   icon:'📺', color:'#ff0000', note:'Google Cloud Console needed' },
  ];

  const handleConnect = async (platform) => {
    try {
      let res;
      if (platform === 'facebook')  res = await socialAPI.connectFacebook();
      if (platform === 'twitter')   res = await socialAPI.connectTwitter();
      if (platform === 'linkedin')  res = await socialAPI.connectLinkedIn();
      if (res?.data?.url) window.location.href = res.data.url;
    } catch (e) {
      toast.error(e.response?.data?.message || `Add ${platform} API keys to .env first`);
    }
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm('Disconnect this account?')) return;
    try {
      await socialAPI.disconnect(id);
      dispatch(fetchAccounts());
      toast.success('Account disconnected');
    } catch {}
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">Social Accounts 🔗</div>
        <div className="page-sub">Connect and manage your social media accounts</div>
      </div>

      <div className="grid grid-2">
        <div>
          <div className="card mb-4">
            <div className="card-title mb-3">Available Platforms</div>
            {PLATFORMS.map(p => {
              const connected = accounts.find(a => a.platform === p.id && a.isActive);
              return (
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:40,height:40,borderRadius:12,background:p.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{p.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600}}>{p.label}</div>
                    <div style={{fontSize:11,color:'var(--muted)'}}>
                      {connected ? `Connected: @${connected.platformUsername||connected.displayName||'Account'}` : p.note}
                    </div>
                  </div>
                  {connected ? (
                    <div className="flex gap-2 items-center">
                      <div style={{width:8,height:8,borderRadius:'50%',background:'var(--success)',boxShadow:'0 0 8px rgba(76,255,159,0.5)'}} />
                      <button className="btn btn-danger btn-sm" onClick={()=>handleDisconnect(connected._id)}>Disconnect</button>
                    </div>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={()=>handleConnect(p.id)}>Connect</button>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{background:'rgba(255,184,106,0.08)',border:'1px solid rgba(255,184,106,0.2)',borderRadius:'var(--radius)',padding:16}}>
            <div style={{fontWeight:700,color:'var(--warning)',marginBottom:8,fontSize:13}}>⚠️ Setup Required</div>
            <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.8}}>
              To connect social accounts, add API keys in <code style={{color:'var(--accent)',background:'var(--bg3)',padding:'1px 6px',borderRadius:4}}>.env</code> file:<br/>
              • Facebook: <strong>FACEBOOK_APP_ID</strong> + <strong>FACEBOOK_APP_SECRET</strong><br/>
              • Twitter: <strong>TWITTER_API_KEY</strong><br/>
              • LinkedIn: <strong>LINKEDIN_CLIENT_ID</strong>
            </div>
          </div>
        </div>

        <div>
          <div className="card mb-4">
            <div className="card-title mb-3">📊 Plan Usage</div>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:16}}>
              You are on <strong style={{color:'var(--accent)',textTransform:'uppercase'}}>{user?.plan}</strong> plan
            </div>
            {[
              { label:'Posts this month', used: user?.usage?.postsThisMonth||0, total: user?.plan==='pro'?999:user?.plan==='basic'?100:30, color:'var(--accent)' },
              { label:'Connected accounts', used: accounts.length, total: user?.plan==='pro'?999:user?.plan==='basic'?10:5, color:'var(--accent2)' },
              { label:'AI uses today', used: user?.usage?.aiUsageToday||0, total: user?.plan==='pro'?999:user?.plan==='basic'?20:5, color:'var(--accent3)' },
            ].map((u,i) => (
              <div key={i} style={{marginBottom:16}}>
                <div className="flex justify-between mb-1">
                  <span style={{fontSize:13,fontWeight:600}}>{u.label}</span>
                  <span style={{fontSize:12,color:'var(--muted)'}}>{u.used} / {u.total}</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-fill" style={{width:`${Math.min((u.used/u.total)*100,100)}%`,background:u.color}} />
                </div>
              </div>
            ))}
            <a href="/plans" className="btn btn-primary w-full">⚡ Upgrade Plan</a>
          </div>

          <div className="card">
            <div className="card-title mb-3">Connected ({accounts.length})</div>
            {accounts.length === 0 ? (
              <div style={{color:'var(--muted)',fontSize:13,textAlign:'center',padding:20}}>No accounts connected yet</div>
            ) : accounts.map(a => (
              <div key={a._id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                {a.profilePicture ? <img src={a.profilePicture} alt="" style={{width:32,height:32,borderRadius:'50%'}} /> : <div className="avatar" style={{width:32,height:32,fontSize:12}}>{a.displayName?.[0]}</div>}
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{a.displayName}</div>
                  <PlatformBadge p={a.platform} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// ADS PAGE
// ══════════════════════════════════════════════
export function AdsPage() {
  const { user } = useSelector(s => s.auth);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (user?.plan === 'basic' || user?.plan === 'pro') {
      adsAPI.getCampaigns().then(r => setCampaigns(r.data.campaigns)).catch(()=>{}).finally(()=>setLoading(false));
    } else setLoading(false);
  }, [user]);

  if (user?.plan === 'free') return (
    <div className="page fade-in">
      <div className="page-header"><div className="page-title">Ads Manager 📢</div></div>
      <div style={{textAlign:'center',padding:80}}>
        <div style={{fontSize:48,marginBottom:16}}>🔒</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,marginBottom:8}}>Upgrade to use Ads</div>
        <div style={{color:'var(--muted)',marginBottom:24}}>Ads Manager is available on Basic and Pro plans</div>
        <a href="/plans" className="btn btn-primary btn-lg">View Plans →</a>
      </div>
    </div>
  );

  return (
    <div className="page fade-in">
      <div className="page-header flex justify-between items-center">
        <div><div className="page-title">Ads Manager 📢</div><div className="page-sub">Create and manage Facebook & Instagram ads</div></div>
        <button className="btn btn-primary" onClick={()=>setShowCreate(true)}>+ New Campaign</button>
      </div>

      <div style={{background:'rgba(124,106,255,0.08)',border:'1px solid rgba(124,106,255,0.2)',borderRadius:'var(--radius)',padding:16,marginBottom:24,fontSize:13}}>
        💡 <strong>Tip:</strong> Connect your Facebook account first, then create ad campaigns to boost your posts.
        For advanced ads, use <a href="https://business.facebook.com" target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>Meta Ads Manager →</a>
      </div>

      {loading ? <Spinner /> : campaigns.length === 0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--muted)'}}>
          <div style={{fontSize:40,marginBottom:12}}>📢</div>
          <div style={{fontWeight:700,marginBottom:8}}>No campaigns yet</div>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowCreate(true)}>Create first campaign</button>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Campaign</th><th>Objective</th><th>Budget</th><th>Status</th><th>Impressions</th><th>Actions</th></tr></thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c._id}>
                    <td style={{fontWeight:600}}>{c.name}</td>
                    <td style={{fontSize:12,color:'var(--muted)'}}>{c.objective}</td>
                    <td style={{fontSize:12}}>₹{c.budget?.amount}/{c.budget?.type==='DAILY'?'day':'lifetime'}</td>
                    <td><StatusBadge s={c.status} /></td>
                    <td>{c.analytics?.impressions||0}</td>
                    <td>
                      <div className="flex gap-2">
                        {c.status==='pending' && <button className="btn btn-success btn-sm" onClick={()=>adsAPI.publishCampaign(c._id).then(()=>toast.success('Campaign live!'))}>▶ Publish</button>}
                        {c.status==='active'  && <button className="btn btn-secondary btn-sm" onClick={()=>adsAPI.pauseCampaign(c._id).then(()=>toast.success('Paused'))}>⏸ Pause</button>}
                      </div>
                    </td>
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

// ══════════════════════════════════════════════
// PLANS PAGE
// ══════════════════════════════════════════════
export function PlansPage() {
  const { user } = useSelector(s => s.auth);
  const [billing, setBilling] = useState('monthly');

  const plans = [
    { name:'Free',  price:0,    color:'var(--muted)',   popular:false, features:['30 posts/month','5 social accounts','5 AI uses/day','Basic analytics','Email support'] },
    { name:'Basic', price:billing==='monthly'?999:799,  color:'var(--accent)',  popular:true,  features:['100 posts/month','10 social accounts','20 AI uses/day','Advanced analytics','Ads Manager','Bulk CSV upload','Priority support'] },
    { name:'Pro',   price:billing==='monthly'?2499:1999,color:'var(--accent2)', popular:false, features:['Unlimited posts','Unlimited accounts','Unlimited AI','Full analytics','Ads management','White-label basic','API access','Dedicated support'] },
  ];

  return (
    <div className="page fade-in">
      <div style={{textAlign:'center',marginBottom:32}}>
        <div className="page-title" style={{fontSize:32}}>Choose Your Plan 💎</div>
        <div className="page-sub" style={{fontSize:16,marginTop:8}}>Start free, upgrade when you grow</div>
        <div className="toggle-wrap" style={{width:240,margin:'20px auto 0'}}>
          <div className={`toggle-btn ${billing==='monthly'?'active':''}`} onClick={()=>setBilling('monthly')}>Monthly</div>
          <div className={`toggle-btn ${billing==='yearly'?'active':''}`} onClick={()=>setBilling('yearly')}>Yearly -20%</div>
        </div>
      </div>

      <div className="grid grid-3" style={{maxWidth:900,margin:'0 auto'}}>
        {plans.map((plan,i) => (
          <div key={i} style={{background:'var(--card)',border:`1px solid ${plan.popular?'var(--accent)':'var(--border)'}`,borderRadius:'var(--radius)',padding:24,position:'relative',boxShadow:plan.popular?'0 0 30px rgba(124,106,255,0.15)':'none'}}>
            {plan.popular && <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,var(--accent),var(--accent2))',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 14px',borderRadius:20,textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap'}}>⭐ Most Popular</div>}
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800}}>{plan.name}</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:800,color:plan.color,margin:'10px 0'}}>
              ₹{plan.price}<span style={{fontSize:14,color:'var(--muted)',fontWeight:400}}>/mo</span>
            </div>
            <div style={{height:1,background:'var(--border)',margin:'12px 0'}} />
            {plan.features.map((f,j) => <div key={j} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--muted)',padding:'4px 0'}}><span style={{color:'var(--success)'}}>✓</span>{f}</div>)}
            <button className="btn w-full mt-4" style={{justifyContent:'center',background:plan.popular?'linear-gradient(135deg,var(--accent),#9b6aff)':'var(--bg3)',color:plan.popular?'#fff':'var(--text)',border:plan.popular?'none':'1px solid var(--border)'}}>
              {user?.plan===plan.name.toLowerCase() ? '✓ Current Plan' : plan.price===0 ? 'Get Started Free' : `Get ${plan.name} →`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════
export function SettingsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [profile, setProfile] = useState({ name: user?.name||'', language: user?.language||'en', timezone: user?.timezone||'Asia/Kolkata' });
  const [passwords, setPasswords] = useState({ currentPassword:'', newPassword:'' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(profile);
      toast.success('Profile updated!');
    } catch {} finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) return toast.error('Fill both fields');
    setSaving(true);
    try {
      await authAPI.changePassword(passwords);
      toast.success('Password changed!');
      setPasswords({ currentPassword:'', newPassword:'' });
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="page fade-in">
      <div className="page-header"><div className="page-title">Settings ⚙️</div><div className="page-sub">Manage your account and preferences</div></div>

      <div className="grid grid-2">
        <div>
          <div className="card mb-4">
            <div className="card-title mb-4">👤 Profile</div>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={user?.email||''} disabled style={{opacity:0.5}} /></div>
            <div className="form-group">
              <label className="form-label">Language / भाषा</label>
              <div className="toggle-wrap">
                <div className={`toggle-btn ${profile.language==='en'?'active':''}`} onClick={()=>setProfile(p=>({...p,language:'en'}))}>English</div>
                <div className={`toggle-btn ${profile.language==='hi'?'active':''}`} onClick={()=>setProfile(p=>({...p,language:'hi'}))}>हिंदी</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-select" value={profile.timezone} onChange={e=>setProfile(p=>({...p,timezone:e.target.value}))}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving?'⟳ Saving...':'💾 Save Changes'}</button>
          </div>
        </div>

        <div>
          <div className="card mb-4">
            <div className="card-title mb-4">🔒 Change Password</div>
            <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" placeholder="••••••••" value={passwords.currentPassword} onChange={e=>setPasswords(p=>({...p,currentPassword:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" placeholder="••••••••" value={passwords.newPassword} onChange={e=>setPasswords(p=>({...p,newPassword:e.target.value}))} /></div>
            <button className="btn btn-secondary" onClick={changePassword} disabled={saving}>🔑 Update Password</button>
          </div>

          <div className="card">
            <div className="card-title mb-3">📋 Account Info</div>
            {[['Plan', user?.plan?.toUpperCase()],['Role', user?.role],['Member since', new Date(user?.createdAt||Date.now()).toLocaleDateString()]].map(([k,v]) => (
              <div key={k} className="flex justify-between" style={{padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                <span style={{color:'var(--muted)'}}>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
            <div style={{marginTop:16}}>
              <a href="/plans" className="btn btn-primary btn-sm">⚡ Upgrade Plan</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// ADMIN PAGE
// ══════════════════════════════════════════════
export function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getUsers().then(r => setUsers(r.data.users)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const updatePlan = async (id, plan) => {
    await adminAPI.updatePlan(id, plan);
    setUsers(u => u.map(x => x._id===id ? {...x, plan} : x));
    toast.success('Plan updated!');
  };

  const toggleStatus = async (id, current) => {
    await adminAPI.updateStatus(id, !current);
    setUsers(u => u.map(x => x._id===id ? {...x, isActive:!current} : x));
    toast.success(current?'User deactivated':'User activated');
  };

  return (
    <div className="page fade-in">
      <div className="page-header"><div className="page-title">Admin Panel 👑</div><div className="page-sub">Manage users and plans</div></div>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div className="card-title">All Users ({users.length})</div>
        </div>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{fontWeight:600}}>{u.name}</td>
                    <td style={{color:'var(--muted)',fontSize:12}}>{u.email}</td>
                    <td><span className="tag">{u.role}</span></td>
                    <td>
                      <select className="form-select" style={{width:'auto',padding:'3px 8px',fontSize:12}} value={u.plan} onChange={e=>updatePlan(u._id,e.target.value)}>
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                      </select>
                    </td>
                    <td><span style={{fontSize:12,color:u.isActive?'var(--success)':'var(--danger)',fontWeight:600}}>{u.isActive?'✅ Active':'❌ Inactive'}</span></td>
                    <td>
                      <button className={`btn btn-sm ${u.isActive?'btn-danger':'btn-success'}`} onClick={()=>toggleStatus(u._id,u.isActive)}>
                        {u.isActive?'Deactivate':'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
