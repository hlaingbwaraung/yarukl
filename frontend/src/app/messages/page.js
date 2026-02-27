'use client';

import { useState, useEffect } from 'react';
import {
  getUserMessages, getUserSentMessages, getMessageDetail,
  replyToMessage, markUserMessageRead, markAllMessagesRead,
  deleteUserMessage
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function MessageDetailModal({ messageId, onClose, onUpdate }) {
  const { user } = useAuth();
  const [message, setMessage] = useState(null);
  const [thread, setThread] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [messageId]);

  async function loadDetail() {
    setLoading(true);
    try {
      const data = await getMessageDetail(messageId);
      setMessage(data.message);
      setThread(data.thread || []);
    } catch (err) {
      console.error('Failed to load message:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await replyToMessage(messageId, replyText);
      setReplyText('');
      await loadDetail();
      onUpdate?.();
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
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
              From: {message.sender_name}
              {message.sender_role === 'admin' && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs font-medium">Admin</span>
              )}
              {message.sender_role === 'teacher' && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">Teacher</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
        </div>

        {/* Thread / Conversation */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {thread.length > 0 ? thread.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.sender_id === user?.id
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${msg.sender_id === user?.id ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    {msg.sender_name}
                    {msg.sender_role === 'admin' && ' (Admin)'}
                    {msg.sender_role === 'teacher' && ' (Teacher)'}
                  </span>
                  <span className={`text-xs ${msg.sender_id === user?.id ? 'text-indigo-300' : 'text-gray-400 dark:text-gray-500'}`}>
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>
              </div>
            </div>
          )) : (
            <div className={`flex justify-start`}>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {message.sender_name}
                    {message.sender_role === 'admin' && ' (Admin)'}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
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
              {sending ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Reply
                </>
              )}
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
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inbox');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMessages();
  }, [tab]);

  async function loadMessages() {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const data = tab === 'inbox'
        ? await getUserMessages(params)
        : await getUserSentMessages(params);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllMessagesRead();
      loadMessages();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteUserMessage(id);
      loadMessages();
    } catch (err) {
      alert('Failed to delete');
    }
  }

  const unreadCount = messages.filter(m => !m.is_read).length;

  function getRoleBadge(role) {
    if (role === 'admin') return <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-xs font-medium">Admin</span>;
    if (role === 'teacher') return <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">Teacher</span>;
    return null;
  }

  function timeAgo(dateStr) {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">💬 Messages</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {tab === 'inbox'
              ? unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'
              : 'Your sent messages'
            }
          </p>
        </div>
        {tab === 'inbox' && unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
            ✓ Mark all read
          </button>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setTab('inbox')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'inbox' ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              📥 Inbox
              {tab !== 'inbox' && unreadCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
              )}
            </button>
            <button
              onClick={() => setTab('sent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'sent' ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              📤 Sent
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
            <button onClick={loadMessages} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="card !p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessageId(msg.id)}
                className={`flex items-start gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                  !msg.is_read && tab === 'inbox' ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                  !msg.is_read && tab === 'inbox'
                    ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {tab === 'inbox'
                    ? msg.sender_name?.[0]?.toUpperCase() || '?'
                    : msg.receiver_name?.[0]?.toUpperCase() || '?'
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!msg.is_read && tab === 'inbox' ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {tab === 'inbox' ? msg.sender_name : `To: ${msg.receiver_name}`}
                    </p>
                    {tab === 'inbox' && getRoleBadge(msg.sender_role)}
                    {!msg.is_read && tab === 'inbox' && (
                      <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full flex-shrink-0"></span>
                    )}
                  </div>
                  <p className={`text-sm truncate mt-0.5 ${!msg.is_read && tab === 'inbox' ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                    {msg.subject}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{msg.body?.substring(0, 120)}</p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{timeAgo(msg.created_at)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <p className="text-5xl mb-3">{tab === 'inbox' ? '📭' : '📤'}</p>
            <p className="text-lg font-medium">{tab === 'inbox' ? 'No messages yet' : 'No sent messages'}</p>
            <p className="text-sm mt-1">
              {tab === 'inbox' ? 'Messages from your teachers and admin will appear here.' : 'Your replies will appear here.'}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedMessageId && (
        <MessageDetailModal
          messageId={selectedMessageId}
          onClose={() => setSelectedMessageId(null)}
          onUpdate={loadMessages}
        />
      )}
    </div>
  );
}
