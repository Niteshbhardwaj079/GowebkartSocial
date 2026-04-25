import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import PasswordInput from '../components/common/PasswordInput';

const SA = {
  getStats:     ()         => api.get('/superadmin/stats'),
  getUsers:     (p)        => api.get('/superadmin/users', { params: p }),
  getAdmins:    ()         => api.get('/superadmin/admins'),
  createAdmin:  (d)        => api.post('/superadmin/admins', d),
  updatePlan:   (id, plan) => api.put(`/superadmin/users/${id}/plan`, { plan }),
  toggleStatus: (id, v)    => api.put(`/superadmin/users/${id}/status`, { isActive: v }),
  promote:      (id)       => api.put(`/superadmin/users/${id}/promote`),
  demote:       (id)       => api.put(`/superadmin/users/${id}/demote`),
  getPlans:     ()         => api.get('/superadmin/plans'),
  createPlan:   (d)        => api.post('/superadmin/plans', d),
  updatePlanDB: (id, d)    => api.put(`/superadmin/plans/${id}`, d),
  deletePlan:   (id)       => api.delete(`/superadmin/plans/${id}`),
  seedPlans:    ()         => api.post('/superadmin/plans/seed'),
};

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
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showPlanModal,   setShowPlanModal]   = useState(false);
  const [editPlan,        setEditPlan]        = useState(null);

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
  ];

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
                { label: 'Total Users',  value: stats.stats?.totalUsers,  icon: '👥', color: 'purple' },
                { label: 'Total Posts',  value: stats.stats?.totalPosts,  icon: '📝', color: 'pink'   },
                { label: 'Free Users',   value: stats.planCounts?.find(p => p._id === 'free')?.count  || 0, icon: '🆓', color: 'green'  },
                { label: 'Paid Users',   value: (stats.planCounts?.find(p => p._id === 'basic')?.count || 0) + (stats.planCounts?.find(p => p._id === 'pro')?.count || 0), icon: '💰', color: 'orange' },
              ].map((s, i) => (
                <div key={i} className={`stat-card ${s.color}`}>
                  <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                  <div className="stat-value">{s.value || 0}</div>
                  <div className="stat-label">{s.label}</div>
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
              <button className="btn btn-secondary" onClick={loadData}>🔍 Search</button>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map(u => (
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
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Company</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {admins.map(a => (
                      <tr key={a._id}>
                        <td style={{ fontWeight: 600 }}>{a.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{a.email}</td>
                        <td><RoleBadge role={a.role} /></td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{a.company?.name || '—'}</td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600, color: a.isActive ? 'var(--success)' : 'var(--danger)' }}>
                            {a.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {a.role === 'admin' && (
                              <>
                                <button className="btn btn-sm btn-secondary" onClick={() => handleDemote(a._id, a.name)}>↓ Demote</button>
                                <button className={`btn btn-sm ${a.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleStatus(a._id, a.isActive)}>
                                  {a.isActive ? 'Block' : 'Unblock'}
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
    </div>
  );
}