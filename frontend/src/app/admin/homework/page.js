'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllSubmissions, getAssignments, sendHomeworkFeedback } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken() {
  if (typeof window !== 'undefined') return localStorage.getItem('yaruki_token');
  return null;
}

export default function AdminHomeworkPage() {
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('all');

  // Review modal state (combines image viewing + feedback)
  const [reviewSub, setReviewSub] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [zoomedImg, setZoomedImg] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackGrade, setFeedbackGrade] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('reviewed');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) closeReview();
    }
    if (reviewSub) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [reviewSub]);

  // Keyboard navigation for images
  useEffect(() => {
    if (!reviewSub) return;
    function handleKey(e) {
      const count = getFileCount(reviewSub);
      if (e.key === 'ArrowLeft') setActiveImg(i => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight') setActiveImg(i => Math.min(count - 1, i + 1));
      else if (e.key === 'Escape') {
        if (zoomedImg !== null) setZoomedImg(null);
        else closeReview();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [reviewSub, zoomedImg]);

  async function loadData() {
    try {
      const [subData, assignData] = await Promise.all([getAllSubmissions(), getAssignments()]);
      setSubmissions(subData.submissions || []);
      setAssignments(assignData.assignments || []);
    } catch (err) { console.error('Failed to load homework data:', err); }
    finally { setLoading(false); }
  }

  function getFileCount(sub) {
    try { return JSON.parse(sub.file_name).length; } catch { return 1; }
  }

  function getImageUrl(submissionId, fileIndex) {
    return `${API_URL}/homework/image/${submissionId}/${fileIndex}?token=${getToken()}`;
  }

  function openReview(sub) {
    setReviewSub(sub);
    setActiveImg(0);
    setZoomedImg(null);
    setFeedbackText(sub.feedback || '');
    setFeedbackGrade(sub.grade || '');
    setFeedbackStatus(sub.status === 'graded' ? 'graded' : 'reviewed');
    setFeedbackMsg(null);
  }

  function closeReview() {
    setReviewSub(null);
    setActiveImg(0);
    setZoomedImg(null);
    setFeedbackText('');
    setFeedbackGrade('');
    setFeedbackMsg(null);
  }

  async function handleSendFeedback() {
    if (!feedbackText.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please write feedback before sending.' });
      return;
    }
    setSendingFeedback(true);
    setFeedbackMsg(null);
    try {
      const result = await sendHomeworkFeedback(reviewSub.id, {
        feedback: feedbackText,
        grade: feedbackGrade || null,
        status: feedbackStatus,
      });
      if (result.error) {
        setFeedbackMsg({ type: 'error', text: result.error });
      } else {
        setFeedbackMsg({ type: 'success', text: 'Feedback sent & student notified!' });
        setSubmissions(prev => prev.map(s =>
          s.id === reviewSub.id
            ? { ...s, feedback: feedbackText, grade: feedbackGrade || null, status: feedbackStatus }
            : s
        ));
        setTimeout(() => closeReview(), 1200);
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to send feedback.' });
    } finally { setSendingFeedback(false); }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatFileSize(bytes) {
    if (!bytes) return '\u2014';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getStatusBadge(status) {
    const styles = {
      submitted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      reviewed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      graded: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.submitted}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  }

  const filtered = submissions.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (selectedAssignment !== 'all' && String(s.assignment_id) !== selectedAssignment) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (s.student_name && s.student_name.toLowerCase().includes(q)) ||
        (s.student_email && s.student_email.toLowerCase().includes(q)) ||
        (s.assignment_title && s.assignment_title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const counts = {
    all: submissions.length,
    submitted: submissions.filter((s) => s.status === 'submitted').length,
    reviewed: submissions.filter((s) => s.status === 'reviewed').length,
    graded: submissions.filter((s) => s.status === 'graded').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{'\ud83d\udcdd'} Homework Submissions</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Review student homework directly. {submissions.length} total submissions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.all, icon: '\ud83d\udccb' },
          { label: 'Submitted', value: counts.submitted, icon: '\ud83d\udce4' },
          { label: 'Reviewed', value: counts.reviewed, icon: '\ud83d\udc40' },
          { label: 'Graded', value: counts.graded, icon: '\u2705' },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{'\ud83d\udd0d'}</span>
              <input
                type="text"
                placeholder="Search by student name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
          <select
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          >
            <option value="all">All Assignments</option>
            {assignments.map((a) => (
              <option key={a.id} value={String(a.id)}>{a.title}</option>
            ))}
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          >
            <option value="all">All Status ({counts.all})</option>
            <option value="submitted">Submitted ({counts.submitted})</option>
            <option value="reviewed">Reviewed ({counts.reviewed})</option>
            <option value="graded">Graded ({counts.graded})</option>
          </select>
        </div>
      </div>

      {/* Submissions */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl mb-4 block">{'\ud83d\udced'}</span>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No submissions found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery || filter !== 'all' || selectedAssignment !== 'all'
              ? 'Try adjusting your filters.'
              : 'No homework has been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assignment</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Images</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((sub) => {
                  const imgCount = getFileCount(sub);
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{sub.student_name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{sub.student_email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{sub.assignment_title}</p>
                      </td>
                      <td className="px-5 py-4">
                        {/* Small thumbnail previews */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-2">
                            {Array.from({ length: Math.min(imgCount, 3) }).map((_, i) => (
                              <img
                                key={i}
                                src={getImageUrl(sub.id, i)}
                                alt=""
                                className="w-8 h-8 rounded-md object-cover border-2 border-white dark:border-gray-900 shadow-sm"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            {imgCount} img{imgCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                        {formatDate(sub.submitted_at)}
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(sub.status)}
                        {sub.grade && (
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{sub.grade}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => openReview(sub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          {'\ud83d\udc41\ufe0f'} Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((sub) => {
              const imgCount = getFileCount(sub);
              return (
                <div key={sub.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{sub.student_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{sub.student_email}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(sub.status)}
                      {sub.grade && <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{sub.grade}</p>}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="text-gray-400 dark:text-gray-500">Assignment:</span>{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">{sub.assignment_title}</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Submitted: {formatDate(sub.submitted_at)}
                    </p>
                  </div>
                  {/* Thumbnail row */}
                  <div className="flex gap-1.5 overflow-x-auto">
                    {Array.from({ length: Math.min(imgCount, 4) }).map((_, i) => (
                      <img
                        key={i}
                        src={getImageUrl(sub.id, i)}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ))}
                    {imgCount > 4 && (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                        +{imgCount - 4}
                      </div>
                    )}
                  </div>
                  {sub.feedback && (
                    <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{'\ud83d\udcac'} {sub.feedback}</p>
                    </div>
                  )}
                  <button
                    onClick={() => openReview(sub)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    {'\ud83d\udc41\ufe0f'} Review & Feedback
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Showing {filtered.length} of {submissions.length} submissions
        </p>
      )}

      {/* ===== REVIEW MODAL ===== */}
      {reviewSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div ref={modalRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  {'\ud83d\udcdd'} {reviewSub.student_name} {'\u2014'} {reviewSub.assignment_title}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {reviewSub.student_email} &middot; Submitted {formatDate(reviewSub.submitted_at)} &middot; {getFileCount(reviewSub)} image{getFileCount(reviewSub) !== 1 ? 's' : ''} ({formatFileSize(reviewSub.file_size)})
                </p>
              </div>
              <button onClick={closeReview} className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none flex-shrink-0">&times;</button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col lg:flex-row">
                {/* Left: Image Viewer */}
                <div className="flex-1 p-4 lg:p-5">
                  {/* Main Image */}
                  <div
                    className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center cursor-zoom-in"
                    style={{ minHeight: '300px', maxHeight: '500px' }}
                    onClick={() => setZoomedImg(activeImg)}
                  >
                    <img
                      src={getImageUrl(reviewSub.id, activeImg)}
                      alt={`Homework image ${activeImg + 1}`}
                      className="max-w-full max-h-[500px] object-contain"
                      onError={(e) => { e.target.alt = 'Failed to load image'; }}
                    />
                    {/* Nav arrows */}
                    {getFileCount(reviewSub) > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveImg(i => Math.max(0, i - 1)); }}
                          disabled={activeImg === 0}
                          className={`absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
                            activeImg === 0
                              ? 'bg-black/10 text-white/30 cursor-not-allowed'
                              : 'bg-black/40 text-white hover:bg-black/60 shadow-lg'
                          }`}
                        >{'\u2039'}</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveImg(i => Math.min(getFileCount(reviewSub) - 1, i + 1)); }}
                          disabled={activeImg === getFileCount(reviewSub) - 1}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
                            activeImg === getFileCount(reviewSub) - 1
                              ? 'bg-black/10 text-white/30 cursor-not-allowed'
                              : 'bg-black/40 text-white hover:bg-black/60 shadow-lg'
                          }`}
                        >{'\u203a'}</button>
                      </>
                    )}
                    {/* Counter badge */}
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      {activeImg + 1} / {getFileCount(reviewSub)}
                    </div>
                  </div>

                  {/* Thumbnail Strip */}
                  {getFileCount(reviewSub) > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {Array.from({ length: getFileCount(reviewSub) }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImg(i)}
                          className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                            i === activeImg
                              ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                          }`}
                        >
                          <img
                            src={getImageUrl(reviewSub.id, i)}
                            alt={`Thumbnail ${i + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Feedback Panel */}
                <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800 p-4 lg:p-5 space-y-4 flex-shrink-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{'\ud83d\udcac'} Feedback</h3>

                  {/* Current status */}
                  <div className="flex items-center gap-2">
                    {getStatusBadge(reviewSub.status)}
                    {reviewSub.grade && (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Grade: {reviewSub.grade}</span>
                    )}
                  </div>

                  {/* Status & Grade */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                      <select
                        value={feedbackStatus}
                        onChange={(e) => setFeedbackStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="reviewed">{'\ud83d\udc40'} Reviewed</option>
                        <option value="graded">{'\u2705'} Graded</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Grade</label>
                      <input
                        type="text"
                        value={feedbackGrade}
                        onChange={(e) => setFeedbackGrade(e.target.value)}
                        placeholder="A+, 95/100"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Message</label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={5}
                      placeholder="Write your feedback here..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {feedbackMsg && (
                    <div className={`p-2.5 rounded-lg text-xs font-medium text-center ${
                      feedbackMsg.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                    }`}>
                      {feedbackMsg.text}
                    </div>
                  )}

                  <button
                    onClick={handleSendFeedback}
                    disabled={sendingFeedback || !feedbackText.trim()}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      sendingFeedback || !feedbackText.trim()
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {sendingFeedback ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : '\ud83d\udce8 Send Feedback & Notify'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FULLSCREEN ZOOM MODAL ===== */}
      {zoomedImg !== null && reviewSub && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center cursor-zoom-out"
          onClick={() => setZoomedImg(null)}
        >
          <button
            onClick={() => setZoomedImg(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center transition-colors z-10"
          >{'\u00d7'}</button>
          {/* Nav arrows in zoom */}
          {getFileCount(reviewSub) > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setZoomedImg(i => Math.max(0, i - 1)); setActiveImg(i => Math.max(0, i - 1)); }}
                disabled={zoomedImg === 0}
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-2xl z-10 transition-all ${
                  zoomedImg === 0 ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >{'\u2039'}</button>
              <button
                onClick={(e) => { e.stopPropagation(); setZoomedImg(i => Math.min(getFileCount(reviewSub) - 1, i + 1)); setActiveImg(i => Math.min(getFileCount(reviewSub) - 1, i + 1)); }}
                disabled={zoomedImg === getFileCount(reviewSub) - 1}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-2xl z-10 transition-all ${
                  zoomedImg === getFileCount(reviewSub) - 1 ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >{'\u203a'}</button>
            </>
          )}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
            {zoomedImg + 1} / {getFileCount(reviewSub)}
          </div>
          <img
            src={getImageUrl(reviewSub.id, zoomedImg)}
            alt={`Full size image ${zoomedImg + 1}`}
            className="max-w-[95vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
