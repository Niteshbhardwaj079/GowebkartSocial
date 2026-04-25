import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';
import ActivityLog from '../components/common/ActivityLog';

const adminAPI = {
  getUsers:    ()          => api.get('/admin/users'),
  updatePlan:  (id, plan)  => api.put(`/admin/users/${id}/plan`,   { plan }),
  updateStatus:(id, active)=> api.put(`/admin/users/${id}/status`, { isActive: active }),
  deleteUser:  id          => api.delete(`/admin/users/${id}`),
};

export default function AdminPage() {
  const { user: me } = useSelector(s => s.auth);
  const [tab,     setTab]     = useState('users');
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => { adminAPI.getUsers().then(r => setUsers(r.data.users||[])).catch(()=>{}).finally(()=>setLoading(false)); }, []);

  const filtered = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const handlePlan = async (id, plan) => {
    await adminAPI.updatePlan(id, plan);
    setUsers(u => u.map(x => x._id===id ? { ...x, plan } : x));
    toast.success('Plan updated!');
  };

  const handleStatus = async (id, active) => {
    await adminAPI.updateStatus(id, active);
    setUsers(u => u.map(x => x._id===id ? { ...x, isActive: active } : x));
    toast.success(active ? 'Account activated' : 'Account deactivated');
  };

  const handleDelete = async (id, name, email) => {
    const confirmEmail = window.prompt(
      `⚠️ DELETE ${name} (${email})?\n\nYe permanent hai — user ke saare posts, social accounts, settings delete ho jaayenge.\n\nConfirm karne ke liye email type karein:`
    );
    if (confirmEmail?.trim().toLowerCase() !== email?.toLowerCase()) {
      if (confirmEmail !== null) toast.error('Email match nahi hua. Cancelled.');
      return;
    }
    try {
      await adminAPI.deleteUser(id);
      toast.success(`🗑️ ${name} deleted`);
      setUsers(u => u.filter(x => x._id !== id));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const fmt = (n) => {
    if (!n || n < 1000) return Number(n || 0).toLocaleString('en-IN');
    if (n < 100000)  return (n / 1000).toFixed(n < 10000 ? 1 : 0) + 'K';
    if (n < 10000000) return (n / 100000).toFixed(1) + 'L';
    return (n / 10000000).toFixed(1) + 'Cr';
  };

  const StatsCell = ({ s }) => {
    if (!s) return <span style={{ color:'var(--muted)', fontSize:12 }}>—</span>;
    return (
      <div style={{ fontSize:11, lineHeight:1.5 }}>
        <div title={`Published: ${s.publishedPosts} | Scheduled: ${s.scheduledPosts} | Failed: ${s.failedPosts}`}>
          📝 <strong>{fmt(s.totalPosts)}</strong> <span style={{ color:'var(--muted)' }}>({s.publishedPosts} published)</span>
        </div>
        <div title={`Likes: ${s.likes} | Comments: ${s.comments} | Shares: ${s.shares}`} style={{ color:'var(--muted)' }}>
          ❤️ {fmt(s.engagement)} engage &nbsp; 👁 {fmt(s.reach)} reach
        </div>
      </div>
    );
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">🛠️ Admin Panel</div>
        <div className="page-sub">Users manage karein aur company activity dekho</div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--bg3)', padding:4, borderRadius:'var(--radius2)', border:'1px solid var(--border)', width:'fit-content' }}>
        {[
          { id:'users',    icon:'👥', label:'Users' },
          { id:'activity', icon:'📜', label:'Activity Log' },
        ].map(t => (
          <button key={t.id} className={`btn btn-sm ${tab===t.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'activity' && <ActivityLog scope="company" showSettings={false} />}

      {tab === 'users' && <>
      <div style={{ marginBottom:16 }}>
        <input className="form-input" placeholder="🔍 Search users..." value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:280, fontSize:13 }} />
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>⟳ Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Koi user nahi mila</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Plan</th><th>Activity</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                    <td style={{ fontWeight:600 }}>{u.name}</td>
                    <td style={{ fontSize:12, color:'var(--muted)' }}>{u.email}</td>
                    <td>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background: u.role==='superadmin'?'#fff3e8':u.role==='admin'?'#f0f7ff':'#f5f5f5', color: u.role==='superadmin'?'#dd8800':u.role==='admin'?'#0066cc':'var(--muted)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u._id !== me?._id ? (
                        <select value={u.plan} onChange={e=>handlePlan(u._id,e.target.value)}
                          style={{ fontSize:12, padding:'4px 8px', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', background:'#fff' }}>
                          <option value="free">Free</option>
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                        </select>
                      ) : (
                        <span style={{ fontSize:12, fontWeight:700, textTransform:'capitalize' }}>{u.plan}</span>
                      )}
                    </td>
                    <td><StatsCell s={u.postStats} /></td>
                    <td>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:u.isActive?'#e8fff5':'#fff0f0', color:u.isActive?'#00b86b':'#e53e3e', border:`1px solid ${u.isActive?'#b3f0d8':'#ffcccc'}` }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'var(--muted)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })}</td>
                    <td>
                      {u._id !== me?._id && (
                        <div className="flex gap-2">
                          <button className={`btn btn-sm ${u.isActive?'btn-danger':'btn-success'}`} onClick={()=>handleStatus(u._id,!u.isActive)}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          {u.role === 'user' && (
                            <button className="btn btn-sm" style={{ background:'#fff0f0', color:'#e53e3e', border:'1px solid #ffcccc', fontSize:11 }} title="Permanently delete user" onClick={()=>handleDelete(u._id, u.name, u.email)}>
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>}
    </div>
  );
}