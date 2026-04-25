import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts, deletePost } from '../store';
import { toast } from 'react-toastify';

export default function PostsPage() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector(s => s.posts);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { dispatch(fetchPosts()); }, [dispatch]);

  const filtered = items.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter;
    const matchSearch = !search || p.content?.text?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Post delete karein?')) return;
    try { await dispatch(deletePost(id)); toast.success('Post deleted!'); }
    catch { toast.error('Delete failed'); }
  };

  const STATUS_COLORS = {
    published: '#00b86b', scheduled: '#0066cc', draft: '#718096', failed: '#e53e3e', publishing: '#dd8800'
  };

  return (
    <div className="page fade-in">
      <div className="page-header flex justify-between items-center" style={{ flexWrap:'wrap', gap:10 }}>
        <div>
          <div className="page-title">📋 All Posts</div>
          <div className="page-sub">{items.length} total posts</div>
        </div>
        <a href="/create" className="btn btn-primary">+ New Post</a>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input className="form-input" placeholder="🔍 Search posts..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:220, fontSize:13 }} />
        {['all','published','scheduled','draft','failed'].map(s => (
          <button key={s} className={`btn btn-sm ${filter===s?'btn-primary':'btn-secondary'}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase()+s.slice(1)}
            <span style={{ marginLeft:4, fontSize:11, opacity:0.8 }}>({items.filter(p=>s==='all'||p.status===s).length})</span>
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>⟳ Loading posts...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:40 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📝</div>
            <div style={{ fontWeight:700, marginBottom:6 }}>{search ? 'Koi post match nahi' : 'Koi post nahi'}</div>
            <a href="/create" className="btn btn-primary btn-sm">Create First Post →</a>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Content</th><th>Platforms</th><th>Status</th><th>Scheduled</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(post => (
                  <tr key={post._id}>
                    <td style={{ maxWidth:200 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {post.content?.media?.[0] && (
                          <img src={post.content.media[0].url} alt="" style={{ width:32, height:32, borderRadius:6, objectFit:'cover', flexShrink:0 }} />
                        )}
                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13 }}>
                          {post.content?.text?.slice(0,60) || '📷 Media post'}
                        </div>
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
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${STATUS_COLORS[post.status]}15`, color:STATUS_COLORS[post.status], border:`1px solid ${STATUS_COLORS[post.status]}40` }}>
                        {post.status}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'var(--muted)' }}>
                      {post.scheduling?.scheduledAt ? new Date(post.scheduling.scheduledAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}
                    </td>
                    <td style={{ fontSize:12, color:'var(--muted)' }}>
                      {new Date(post.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(post._id)}>🗑️</button>
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
