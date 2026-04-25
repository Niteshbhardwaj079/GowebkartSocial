import React, { useState, useEffect } from 'react';
import { auditAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CATEGORY_ICONS = {
  auth: '🔐', user: '👤', post: '📝', plan: '💎',
  admin: '👑', payment: '💳', social: '📱', system: '⚙️',
};

const ACTION_LABELS = {
  'user.registered':       '🎉 New account',
  'user.email_verified':   '✅ Email verified',
  'user.login':            '🔑 Logged in',
  'user.password_reset':   '🔄 Password reset',
  'user.password_changed': '🔄 Password changed',
  'user.plan.changed':     '💎 Plan changed',
  'user.activated':        '✅ Account activated',
  'user.deactivated':      '🚫 Account deactivated',
  'user.promoted':         '⬆️ Promoted to admin',
  'user.demoted':          '⬇️ Demoted to user',
  'admin.created':         '👑 New admin created',
  'admin.permissions.updated': '🔧 Admin permissions updated',
  'post.created':          '📝 Post created',
  'post.scheduled':        '🕐 Post scheduled',
  'post.published':        '✅ Post published',
  'post.failed':           '❌ Post failed',
  'post.deleted':          '🗑️ Post deleted',
  'payment.completed':     '💳 Payment received',
  'audit.cleared':         '🧹 Activity log cleared',
  'audit.settings.updated':'⚙️ Audit settings changed',
};

function actionLabel(a) { return ACTION_LABELS[a] || a; }

function ago(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(date).toLocaleDateString('en-IN');
}

/**
 * Reusable ActivityLog component.
 * Props:
 *  - scope: 'all' (superadmin) | 'company' (admin)
 *  - showSettings: bool — show retention setting + clear button (superadmin only)
 */
export default function ActivityLog({ scope = 'all', showSettings = false }) {
  const [logs,    setLogs]    = useState([]);
  const [pages,   setPages]   = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState({ category: '', days: 30, search: '', page: 1 });
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const isCompany = scope === 'company';

  const load = async () => {
    setLoading(true);
    try {
      const res = isCompany
        ? await auditAPI.companyList({ ...filter, limit: 50 })
        : await auditAPI.list({ ...filter, limit: 50 });
      setLogs(res.data.logs || []);
      setPages(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (e) {
      if (e.response?.status !== 403) toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await auditAPI.getSettings();
      setSettings(res.data.settings);
    } catch {}
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter.category, filter.days, filter.page]);
  useEffect(() => { if (showSettings) loadSettings(); }, [showSettings]);

  const handleSearch = (e) => { e.preventDefault(); setFilter(f => ({ ...f, page: 1 })); load(); };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await auditAPI.updateSettings(settings);
      toast.success('✅ Audit settings saved');
    } catch {} finally { setSavingSettings(false); }
  };

  const handleClear = async (olderThanDays) => {
    const msg = olderThanDays
      ? `Delete logs older than ${olderThanDays} days?`
      : 'Delete ALL activity logs? This cannot be undone.';
    if (!window.confirm(msg)) return;
    try {
      const res = await auditAPI.clear(olderThanDays ? { olderThanDays } : {});
      toast.success(`🧹 Deleted ${res.data.deletedCount} log(s)`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      {/* Settings strip (superadmin only) */}
      {showSettings && settings && (
        <div className="card mb-4" style={{ background:'rgba(124,106,255,0.05)', border:'1px solid rgba(124,106,255,0.2)' }}>
          <div className="card-title mb-3" style={{ fontSize:14 }}>⚙️ Activity Log Settings</div>
          <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label" style={{ fontSize:11 }}>Retention (days)</label>
              <input className="form-input" type="number" min={1} max={730} style={{ width:120 }}
                value={settings.retentionDays}
                onChange={e => setSettings(s => ({ ...s, retentionDays: Number(e.target.value) }))} />
              <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>Logs auto-delete after this</div>
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label" style={{ fontSize:11 }}>Logging</label>
              <select className="form-select" style={{ width:120 }}
                value={settings.enabled ? 'on' : 'off'}
                onChange={e => setSettings(s => ({ ...s, enabled: e.target.value === 'on' }))}>
                <option value="on">✅ Enabled</option>
                <option value="off">❌ Disabled</option>
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? '⟳' : '💾'} Save
            </button>
            <div style={{ flex:1 }} />
            <button className="btn btn-secondary btn-sm" onClick={() => handleClear(30)} title="Delete logs older than 30 days">
              🧹 Clear &gt; 30 days
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleClear(0)} title="Delete ALL logs">
              ⚠️ Clear All
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-4" style={{ flexWrap:'wrap', alignItems:'center' }}>
        <input className="form-input" placeholder="🔍 Search description, name, email..."
          value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          style={{ flex:1, minWidth:200, maxWidth:340 }} />
        <select className="form-select" style={{ width:150 }}
          value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value, page: 1 }))}>
          <option value="">All Categories</option>
          <option value="auth">🔐 Auth</option>
          <option value="user">👤 User</option>
          <option value="post">📝 Post</option>
          <option value="plan">💎 Plan</option>
          <option value="admin">👑 Admin</option>
          <option value="payment">💳 Payment</option>
          <option value="system">⚙️ System</option>
        </select>
        <select className="form-select" style={{ width:130 }}
          value={filter.days} onChange={e => setFilter(f => ({ ...f, days: Number(e.target.value), page: 1 }))}>
          <option value={1}>Last 24h</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
        <button className="btn btn-secondary btn-sm" type="submit">🔍 Search</button>
        <div style={{ fontSize:11, color:'var(--muted)' }}>
          {pages.total} total · page {pages.page}/{pages.pages}
        </div>
      </form>

      {/* Logs table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>⟳ Loading...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
            <div>No activity yet for these filters</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width:160 }}>When</th>
                  <th>Action</th>
                  <th>Who</th>
                  <th>Target</th>
                  <th style={{ width:130 }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td style={{ fontSize:11, color:'var(--muted)' }}>
                      <div style={{ fontWeight:600, color:'var(--text)' }}>{ago(log.createdAt)}</div>
                      <div title={new Date(log.createdAt).toString()}>{new Date(log.createdAt).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short' })}</div>
                    </td>
                    <td>
                      <div style={{ fontSize:13, fontWeight:600 }}>
                        {CATEGORY_ICONS[log.category] || '•'} {actionLabel(log.action)}
                      </div>
                      <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{log.description}</div>
                    </td>
                    <td style={{ fontSize:12 }}>
                      <div style={{ fontWeight:600 }}>{log.actor?.name || '—'}</div>
                      <div style={{ fontSize:10, color:'var(--muted)' }}>{log.actor?.email}</div>
                      {log.actor?.role && (
                        <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:10,
                          background: log.actor.role==='superadmin'?'#fff3e8':log.actor.role==='admin'?'#f0f7ff':'#f5f5f5',
                          color:     log.actor.role==='superadmin'?'#dd8800':log.actor.role==='admin'?'#0066cc':'var(--muted)' }}>
                          {log.actor.role}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize:11, color:'var(--muted)' }}>
                      {log.target?.name ? (<>
                        <div style={{ color:'var(--text)', fontWeight:600 }}>{log.target.name}</div>
                        <div style={{ fontSize:10 }}>{log.target.type}</div>
                      </>) : '—'}
                    </td>
                    <td style={{ fontSize:10, color:'var(--muted)', fontFamily:'monospace' }}>
                      {log.ip || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages.pages > 1 && (
        <div className="flex gap-2 mt-3" style={{ justifyContent:'center' }}>
          <button className="btn btn-sm btn-ghost" disabled={pages.page <= 1}
            onClick={() => setFilter(f => ({ ...f, page: pages.page - 1 }))}>← Prev</button>
          <div style={{ padding:'0 12px', alignSelf:'center', fontSize:12, color:'var(--muted)' }}>
            Page {pages.page} / {pages.pages}
          </div>
          <button className="btn btn-sm btn-ghost" disabled={pages.page >= pages.pages}
            onClick={() => setFilter(f => ({ ...f, page: pages.page + 1 }))}>Next →</button>
        </div>
      )}
    </div>
  );
}
