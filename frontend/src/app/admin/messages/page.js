'use client';

import { useState, useEffect } from 'react';
import {
  getAdminMessages, sendAdminMessage, markMessageRead,
  deleteMessage, getAdminStudents, getMessageDetail, replyToMessage
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function ComposeModal({ onClose, onSent }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ receiverId: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await getAdminStudents({ limit: 100 });
      setUsers(data.students || []);
    } catch (err) {
      console.error(err);
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  async function handleSend(e) {
    e.preventDefault();
    if (!form.receiverId || !form.subject || !form.body) {
      alert('Please fill in all fields');
      return;
    }
    setSending(true);
    try {
      await sendAdminMessage(form);
      onSent();
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Message</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
            <input
              className="input-field mb-2"
              placeholder="Search user..."
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
            />
            <select
              className="input-field"
              value={form.receiverId}
              onChange={e => setForm({ ...form, receiverId: e.target.value })}
              required
            >
              <option value="">Select recipient...</option>
              {filteredUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email}) - {u.role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              className="input-field"
              placeholder="Message subject..."
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              className="input-field"
              rows={5}
              placeholder="Type your message..."
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={sending} className="btn-primary text-sm !py-2 !px-4">
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageDetailModal({ message, onClose, onRead }) {
  const { user } = useAuth();
  const [thread, setThread] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (message) {
      loadThread();
      if (!message.is_read) {
        markMessageRead(message.id).then(() => onRead?.());
      }
    }
  }, [message]);

  async function loadThread() {
    setLoading(true);
    try {
      const data = await getMessageDetail(message.id);
      setThread(data.thread || []);
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await replyToMessage(message.id, replyText);
      setReplyText('');
      await loadThread();
      onRead?.();
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  }

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0 mr-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{message.subject}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Conversation with {message.sender_id === user?.id ? message.receiver_name : message.sender_name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : thread.length > 0 ? thread.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.sender_id === user?.id
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${msg.sender_id === user?.id ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    {msg.sender_name} {msg.sender_role === 'admin' ? '(Admin)' : msg.sender_role === 'teacher' ? '(Teacher)' : ''}
                  </span>
                  <span className={`text-xs ${msg.sender_id === user?.id ? 'text-indigo-300' : 'text-gray-400 dark:text-gray-500'}`}>
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>
              </div>
            </div>
          )) : (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{message.sender_name}</span>
                  <span className="text-xs text-gray-400">{new Date(message.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.body}</p>
              </div>
            </div>
          )}
        </div>

        {/* Reply Box */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <form onSubmit={handleReply} className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1 !py-2.5"
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="btn-primary text-sm !py-2.5 !px-5 disabled:opacity-50"
            >
              {sending ? 'Sending...' : '↗ Reply'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMessages();
  }, [tab]);

  async function loadMessages() {
    setLoading(true);
    try {
      const params = { type: tab };
      if (search) params.search = search;
      const data = await getAdminMessages(params);
      setMessages(data.messages || []);
      setUnread(data.unread || 0);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteMessage(id);
      loadMessages();
    } catch (err) {
      alert('Failed to delete');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{unread} unread message{unread !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="btn-primary text-sm !py-2.5">
          ✉️ New Message
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setTab('inbox')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'inbox' ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Inbox {unread > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unread}</span>}
            </button>
            <button
              onClick={() => setTab('sent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'sent' ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Sent
            </button>
          </div>
          <div className="flex-1 flex gap-2 w-full sm:w-auto">
            <input
              className="input-field flex-1 !py-2"
              placeholder="Search messages..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadMessages()}
            />
            <button onClick={loadMessages} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg dark:text-gray-300">Search</button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="card !p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                  !msg.is_read && tab === 'inbox' ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm flex-shrink-0">
                  {tab === 'inbox'
                    ? msg.sender_name?.[0]?.toUpperCase() || '?'
                    : msg.receiver_name?.[0]?.toUpperCase() || '?'
                  }
                </div>
                <div className="flex-1 min-w-0" onClick={() => setSelectedMessage(msg)}>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!msg.is_read && tab === 'inbox' ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {tab === 'inbox' ? msg.sender_name : msg.receiver_name}
                    </p>
                    {!msg.is_read && tab === 'inbox' && (
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${!msg.is_read && tab === 'inbox' ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                    {msg.subject}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{msg.body?.substring(0, 100)}...</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                    className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                    title="Delete"
                  >🗑️</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>No messages in {tab}.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSent={() => { setShowCompose(false); loadMessages(); }}
        />
      )}
      {selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onRead={loadMessages}
        />
      )}
    </div>
  );
}
