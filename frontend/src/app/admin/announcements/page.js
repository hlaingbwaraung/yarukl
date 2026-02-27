'use client';

import { useState, useEffect } from 'react';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/lib/api';

function AnnouncementModal({ announcement, onClose, onSave }) {
  const [form, setForm] = useState({
    title: announcement?.title || '',
    body: announcement?.body || '',
    targetAudience: announcement?.target_audience || 'all',
    isPinned: announcement?.is_pinned || false,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title || !form.body) {
      alert('Title and body are required');
      return;
    }
    setSaving(true);
    try {
      if (announcement) {
        await updateAnnouncement(announcement.id, form);
      } else {
        await createAnnouncement(form);
      }
      onSave();
    } catch (err) {
      alert('Failed to save announcement');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {announcement ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              className="input-field"
              placeholder="Announcement title..."
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea
              className="input-field"
              rows={5}
              placeholder="Announcement content..."
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                className="input-field"
                value={form.targetAudience}
                onChange={e => setForm({ ...form, targetAudience: e.target.value })}
              >
                <option value="all">Everyone</option>
                <option value="students">Students only</option>
                <option value="teachers">Teachers only</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded"
                  checked={form.isPinned}
                  onChange={e => setForm({ ...form, isPinned: e.target.checked })}
                />
                <span className="text-sm font-medium text-gray-700">Pin to top</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-sm !py-2 !px-4">
              {saving ? 'Saving...' : announcement ? 'Update' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setLoading(true);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      loadAnnouncements();
    } catch (err) {
      alert('Failed to delete');
    }
  }

  async function handleTogglePin(ann) {
    try {
      await updateAnnouncement(ann.id, { isPinned: !ann.is_pinned });
      loadAnnouncements();
    } catch (err) {
      alert('Failed to update');
    }
  }

  const audienceBadge = (audience) => {
    const classes = {
      all: 'bg-gray-100 text-gray-700',
      students: 'bg-blue-100 text-blue-700',
      teachers: 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${classes[audience] || classes.all}`}>
        {audience === 'all' ? 'Everyone' : audience}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Announcements</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{announcements.length} announcement{announcements.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditAnnouncement(null); setShowModal(true); }} className="btn-primary text-sm !py-2.5">
          📢 New Announcement
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann.id} className={`card ${ann.is_pinned ? 'ring-2 ring-indigo-200 dark:ring-indigo-700 bg-indigo-50/30 dark:bg-indigo-900/20' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.is_pinned && <span className="text-sm" title="Pinned">📌</span>}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{ann.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap mt-2">{ann.body}</p>
                  <div className="flex items-center gap-3 mt-4">
                    {audienceBadge(ann.target_audience)}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      by {ann.author_name || 'Admin'} &middot; {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePin(ann)}
                    className={`p-1.5 rounded-lg text-xs ${ann.is_pinned ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-400'}`}
                    title={ann.is_pinned ? 'Unpin' : 'Pin'}
                  >📌</button>
                  <button
                    onClick={() => { setEditAnnouncement(ann); setShowModal(true); }}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 text-xs"
                    title="Edit"
                  >✏️</button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 text-xs"
                    title="Delete"
                  >🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📢</p>
          <p className="text-gray-500 dark:text-gray-400">No announcements yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first announcement to communicate with users.</p>
        </div>
      )}

      {showModal && (
        <AnnouncementModal
          announcement={editAnnouncement}
          onClose={() => { setShowModal(false); setEditAnnouncement(null); }}
          onSave={() => { setShowModal(false); setEditAnnouncement(null); loadAnnouncements(); }}
        />
      )}
    </div>
  );
}
