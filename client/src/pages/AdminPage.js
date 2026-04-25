import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';

const adminAPI = {
  getUsers:    ()          => api.get('/admin/users'),
  updatePlan:  (id, plan)  => api.put(`/admin/users/${id}/plan`,   { plan }),
  updateStatus:(id, active)=> api.put(`/admin/users/${id}/status`, { isActive: active }),
};

export default function AdminPage() {
  const { user: me } = useSelector(s => s.auth);
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

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">🛠️ Admin Panel</div>
        <div className="page-sub">Users manage karein — plan change, activate/deactivate</div>
      </div>

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
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Plan</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
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
                    <td>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:u.isActive?'#e8fff5':'#fff0f0', color:u.isActive?'#00b86b':'#e53e3e', border:`1px solid ${u.isActive?'#b3f0d8':'#ffcccc'}` }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'var(--muted)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })}</td>
                    <td>
                      {u._id !== me?._id && (
                        <button className={`btn btn-sm ${u.isActive?'btn-danger':'btn-success'}`} onClick={()=>handleStatus(u._id,!u.isActive)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
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