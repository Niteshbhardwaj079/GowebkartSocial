import React, { useEffect, useState } from 'react';
import { paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';

/**
 * Reusable payments table.
 * Backend `/payment/admin/payments` auto-scopes results: superadmin sees
 * everything, admin only their company. So this component works for both.
 */
export default function PaymentsTable() {
  const [data, setData] = useState({ payments: [], total: 0, revenue: 0, paidCount: 0, failedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', search: '', page: 1 });

  const load = async () => {
    setLoading(true);
    try {
      const r = await paymentAPI.listAll({ ...filter, limit: 50 });
      setData(r.data);
    } catch (e) {
      if (e.response?.status !== 403) toast.error('Failed to load payments');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter.status, filter.page]);

  const fmtINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-3 mb-4">
        <div className="stat-card green">
          <div className="stat-icon green">💰</div>
          <div className="stat-value">{fmtINR(data.revenue)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple">✅</div>
          <div className="stat-value">{data.paidCount || 0}</div>
          <div className="stat-label">Successful Payments</div>
        </div>
        <div className="stat-card pink">
          <div className="stat-icon pink">❌</div>
          <div className="stat-value">{data.failedCount || 0}</div>
          <div className="stat-label">Failed Attempts</div>
        </div>
      </div>

      {/* Filter bar */}
      <form onSubmit={(e) => { e.preventDefault(); setFilter(f => ({ ...f, page: 1 })); load(); }}
        className="flex gap-3 mb-4" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="🔍 Search user name or email..."
          value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          style={{ flex: 1, minWidth: 220, maxWidth: 340 }} />
        <select className="form-select" style={{ width: 150 }}
          value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          <option value="paid">✅ Paid Only</option>
          <option value="failed">❌ Failed Only</option>
          <option value="created">⏳ Pending</option>
        </select>
        <button type="submit" className="btn btn-secondary btn-sm">🔍 Search</button>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
          {data.total} total
        </div>
      </form>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>⟳ Loading...</div>
        ) : data.payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💳</div>
            <div>No payments yet</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Invoice #</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map(p => {
                  const isPaid = p.status === 'paid';
                  const isFailed = p.status === 'failed';
                  return (
                    <tr key={p._id} style={{ opacity: isPaid ? 1 : 0.85 }}>
                      <td style={{ fontSize: 11, color: 'var(--muted)' }}>
                        <div>{new Date(p.paidAt || p.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                        <div style={{ fontSize: 10 }}>{new Date(p.paidAt || p.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.user?.name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.user?.email}</div>
                        {p.company?.name && <div style={{ fontSize: 10, color: 'var(--muted)' }}>🏢 {p.company.name}</div>}
                      </td>
                      <td style={{ fontSize: 11, fontFamily: 'monospace', color: isPaid ? 'var(--text)' : 'var(--muted)' }}>
                        {p.invoiceNumber || '—'}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f0f7ff', color: '#0066cc', textTransform: 'uppercase' }}>
                          {p.plan}
                        </span>
                        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'capitalize', marginTop: 2 }}>{p.billingCycle}</div>
                      </td>
                      <td><strong style={{ color: isPaid ? 'var(--success)' : 'var(--muted)' }}>{fmtINR(p.amount)}</strong></td>
                      <td>
                        {isPaid && (
                          <span style={{ fontSize: 10, background: '#e8fff5', color: 'var(--success)', border: '1px solid #b3f0d8', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>✅ Paid</span>
                        )}
                        {isFailed && (
                          <span title={p.failureReason || ''} style={{ fontSize: 10, background: '#fff0f0', color: '#e53e3e', border: '1px solid #ffcccc', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>❌ Failed</span>
                        )}
                        {!isPaid && !isFailed && (
                          <span style={{ fontSize: 10, background: '#f8faff', color: 'var(--muted)', border: '1px solid var(--border)', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>⏳ {p.status}</span>
                        )}
                      </td>
                      <td>
                        {isPaid && p.invoiceNumber && (
                          <button className="btn btn-sm btn-secondary" style={{ fontSize: 11 }} onClick={() => paymentAPI.openInvoice(p._id)}>
                            🧾 Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data.total > 50 && (
        <div className="flex gap-2 mt-3" style={{ justifyContent: 'center' }}>
          <button className="btn btn-sm btn-ghost" disabled={filter.page <= 1}
            onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
          <div style={{ padding: '0 12px', alignSelf: 'center', fontSize: 12, color: 'var(--muted)' }}>
            Page {filter.page} of {Math.ceil(data.total / 50)}
          </div>
          <button className="btn btn-sm btn-ghost" disabled={filter.page >= Math.ceil(data.total / 50)}
            onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
        </div>
      )}
    </div>
  );
}
