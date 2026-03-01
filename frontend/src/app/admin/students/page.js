'use client';

import { useState, useEffect } from 'react';
import {
  getAdminStudents, updateAdminStudent, changeStudentStatus,
  resetStudentPassword, deleteStudent, getAdminStudent
} from '@/lib/api';

function StudentModal({ student, onClose, onSave }) {
  const [form, setForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    role: student?.role || 'student',
    status: student?.status || 'active',
    phone: student?.phone || '',
    notes: student?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateAdminStudent(student.id, form);
      onSave();
    } catch (err) {
      alert('Failed to update student');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit User</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select className="input-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="input-field" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm !py-2 !px-4">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordModal({ student, onClose }) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleReset() {
    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await resetStudentPassword(student.id, password);
      setDone(true);
    } catch (err) {
      alert('Failed to reset password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reset Password</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">For: {student.name} ({student.email})</p>
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-green-600 font-medium">Password reset successfully!</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="text"
                className="input-field"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            {done ? 'Close' : 'Cancel'}
          </button>
          {!done && (
            <button onClick={handleReset} disabled={saving} className="btn-primary text-sm !py-2 !px-4">
              {saving ? 'Resetting...' : 'Reset Password'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentDetailModal({ studentId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [studentId]);

  async function loadDetail() {
    try {
      const res = await getAdminStudent(studentId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Student Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : data ? (
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium">{data.user.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{data.user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  data.user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  data.user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{data.user.role}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  data.user.status === 'active' ? 'bg-green-100 text-green-700' :
                  data.user.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>{data.user.status || 'active'}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium">{data.user.phone || <span className="text-gray-400">—</span>}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Joined</p>
                <p className="text-sm">{new Date(data.user.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Login</p>
                <p className="text-sm">{data.user.last_login ? new Date(data.user.last_login).toLocaleString() : 'Never'}</p>
              </div>
            </div>

            {/* Subscription */}
            {data.subscription && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Subscription</h3>
                <div className="bg-indigo-50 rounded-xl p-4 text-sm">
                  <span className="font-medium text-indigo-700 capitalize">{data.subscription.plan}</span>
                  <span className="text-gray-500 ml-2">
                    ({data.subscription.status}) &middot; {data.subscription.amount} {data.subscription.currency}
                  </span>
                </div>
              </div>
            )}

            {/* Quiz History */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Quiz History ({data.quizHistory.length})</h3>
              {data.quizHistory.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {data.quizHistory.map(q => (
                    <div key={q.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">{q.level} - {q.category}</span>
                      <span className={q.score/q.total >= 0.7 ? 'text-green-600' : 'text-red-500'}>
                        {q.score}/{q.total}
                      </span>
                      <span className="text-gray-400 text-xs">{new Date(q.completed_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No quiz attempts yet.</p>
              )}
            </div>

            {/* Submissions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Homework Submissions ({data.submissions.length})</h3>
              {data.submissions.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {data.submissions.map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium truncate flex-1">{s.assignment_title || `Assignment #${s.assignment_id}`}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        s.status === 'graded' ? 'bg-green-100 text-green-700' :
                        s.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No submissions yet.</p>
              )}
            </div>

            {/* Payments */}
            {data.payments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Payments ({data.payments.length})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {data.payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">{Number(p.amount).toLocaleString()} {p.currency}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{p.status}</span>
                      <span className="text-gray-400 text-xs">{new Date(p.paid_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">Failed to load student details.</div>
        )}
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editStudent, setEditStudent] = useState(null);
  const [passwordStudent, setPasswordStudent] = useState(null);
  const [detailStudentId, setDetailStudentId] = useState(null);

  useEffect(() => {
    loadStudents();
  }, [pagination.page, roleFilter, statusFilter]);

  async function loadStudents() {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await getAdminStudents(params);
      setStudents(data.students || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadStudents();
  }

  async function handleStatusChange(id, status) {
    if (!confirm(`Are you sure you want to set this user to "${status}"?`)) return;
    try {
      await changeStudentStatus(id, status);
      loadStudents();
    } catch (err) {
      alert('Failed to change status');
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Are you sure you want to DELETE ${name}? This cannot be undone.`)) return;
    try {
      await deleteStudent(id);
      loadStudents();
    } catch (err) {
      alert('Failed to delete student');
    }
  }

  const statusBadge = (status) => {
    const s = status || 'active';
    const classes = {
      active: 'bg-green-100 text-green-700',
      suspended: 'bg-yellow-100 text-yellow-700',
      blocked: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${classes[s] || classes.active}`}>{s}</span>;
  };

  const roleBadge = (role) => {
    const classes = {
      admin: 'bg-purple-100 text-purple-700',
      teacher: 'bg-blue-100 text-blue-700',
      student: 'bg-gray-100 text-gray-700',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${classes[role] || classes.student}`}>{role}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{pagination.total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            className="input-field flex-1"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="input-field sm:w-40"
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPagination(p => ({...p, page: 1})); }}
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="input-field sm:w-40"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({...p, page: 1})); }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
          </select>
          <button type="submit" className="btn-primary text-sm !py-2.5">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Quizzes</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Submissions</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailStudentId(s.id)} className="text-left hover:text-indigo-600 dark:hover:text-indigo-400">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{s.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.email}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3">{roleBadge(s.role)}</td>
                    <td className="px-4 py-3">{statusBadge(s.status)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{s.current_plan || 'free'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.quiz_count}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.submission_count}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditStudent(s)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 text-xs"
                          title="Edit"
                        >✏️</button>
                        <button
                          onClick={() => setPasswordStudent(s)}
                          className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 text-xs"
                          title="Reset Password"
                        >🔑</button>
                        {s.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(s.id, 'suspended')}
                            className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 text-xs"
                            title="Suspend"
                          >⏸️</button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(s.id, 'active')}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 text-xs"
                            title="Activate"
                          >▶️</button>
                        )}
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 text-xs"
                          title="Delete"
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 dark:text-gray-300"
              >Prev</button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 dark:text-gray-300"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {editStudent && (
        <StudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSave={() => { setEditStudent(null); loadStudents(); }}
        />
      )}
      {passwordStudent && (
        <PasswordModal
          student={passwordStudent}
          onClose={() => setPasswordStudent(null)}
        />
      )}
      {detailStudentId && (
        <StudentDetailModal
          studentId={detailStudentId}
          onClose={() => setDetailStudentId(null)}
        />
      )}
    </div>
  );
}
