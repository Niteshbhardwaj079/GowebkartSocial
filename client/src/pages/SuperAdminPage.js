import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import PasswordInput from '../components/common/PasswordInput';
import ActivityLog from '../components/common/ActivityLog';
import PaymentsTable from '../components/common/PaymentsTable';

const SA = {
  getStats:     ()         => api.get('/superadmin/stats'),
  getUsers:     (p)        => api.get('/superadmin/users', { params: p }),
  getAdmins:    ()         => api.get('/superadmin/admins'),
  createAdmin:  (d)        => api.post('/superadmin/admins', d),
  updatePlan:   (id, plan) => api.put(`/superadmin/users/${id}/plan`, { plan }),
  toggleStatus: (id, v)    => api.put(`/superadmin/users/${id}/status`, { isActive: v }),
  promote:      (id)       => api.put(`/superadmin/users/${id}/promote`),
  demote:       (id)       => api.put(`/superadmin/users/${id}/demote`),
  deleteUser:   (id)       => api.delete(`/superadmin/users/${id}`),
  getPlans:     ()         => api.get('/superadmin/plans'),
  createPlan:   (d)        => api.post('/superadmin/plans', d),
  updatePlanDB: (id, d)    => api.put(`/superadmin/plans/${id}`, d),
  deletePlan:   (id)       => api.delete(`/superadmin/plans/${id}`),
  seedPlans:    ()         => api.post('/superadmin/plans/seed'),
  updatePermissions: (id, p) => api.put(`/superadmin/admins/${id}/permissions`, { permissions: p }),
};

const PERMISSION_DEFS = [
  { key: 'manageUsers',   label: 'Manage Users',     desc: 'Promote, block, view users in their company' },
  { key: 'changePlans',   label: 'Change Plans',     desc: 'Upgrade/downgrade user plans' },
  { key: 'viewAllPosts',  label: 'View All Posts',   desc: 'See posts of all users in their company' },
  { key: 'deletePosts',   label: 'Delete Posts',     desc: "Can delete other users' posts" },
  { key: 'manageBilling', label: 'Manage Billing',   desc: 'Razorpay / payment access' },
  { key: 'viewAuditLog',  label: 'View Activity Log', desc: "See company users' activity history" },
];

// Permissions modal
function PermissionsModal({ admin, onSave, onClose }) {
  const [perms, setPerms] = useState(admin.permissions || {});
  const [saving, setSaving] = useState(false);
  const handle = async () => { setSaving(true); try { await onSave(admin._id, perms); } finally { setSaving(false); } };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-title">🔧 Permissions — {admin.name}</div>
        <div className="modal-sub">Toggle karke set karo ye admin kya kya kar sakta hai. Save ke baad audit log me record hoga.</div>
        {PERMISSION_DEFS.map(p => (
          <div key={p.key} onClick={() => setPerms(s => ({ ...s, [p.key]: !s[p.key] }))}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px',
              background: perms[p.key] ? 'rgba(76,255,159,0.08)' : 'var(--bg3)',
              border: `1px solid ${perms[p.key] ? 'rgba(76,255,159,0.3)' : 'var(--border)'}`,
              borderRadius: 8, cursor:'pointer', marginBottom:8 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:13 }}>{p.label}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{p.desc}</div>
            </div>
            <div style={{ width:42, height:22, borderRadius:11, background: perms[p.key] ? 'var(--success)' : '#ddd', position:'relative', flexShrink:0, transition:'all .2s' }}>
              <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: perms[p.key] ? 23 : 3, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        ))}
        <div className="flex gap-3" style={{ marginTop:16 }}>
          <button className="btn btn-primary" onClick={handle} disabled={saving}>{saving ? '⟳ Saving...' : '💾 Save Permissions'}</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const Spinner = () => <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>⟳ Loading...</div>;

// ── Create Admin Modal ──
function CreateAdminModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handle = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">👑 Create New Admin</div>
        <div className="modal-sub">Admin ko Pro plan milega aur woh users manage kar sakta hai</div>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" placeholder="Admin Name" value={form.name} onChange={set('name')} />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" placeholder="admin@example.com" value={form.email} onChange={set('email')} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <PasswordInput placeholder="Strong password" value={form.password} onChange={set('password')} />
        </div>
        <div style={{ background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          ℹ️ Admin ko ye milega: <strong style={{ color: 'var(--text)' }}>Pro Plan + Users manage karne ka access</strong>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={handle} disabled={saving}>{saving ? '⟳ Creating...' : '✅ Create Admin'}</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Plan Modal ──
function PlanModal({ plan, onSave, onClose }) {
  const [form, setForm] = useState(plan || {
    name: '', displayName: '', description: '',
    price: { monthly: 0, yearly: 0 },
    limits: { postsPerMonth: 30, socialAccounts: 3, aiCallsPerDay: 5, teamMembers: 1, adsAccess: false, bulkUpload: false, analyticsAdvanced: false },
    isActive: true, isPopular: false, sortOrder: 1
  });

  const set = (path, val) => {
    const keys = path.split('.');
    setForm(f => {
      const c = JSON.parse(JSON.stringify(f));
      let o = c;
      for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
      o[keys[keys.length - 1]] = val;
      return c;
    });
  };

  const getVal = (path) => {
    const keys = path.split('.');
    let o = form;
    for (const k of keys) o = o?.[k];
    return o;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{plan ? 'Edit Plan' : 'Create Plan'}</div>
        <div className="modal-sub">Plan limits aur pricing set karo</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { path: 'name',            label: 'Plan Key',           type: 'text',   placeholder: 'e.g. basic',  disabled: !!plan },
            { path: 'displayName',     label: 'Display Name',       type: 'text',   placeholder: 'e.g. Basic'   },
            { path: 'price.monthly',   label: 'Monthly Price (₹)',  type: 'number', placeholder: '999'          },
            { path: 'price.yearly',    label: 'Yearly Price (₹/mo)',type: 'number', placeholder: '799'          },
            { path: 'limits.postsPerMonth',  label: 'Posts/Month',      type: 'number', placeholder: '100'     },
            { path: 'limits.socialAccounts', label: 'Social Accounts',  type: 'number', placeholder: '10'      },
            { path: 'limits.aiCallsPerDay',  label: 'AI Calls/Day',     type: 'number', placeholder: '20'      },
            { path: 'limits.teamMembers',    label: 'Team Members',     type: 'number', placeholder: '3'       },
          ].map(f => (
            <div key={f.path} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{f.label}</label>
              <input className="form-input" type={f.type} placeholder={f.placeholder}
                value={getVal(f.path) || ''}
                onChange={e => set(f.path, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                disabled={f.disabled} />
            </div>
          ))}
        </div>

        {/* Feature toggles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, margin: '14px 0' }}>
          {[
            { path: 'limits.adsAccess',        label: 'Ads Access'         },
            { path: 'limits.bulkUpload',        label: 'Bulk Upload'        },
            { path: 'limits.analyticsAdvanced', label: 'Advanced Analytics' },
            { path: 'limits.whiteLabel',        label: 'White Label'        },
            { path: 'limits.apiAccess',         label: 'API Access'         },
            { path: 'isPopular',                label: 'Mark Popular'       },
          ].map(f => {
            const val = getVal(f.path);
            return (
              <div key={f.path} onClick={() => set(f.path, !val)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: val ? 'rgba(76,255,159,0.1)' : 'var(--bg3)', border: `1px solid ${val ? 'rgba(76,255,159,0.3)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                <span>{val ? '✅' : '⬜'}</span> {f.label}
              </div>
            );
          })}
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" placeholder="Plan description" value={form.description || ''} onChange={e => set('description', e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={() => onSave(form)}>💾 Save Plan</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// MAIN SUPER ADMIN PAGE
// ══════════════════════════════════════════════
export default function SuperAdminPage() {
  const { user }  = useSelector(s => s.auth);
  const navigate  = useNavigate();
  const [tab,     setTab]     = useState('dashboard');
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [admins,  setAdmins]  = useState([]);
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [dormancyFilter, setDormancyFilter] = useState(''); // '' | '7' | '30' | '90'
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showPlanModal,   setShowPlanModal]   = useState(false);
  const [editPlan,        setEditPlan]        = useState(null);
  const [editPermAdmin,   setEditPermAdmin]   = useState(null);

  useEffect(() => { if (user && user.role !== 'superadmin') navigate('/dashboard'); }, [user, navigate]);
  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') { const r = await SA.getStats(); setStats(r.data); }
      if (tab === 'users')     { const r = await SA.getUsers({ search, plan: planFilter }); setUsers(r.data.users || []); }
      if (tab === 'admins')    { const r = await SA.getAdmins(); setAdmins(r.data.admins || []); }
      if (tab === 'plans')     { const r = await SA.getPlans();  setPlans(r.data.plans  || []); }
    } catch (e) { if (e.response?.status !== 404 && e.response) toast.error('Load failed'); }
    finally { setLoading(false); }
  };

  const handleCreateAdmin = async (form) => {
    await SA.createAdmin(form);
    toast.success('✅ Admin created!');
    setShowCreateAdmin(false);
    loadData();
  };

  const handleUpdatePlan = async (userId, plan) => {
    await SA.updatePlan(userId, plan);
    toast.success('Plan updated!');
    setUsers(u => u.map(x => x._id === userId ? { ...x, plan } : x));
  };

  const handleToggleStatus = async (userId, current) => {
    await SA.toggleStatus(userId, !current);
    toast.success(!current ? '✅ Activated' : '❌ Deactivated');
    setUsers(u => u.map(x => x._id === userId ? { ...x, isActive: !current } : x));
  };

  const handlePromote = async (userId, name) => {
    if (!window.confirm(`Promote ${name} to Admin?`)) return;
    await SA.promote(userId);
    toast.success(`${name} is now Admin! 👑`);
    loadData();
  };

  const handleDemote = async (userId, name) => {
    if (!window.confirm(`Demote ${name} to regular User?`)) return;
    await SA.demote(userId);
    toast.success(`${name} is now a regular User`);
    loadData();
  };

  const handleDelete = async (userId, name, email) => {
    const confirmEmail = window.prompt(
      `⚠️ DELETE ${name} (${email})?\n\nYe permanent hai — user ke saare posts, social accounts, settings delete ho jaayenge. Payments aur audit log preserve rahenge.\n\nConfirm karne ke liye email type karein:`
    );
    if (confirmEmail?.trim().toLowerCase() !== email?.toLowerCase()) {
      if (confirmEmail !== null) toast.error('Email match nahi hua. Cancelled.');
      return;
    }
    try {
      await SA.deleteUser(userId);
      toast.success(`🗑️ ${name} deleted`);
      setUsers(u => u.filter(x => x._id !== userId));
      setAdmins(a => a.filter(x => x._id !== userId));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const handleSavePlan = async (form) => {
    if (editPlan?._id) { await SA.updatePlanDB(editPlan._id, form); toast.success('Plan updated!'); }
    else               { await SA.createPlan(form);                  toast.success('Plan created!'); }
    setShowPlanModal(false); setEditPlan(null); loadData();
  };

  const TABS = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'users',     icon: '👥', label: 'Users'     },
    { id: 'admins',    icon: '👑', label: 'Admins'    },
    { id: 'plans',     icon: '💎', label: 'Plans'     },
    { id: 'payments',  icon: '💳', label: 'Payments'  },
    { id: 'audit',     icon: '📜', label: 'Activity Log' },
  ];

  const handleSavePermissions = async (adminId, permissions) => {
    await SA.updatePermissions(adminId, permissions);
    toast.success('✅ Permissions saved');
    setEditPermAdmin(null);
    if (tab === 'admins') loadData();
  };

  const RoleBadge = ({ role }) => (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase',
      background: role === 'superadmin' ? 'rgba(255,184,106,0.15)' : role === 'admin' ? 'rgba(124,106,255,0.15)' : 'rgba(122,122,154,0.15)',
      color: role === 'superadmin' ? 'var(--warning)' : role === 'admin' ? 'var(--accent)' : 'var(--muted)',
      border: `1px solid ${role === 'superadmin' ? 'rgba(255,184,106,0.3)' : role === 'admin' ? 'rgba(124,106,255,0.3)' : 'rgba(122,122,154,0.3)'}`
    }}>{role}</span>
  );

  const PlanBadge = ({ plan }) => (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase',
      background: plan === 'pro' ? 'rgba(255,106,155,0.15)' : plan === 'basic' ? 'rgba(124,106,255,0.15)' : 'rgba(122,122,154,0.15)',
      color: plan === 'pro' ? 'var(--accent2)' : plan === 'basic' ? 'var(--accent)' : 'var(--muted)'
    }}>{plan}</span>
  );

  const fmt = (n) => {
    if (!n || n < 1000) return Number(n || 0).toLocaleString('en-IN');
    if (n < 100000)  return (n / 1000).toFixed(n < 10000 ? 1 : 0) + 'K';
    if (n < 10000000) return (n / 100000).toFixed(1) + 'L';
    return (n / 10000000).toFixed(1) + 'Cr';
  };

  const ActivityStatus = ({ user }) => {
    const last = user.lastActiveAt || user.lastLoginAt;
    if (!last) {
      return (
        <div style={{ fontSize:11 }}>
          <div style={{ fontWeight:700, color:'var(--muted)' }}>⚪ Never</div>
          <div style={{ fontSize:10, color:'var(--muted)' }}>Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })}</div>
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
        <div style={{ fontSize:10, color:'var(--muted)' }}>Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })}</div>
      </div>
    );
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
      <div className="page-header flex justify-between items-center">
        <div>
          <div className="page-title">👑 Super Admin Panel</div>
          <div className="page-sub">Platform manage karo — users, admins, plans sab yahan</div>
        </div>
        <div style={{ background: 'rgba(255,184,106,0.15)', border: '1px solid rgba(255,184,106,0.3)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'var(--warning)' }}>
          ⚡ SUPER ADMIN
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg3)', padding: 4, borderRadius: 'var(--radius2)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : <>

        {/* ─── DASHBOARD ─── */}
        {tab === 'dashboard' && stats && (
          <div>
            <div className="grid grid-4 mb-4">
              {[
                { label: 'Total Users',     value: stats.stats?.totalUsers,        icon: '👥', color: 'purple' },
                { label: 'Total Posts',     value: stats.stats?.totalPosts,        icon: '📝', color: 'pink'   },
                { label: 'Published',       value: stats.stats?.publishedPosts,    icon: '✅', color: 'green'  },
                { label: 'Paid Users',      value: (stats.planCounts?.find(p => p._id === 'basic')?.count || 0) + (stats.planCounts?.find(p => p._id === 'pro')?.count || 0), icon: '💰', color: 'orange' },
              ].map((s, i) => (
                <div key={i} className={`stat-card ${s.color}`}>
                  <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                  <div className="stat-value">{fmt(s.value || 0)}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-3 mb-4">
              {[
                { label: 'Total Engagement', value: stats.stats?.totalEngagement, icon: '❤️', color: 'pink', sub: 'Likes + Comments + Shares' },
                { label: 'Total Reach',      value: stats.stats?.totalReach,      icon: '👁',  color: 'purple', sub: 'Unique viewers' },
                { label: 'Free Users',       value: stats.planCounts?.find(p => p._id === 'free')?.count || 0, icon: '🆓', color: 'green', sub: 'Not yet upgraded' },
              ].map((s, i) => (
                <div key={i} className={`stat-card ${s.color}`}>
                  <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                  <div className="stat-value">{fmt(s.value || 0)}</div>
                  <div className="stat-label">{s.label}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-title mb-3">🕐 Recent Signups</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Plan</th><th>Joined</th></tr></thead>
                  <tbody>
                    {stats.recentUsers?.map(u => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email}</td>
                        <td><RoleBadge role={u.role} /></td>
                        <td><PlanBadge plan={u.plan} /></td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── USERS ─── */}
        {tab === 'users' && (
          <div>
            <div className="flex gap-3 mb-4">
              <input className="form-input" placeholder="🔍 Name ya email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadData()} style={{ flex: 1, maxWidth: 300 }} />
              <select className="form-select" style={{ width: 'auto' }} value={planFilter} onChange={e => { setPlanFilter(e.target.value); }}>
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
              </select>
              <select className="form-select" style={{ width: 'auto' }} value={dormancyFilter} onChange={e => setDormancyFilter(e.target.value)}>
                <option value="">All Activity</option>
                <option value="active">🟢 Active (&lt;7d)</option>
                <option value="7">🟡 Idle (7-30d)</option>
                <option value="30">🔴 Dormant (30-90d)</option>
                <option value="90">⚫ Dead (&gt;90d)</option>
                <option value="never">⚪ Never logged in</option>
              </select>
              <button className="btn btn-secondary" onClick={loadData}>🔍 Search</button>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Plan</th><th>Activity</th><th>Last Seen</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.filter(u => {
                      if (!dormancyFilter) return true;
                      const last = u.lastActiveAt || u.lastLoginAt;
                      if (dormancyFilter === 'never') return !last;
                      if (!last) return false;
                      const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
                      if (dormancyFilter === 'active') return days < 7;
                      if (dormancyFilter === '7')      return days >= 7  && days < 30;
                      if (dormancyFilter === '30')     return days >= 30 && days < 90;
                      if (dormancyFilter === '90')     return days >= 90;
                      return true;
                    }).map(u => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email}</td>
                        <td><RoleBadge role={u.role} /></td>
                        <td>
                          <select className="form-select" style={{ width: 'auto', padding: '3px 8px', fontSize: 12 }} value={u.plan} onChange={e => handleUpdatePlan(u._id, e.target.value)} disabled={u.role === 'superadmin'}>
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                          </select>
                        </td>
                        <td><StatsCell s={u.postStats} /></td>
                        <td><ActivityStatus user={u} /></td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600, color: u.isActive ? 'var(--success)' : 'var(--danger)' }}>
                            {u.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {u.role === 'user' && (
                              <button className="btn btn-sm" style={{ background: 'rgba(124,106,255,0.15)', color: 'var(--accent)', border: '1px solid rgba(124,106,255,0.3)', fontSize: 11 }} onClick={() => handlePromote(u._id, u.name)}>
                                ↑ Admin
                              </button>
                            )}
                            {u.role === 'admin' && (
                              <button className="btn btn-sm" style={{ background: 'rgba(122,122,154,0.15)', color: 'var(--muted)', border: '1px solid var(--border)', fontSize: 11 }} onClick={() => handleDemote(u._id, u.name)}>
                                ↓ User
                              </button>
                            )}
                            {u.role !== 'superadmin' && (
                              <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleStatus(u._id, u.isActive)}>
                                {u.isActive ? 'Block' : 'Unblock'}
                              </button>
                            )}
                            {u.role !== 'superadmin' && (
                              <button className="btn btn-sm" style={{ background:'#fff0f0', color:'#e53e3e', border:'1px solid #ffcccc', fontSize:11 }} title="Permanently delete user" onClick={() => handleDelete(u._id, u.name, u.email)}>
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No users found</div>}
              </div>
            </div>
          </div>
        )}

        {/* ─── ADMINS ─── */}
        {tab === 'admins' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{admins.length} admin(s) total</div>
              <button className="btn btn-primary" onClick={() => setShowCreateAdmin(true)}>
                + Create Admin
              </button>
            </div>

            {/* Info box */}
            <div style={{ background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 'var(--radius2)', padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
              <strong style={{ color: 'var(--accent)' }}>Admin Role ke fayde:</strong>
              <div style={{ color: 'var(--muted)', marginTop: 6, lineHeight: 1.8 }}>
                ✅ Pro plan milta hai &nbsp;|&nbsp; ✅ Users manage kar sakte hain &nbsp;|&nbsp; ✅ Apna dashboard use kar sakte hain<br/>
                ❌ Super Admin panel access nahi &nbsp;|&nbsp; ❌ Plans create/delete nahi kar sakte
              </div>
            </div>

            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Company</th><th>Clients</th><th>Client Activity</th><th>Last Seen</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {admins.map(a => (
                      <tr key={a._id}>
                        <td style={{ fontWeight: 600 }}>{a.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{a.email}</td>
                        <td><RoleBadge role={a.role} /></td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{a.company?.name || '—'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>👥 {a.clientCount || 0}</td>
                        <td><StatsCell s={a.clientPostStats} /></td>
                        <td><ActivityStatus user={a} /></td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600, color: a.isActive ? 'var(--success)' : 'var(--danger)' }}>
                            {a.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {a.role === 'admin' && (
                              <>
                                <button className="btn btn-sm" style={{ background:'rgba(124,106,255,0.15)', color:'var(--accent)', border:'1px solid rgba(124,106,255,0.3)', fontSize:11 }} onClick={() => setEditPermAdmin(a)}>🔧 Permissions</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => handleDemote(a._id, a.name)}>↓ Demote</button>
                                <button className={`btn btn-sm ${a.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleStatus(a._id, a.isActive)}>
                                  {a.isActive ? 'Block' : 'Unblock'}
                                </button>
                                <button className="btn btn-sm" style={{ background:'#fff0f0', color:'#e53e3e', border:'1px solid #ffcccc', fontSize:11 }} title="Permanently delete admin" onClick={() => handleDelete(a._id, a.name, a.email)}>
                                  🗑️
                                </button>
                              </>
                            )}
                            {a.role === 'superadmin' && <span style={{ fontSize: 11, color: 'var(--muted)' }}>Protected</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admins.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>👑</div>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Koi admin nahi abhi</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreateAdmin(true)}>+ Create First Admin</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── PAYMENTS ─── */}
        {tab === 'payments' && <PaymentsTable />}

        {/* ─── ACTIVITY LOG ─── */}
        {tab === 'audit' && (
          <ActivityLog scope="all" showSettings={true} />
        )}

        {/* ─── PLANS ─── */}
        {tab === 'plans' && (
          <div>
            <div className="flex gap-3 mb-4">
              <button className="btn btn-primary" onClick={() => { setEditPlan(null); setShowPlanModal(true); }}>+ Create Plan</button>
              {plans.length === 0 && (
                <button className="btn btn-secondary" onClick={async () => { await SA.seedPlans(); toast.success('Default plans created!'); loadData(); }}>
                  🌱 Default Plans Create Karo
                </button>
              )}
            </div>
            <div className="grid grid-3">
              {plans.map(plan => (
                <div key={plan._id} style={{ background: 'var(--card)', border: `1px solid ${plan.isPopular ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: 20, position: 'relative' }}>
                  {plan.isPopular && (
                    <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>⭐ Popular</div>
                  )}
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800 }}>{plan.displayName}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', margin: '8px 0' }}>
                    ₹{plan.price?.monthly}<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>/mo</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>{plan.description}</div>
                  <div style={{ fontSize: 12, lineHeight: 2, color: 'var(--muted)' }}>
                    <div>📝 {plan.limits?.postsPerMonth >= 999999 ? '∞ Unlimited' : plan.limits?.postsPerMonth} posts/mo</div>
                    <div>🔗 {plan.limits?.socialAccounts >= 999 ? '∞ Unlimited' : plan.limits?.socialAccounts} accounts</div>
                    <div>🤖 {plan.limits?.aiCallsPerDay >= 999999 ? '∞ Unlimited' : plan.limits?.aiCallsPerDay} AI/day</div>
                    <div>{plan.limits?.adsAccess ? '✅' : '❌'} Ads &nbsp; {plan.limits?.bulkUpload ? '✅' : '❌'} Bulk Upload</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { setEditPlan(plan); setShowPlanModal(true); }}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={async () => { if (!window.confirm('Delete plan?')) return; await SA.deletePlan(plan._id); toast.success('Deleted'); loadData(); }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
            {plans.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💎</div>
                <div>Koi plan nahi. Default plans create karo ya naya banao.</div>
              </div>
            )}
          </div>
        )}
      </>}

      {showCreateAdmin && <CreateAdminModal onSave={handleCreateAdmin} onClose={() => setShowCreateAdmin(false)} />}
      {showPlanModal   && <PlanModal plan={editPlan} onSave={handleSavePlan} onClose={() => { setShowPlanModal(false); setEditPlan(null); }} />}
      {editPermAdmin   && <PermissionsModal admin={editPermAdmin} onSave={handleSavePermissions} onClose={() => setEditPermAdmin(null)} />}
    </div>
  );
}