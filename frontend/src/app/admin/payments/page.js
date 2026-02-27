'use client';

import { useState, useEffect } from 'react';
import {
  getAdminPayments, recordPayment, updatePayment,
  getAdminSubscriptions, createSubscription, updateSubscription,
  getAdminStudents
} from '@/lib/api';

function RecordPaymentModal({ onClose, onSaved }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    userId: '', amount: '', currency: 'MMK', paymentMethod: 'manual',
    status: 'completed', reference: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await getAdminStudents({ limit: 200 });
      setUsers(data.students || []);
    } catch (err) { console.error(err); }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.userId || !form.amount) {
      alert('User and amount are required');
      return;
    }
    setSaving(true);
    try {
      await recordPayment({ ...form, amount: parseFloat(form.amount) });
      onSaved();
    } catch (err) {
      alert('Failed to record payment');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Record Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select className="input-field" value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} required>
              <option value="">Select student...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number" step="0.01" className="input-field" placeholder="0.00"
                value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select className="input-field" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                <option value="MMK">MMK</option>
                <option value="USD">USD</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select className="input-field" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                <option value="manual">Manual / Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_pay">Mobile Pay (KBZPay/Wave)</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Receipt #</label>
            <input className="input-field" placeholder="Optional reference..." value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="input-field" rows={2} placeholder="Optional notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm !py-2 !px-4">
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubscriptionModal({ onClose, onSaved }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    userId: '', plan: 'basic', amount: '', currency: 'MMK',
    startDate: new Date().toISOString().split('T')[0], endDate: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await getAdminStudents({ limit: 200 });
      setUsers(data.students || []);
    } catch (err) { console.error(err); }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.userId || !form.plan) {
      alert('User and plan are required');
      return;
    }
    setSaving(true);
    try {
      await createSubscription({ ...form, amount: parseFloat(form.amount) || 0 });
      onSaved();
    } catch (err) {
      alert('Failed to create subscription');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Subscription</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select className="input-field" value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} required>
              <option value="">Select student...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select className="input-field" value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input type="number" step="0.01" className="input-field" placeholder="0.00" value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" className="input-field" value={form.startDate}
                onChange={e => setForm({...form, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="input-field" value={form.endDate}
                onChange={e => setForm({...form, endDate: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm !py-2 !px-4">
              {saving ? 'Creating...' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tab, setTab] = useState('payments');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  useEffect(() => {
    if (tab === 'payments') loadPayments();
    else loadSubscriptions();
  }, [tab]);

  async function loadPayments() {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await getAdminPayments(params);
      setPayments(data.payments || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscriptions() {
    setLoading(true);
    try {
      const data = await getAdminSubscriptions();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePaymentStatus(id, status) {
    try {
      await updatePayment(id, { status });
      loadPayments();
    } catch (err) {
      alert('Failed to update');
    }
  }

  async function handleUpdateSubStatus(id, status) {
    try {
      await updateSubscription(id, { status });
      loadSubscriptions();
    } catch (err) {
      alert('Failed to update');
    }
  }

  const statusBadge = (status) => {
    const classes = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      expired: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payments & Subscriptions</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowSubModal(true)} className="btn-secondary text-sm !py-2.5 !px-4">
            ⭐ New Subscription
          </button>
          <button onClick={() => setShowPaymentModal(true)} className="btn-primary text-sm !py-2.5">
            💰 Record Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {tab === 'payments' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{Number(summary.total_revenue || 0).toLocaleString()} MMK</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Payments</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{summary.pending_count || 0}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{Number(summary.pending_amount || 0).toLocaleString()} MMK</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{payments.length}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('payments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'payments' ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-600 dark:text-gray-300'
          }`}
        >Payments</button>
        <button
          onClick={() => setTab('subscriptions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'subscriptions' ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-600 dark:text-gray-300'
          }`}
        >Subscriptions</button>
      </div>

      {/* Filters for payments */}
      {tab === 'payments' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input-field flex-1"
            placeholder="Search by name, email, or reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadPayments()}
          />
          <select className="input-field sm:w-40" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button onClick={loadPayments} className="btn-primary text-sm !py-2.5">Filter</button>
        </div>
      )}

      {/* Content */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : tab === 'payments' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Reference</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.user_name}</p>
                      <p className="text-xs text-gray-500">{p.user_email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{Number(p.amount).toLocaleString()} {p.currency}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{p.payment_method?.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.reference || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.paid_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'pending' && (
                        <button
                          onClick={() => handleUpdatePaymentStatus(p.id, 'completed')}
                          className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded"
                        >✅ Confirm</button>
                      )}
                      {p.status === 'completed' && (
                        <button
                          onClick={() => handleUpdatePaymentStatus(p.id, 'refunded')}
                          className="text-xs text-gray-500 hover:bg-gray-50 px-2 py-1 rounded"
                        >↩️ Refund</button>
                      )}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No payments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Start</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">End</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.user_name}</p>
                      <p className="text-xs text-gray-500">{s.user_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        s.plan === 'premium' ? 'bg-indigo-100 text-indigo-700' :
                        s.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                        s.plan === 'basic' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{s.plan}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{Number(s.amount).toLocaleString()} {s.currency}</td>
                    <td className="px-4 py-3">{statusBadge(s.status)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.start_date ? new Date(s.start_date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.end_date ? new Date(s.end_date).toLocaleDateString() : 'Ongoing'}</td>
                    <td className="px-4 py-3 text-right">
                      {s.status === 'active' && (
                        <button
                          onClick={() => handleUpdateSubStatus(s.id, 'cancelled')}
                          className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                        >Cancel</button>
                      )}
                      {s.status !== 'active' && (
                        <button
                          onClick={() => handleUpdateSubStatus(s.id, 'active')}
                          className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded"
                        >Reactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No subscriptions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <RecordPaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSaved={() => { setShowPaymentModal(false); loadPayments(); }}
        />
      )}
      {showSubModal && (
        <SubscriptionModal
          onClose={() => setShowSubModal(false)}
          onSaved={() => { setShowSubModal(false); loadSubscriptions(); }}
        />
      )}
    </div>
  );
}
