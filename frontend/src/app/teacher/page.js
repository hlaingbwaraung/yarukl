'use client';

import { useState, useEffect } from 'react';
import { getAllSubmissions, createAssignment, getDownloadUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function TeacherPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', due_date: '', level: 'N5'
  });
  const [formMessage, setFormMessage] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'teacher' && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadSubmissions();
  }, [user]);

  async function loadSubmissions() {
    try {
      const data = await getAllSubmissions();
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleCreateAssignment(e) {
    e.preventDefault();
    setFormMessage(null);

    try {
      const data = await createAssignment(formData);
      if (data.error) {
        setFormMessage({ type: 'error', text: data.error });
      } else {
        setFormMessage({ type: 'success', text: 'Assignment created!' });
        setFormData({ title: '', description: '', due_date: '', level: 'N5' });
        setShowForm(false);
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: 'Failed to create assignment.' });
    }
  }

  async function handleDownload(submissionId) {
    const token = localStorage.getItem('yaruki_token');
    const url = getDownloadUrl(submissionId);
    
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `submission-${submissionId}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Failed to download file.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-3">👨‍🏫</div>
          <p className="text-gray-500 dark:text-gray-400">Loading teacher panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            👨‍🏫 Teacher Panel
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage assignments and view student submissions.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary whitespace-nowrap"
        >
          {showForm ? '✕ Cancel' : '+ New Assignment'}
        </button>
      </div>

      {formMessage && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
          formMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          {formMessage.text}
        </div>
      )}

      {/* Create Assignment Form */}
      {showForm && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4 dark:text-gray-100">Create New Assignment</h2>
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="Assignment title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field h-24 resize-none"
                placeholder="Describe the assignment..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="input-field"
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary">
              ✓ Create Assignment
            </button>
          </form>
        </div>
      )}

      {/* Submissions Table */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        📋 Student Submissions ({submissions.length})
      </h2>

      {submissions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No submissions yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Student submissions will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Student</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Assignment</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">File</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Submitted</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{sub.student_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{sub.student_email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{sub.assignment_title}</td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600 dark:text-gray-300 text-xs">{sub.file_name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sub.status === 'graded' ? 'bg-green-100 text-green-700' :
                      sub.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 dark:text-gray-500 text-xs">
                    {new Date(sub.submitted_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDownload(sub.id)}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium
                                 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      ⬇ Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
