import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';
import ActivityLog from '../components/common/ActivityLog';
import PaymentsTable from '../components/common/PaymentsTable';
import PasswordInput from '../components/common/PasswordInput';

const adminAPI = {
  getUsers:        ()          => api.get('/admin/users'),
  createUser:      (d)         => api.post('/admin/users', d),
  updatePlan:      (id, plan)  => api.put(`/admin/users/${id}/plan`,   { plan }),
  updateStatus:    (id, active)=> api.put(`/admin/users/${id}/status`, { isActive: active }),
  updatePerms:     (id, perms) => api.put(`/admin/users/${id}/permissions`, { permissions: perms }),
  deleteUser:      id          => api.delete(`/admin/users/${id}`),
};

const TEAM_PERMISSIONS = [
  { key: 'canCreatePost',      label: 'Create Posts',         desc: 'Post Now / Save as draft' },
  { key: 'canSchedulePost',    label: 'Schedule Posts',       desc: 'Future date pe schedule' },
  { key: 'canManageInbox',     label: 'Manage Inbox',         desc: 'Comments & messages reply karna' },
  { key: 'canViewAnalytics',   label: 'View Analytics',       desc: 'Dashboard + analytics page dekh sake' },
  { key: 'canConnectAccounts', label: 'Connect Social Accts', desc: 'Naye FB/IG/LinkedIn connect karna (rare)' },
];

// ── Create Team Member modal ──
function CreateTeamModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    permissions: { canCreatePost: true, canSchedulePost: true, canManageInbox: true, canViewAnalytics: true, canConnectAccounts: false },
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const togglePerm = k => setForm(f => ({ ...f, permissions: { ...f.permissions, [k]: !f.permissions[k] } }));

  const handle = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-title">👥 Create Team Member</div>
        <div className="modal-sub">Naya user banao aur access permissions set karo. Email already verified mark hoga (admin vouches).</div>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Rahul Sharma" value={form.name} onChange={set('name')} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="rahul@example.com" value={form.email} onChange={set('email')} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <PasswordInput placeholder="Strong password (6+ chars)" value={form.password} onChange={set('password')} />
        </div>

        <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', margin:'14px 0 8px' }}>Permissions</div>
        {TEAM_PERMISSIONS.map(p => (
          <div key={p.key} onClick={() => togglePerm(p.key)} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'10px 12px',
            background: form.permissions[p.key] ? 'rgba(76,255,159,0.08)' : 'var(--bg3)',
            border: `1px solid ${form.permissions[p.key] ? 'rgba(76,255,159,0.3)' : 'var(--border)'}`,
            borderRadius: 8, cursor:'pointer', marginBottom: 6,
          }}>
            <div>
              <div style={{ fontWeight:600, fontSize:13 }}>{p.label}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>{p.desc}</div>
            </div>
            <div style={{ width:38, height:20, borderRadius:10, background: form.permissions[p.key] ? 'var(--success)' : '#ddd', position:'relative', flexShrink:0, transition:'all .2s' }}>
              <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: form.permissions[p.key] ? 21 : 3, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        ))}

        <div className="flex gap-3" style={{ marginTop:14 }}>
          <button className="btn btn-primary" onClick={handle} disabled={saving}>{saving ? '⟳ Creating...' : '✅ Create Team Member'}</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Permissions modal ──
function EditPermsModal({ user, onSave, onClose }) {
  const [perms, setPerms] = useState({
    canCreatePost: user.permissions?.canCreatePost ?? true,
    canSchedulePost: user.permissions?.canSchedulePost ?? true,
    canManageInbox: user.permissions?.canManageInbox ?? true,
    canViewAnalytics: user.permissions?.canViewAnalytics ?? true,
    canConnectAccounts: user.permissions?.canConnectAccounts ?? false,
  });
  const [saving, setSaving] = useState(false);
  const togglePerm = k => setPerms(p => ({ ...p, [k]: !p[k] }));
  const handle = async () => { setSaving(true); try { await onSave(user._id, perms); } finally { setSaving(false); } };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-title">🔧 Permissions — {user.name}</div>
        <div className="modal-sub">{user.email}</div>
        {TEAM_PERMISSIONS.map(p => (
          <div key={p.key} onClick={() => togglePerm(p.key)} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'10px 12px',
            background: perms[p.key] ? 'rgba(76,255,159,0.08)' : 'var(--bg3)',
            border: `1px solid ${perms[p.key] ? 'rgba(76,255,159,0.3)' : 'var(--border)'}`,
            borderRadius: 8, cursor:'pointer', marginBottom: 6,
          }}>
            <div>
              <div style={{ fontWeight:600, fontSize:13 }}>{p.label}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>{p.desc}</div>
            </div>
            <div style={{ width:38, height:20, borderRadius:10, background: perms[p.key] ? 'var(--success)' : '#ddd', position:'relative', flexShrink:0, transition:'all .2s' }}>
              <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: perms[p.key] ? 21 : 3, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        ))}
        <div className="flex gap-3" style={{ marginTop:14 }}>
          <button className="btn btn-primary" onClick={handle} disabled={saving}>{saving ? '⟳ Saving...' : '💾 Save'}</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user: me } = useSelector(s => s.auth);
  const [tab,     setTab]     = useState('users');
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editPerms,  setEditPerms]  = useState(null);

  const refresh = () => adminAPI.getUsers().then(r => setUsers(r.data.users||[])).catch(()=>{});
  useEffect(() => { adminAPI.getUsers().then(r => setUsers(r.data.users||[])).catch(()=>{}).finally(()=>setLoading(false)); }, []);

  const handleCreate = async (form) => {
    try {
      await adminAPI.createUser(form);
      toast.success(`✅ ${form.name} added to team`);
      setShowCreate(false);
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Create failed');
    }
  };

  const handleSavePerms = async (id, perms) => {
    try {
      await adminAPI.updatePerms(id, perms);
      toast.success('✅ Permissions updated');
      setEditPerms(null);
      setUsers(u => u.map(x => x._id === id ? { ...x, permissions: { ...x.permissions, ...perms } } : x));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

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

  const ActivityStatus = ({ user }) => {
    const last = user.lastActiveAt || user.lastLoginAt;
    if (!last) {
      return (
        <div style={{ fontSize:11 }}>
          <div style={{ fontWeight:700, color:'var(--muted)' }}>⚪ Never</div>
        </div>
      );
    }
    const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
    const hours = Math.floor((Date.now() - new Date(last).getTime()) / 3600000);
    let color, status, label;
    if (hours < 24)      { color = '#10b981'; status = '🟢'; label = hours < 1 ? 'Just now' : `${hours}h ago`; }
    else if (days < 7)   { color = '#10b981'; status = '🟢'; label = `${days}d ago`; }
    else if (days < 30)  { color = '#dd8800'; status = '🟡'; label = `${days}d ago`; }
    else if (days < 90)  { color = '#e53e3e'; status = '🔴'; label = `${days}d ago`; }
    else                 { color = '#7a7a9a'; status = '⚫'; label = `${days}d dormant`; }
    return (
      <div style={{ fontSize:11 }} title={`Last active: ${new Date(last).toLocaleString('en-IN')}`}>
        <div style={{ fontWeight:700, color }}>{status} {label}</div>
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
          { id:'payments', icon:'💳', label:'Payments' },
          { id:'activity', icon:'📜', label:'Activity Log' },
        ].map(t => (
          <button key={t.id} className={`btn btn-sm ${tab===t.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'payments' && <PaymentsTable />}
      {tab === 'activity' && <ActivityLog scope="company" showSettings={false} />}

      {tab === 'users' && <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, marginBottom:16 }}>
        <input className="form-input" placeholder="🔍 Search users..." value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:280, fontSize:13 }} />
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Create Team Member</button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>⟳ Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Koi user nahi mila</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Plan</th><th>Activity</th><th>Last Seen</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
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
                    <td><ActivityStatus user={u} /></td>
                    <td>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:u.isActive?'#e8fff5':'#fff0f0', color:u.isActive?'#00b86b':'#e53e3e', border:`1px solid ${u.isActive?'#b3f0d8':'#ffcccc'}` }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'var(--muted)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })}</td>
                    <td>
                      {u._id !== me?._id && (
                        <div className="flex gap-2" style={{ flexWrap:'wrap' }}>
                          {u.role === 'user' && (
                            <button className="btn btn-sm" style={{ background:'rgba(124,106,255,0.15)', color:'var(--accent)', border:'1px solid rgba(124,106,255,0.3)', fontSize:11 }} onClick={()=>setEditPerms(u)}>🔧 Perms</button>
                          )}
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

      {showCreate && <CreateTeamModal onSave={handleCreate} onClose={() => setShowCreate(false)} />}
      {editPerms  && <EditPermsModal  user={editPerms} onSave={handleSavePerms} onClose={() => setEditPerms(null)} />}
    </div>
  );
}