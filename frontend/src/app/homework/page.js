'use client';

import { useState, useEffect, useRef } from 'react';
import { getAssignments, submitHomework, getMySubmissions } from '@/lib/api';

const MAX_IMAGES = 20;

export default function HomeworkPage() {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  // Generate previews when files change
  useEffect(() => {
    if (selectedFiles.length === 0) { setPreviews([]); return; }
    const urls = selectedFiles.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [selectedFiles]);

  async function loadData() {
    try {
      const [assignData, subData] = await Promise.all([
        getAssignments(),
        getMySubmissions(),
      ]);
      setAssignments(assignData.assignments || []);
      setSubmissions(subData.submissions || []);
    } catch (err) {
      console.error('Failed to load homework data:', err);
    } finally {
      setLoading(false);
    }
  }

  function addFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const newFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));

    if (newFiles.length === 0) {
      setMessage({ type: 'error', text: 'Only image files are allowed (JPEG, PNG, GIF, WebP).' });
      return;
    }

    const oversized = newFiles.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setMessage({ type: 'error', text: `"${oversized.name}" is over 10MB limit.` });
      return;
    }

    const combined = [...selectedFiles, ...newFiles];
    if (combined.length > MAX_IMAGES) {
      setMessage({ type: 'error', text: `Maximum ${MAX_IMAGES} images allowed. You selected ${combined.length}.` });
      return;
    }

    setSelectedFiles(combined);
    setMessage(null);
  }

  function removeFile(index) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }

  function clearAll() {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function getFileCount(sub) {
    try {
      return JSON.parse(sub.file_name).length;
    } catch {
      return 1;
    }
  }

  function getFileNames(sub) {
    try {
      return JSON.parse(sub.file_name);
    } catch {
      return [sub.file_name];
    }
  }

  async function handleUpload() {
    if (selectedFiles.length === 0 || !selectedAssignment) {
      setMessage({ type: 'error', text: 'Please select an assignment and at least one image.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const result = await submitHomework(selectedAssignment, selectedFiles);

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: `✅ ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''} submitted! အိမ်စာ တင်ပြီးပါပြီ!` });
        clearAll();
        setSelectedAssignment('');
        const subData = await getMySubmissions();
        setSubmissions(subData.submissions || []);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: 'Failed to upload. Please try again.' });
    } finally {
      setUploading(false);
    }
  }

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          📝 Homework
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Upload homework images (up to {MAX_IMAGES})</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium text-center ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Upload Card */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5 text-center">
          📷 Upload or Take Photos
        </h2>

        {/* Assignment Selector */}
        {assignments.length === 0 ? (
          <div className="text-center py-4 mb-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">No assignments available yet.</p>
            <p className="text-xs text-yellow-500 dark:text-yellow-500 mt-1">Your teacher hasn&apos;t created any assignments.</p>
          </div>
        ) : (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Assignment
            </label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            >
              <option value="">-- Choose an assignment --</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} {a.due_date ? `(Due: ${new Date(a.due_date).toLocaleDateString()})` : ''} {a.level ? `[${a.level}]` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          className={`relative rounded-2xl border-2 border-dashed transition-all text-center p-8 ${
            dragging
              ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
              : selectedFiles.length > 0
              ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/10'
              : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            capture="environment"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
          />

          <div className="pointer-events-none">
            <div className="text-4xl mb-2">{selectedFiles.length > 0 ? '🖼️' : '☁️'}</div>
            {selectedFiles.length > 0 ? (
              <>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {selectedFiles.length} / {MAX_IMAGES} images selected
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Total: {formatFileSize(totalSize)}</p>
                <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">Click or drop to add more</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drop images here, click to browse,</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">or take a photo</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">JPEG · PNG · GIF · WebP &nbsp;·&nbsp; max 10 MB each &nbsp;·&nbsp; up to {MAX_IMAGES} images</p>
              </>
            )}
          </div>
        </div>

        {/* Image Previews Grid */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Preview</p>
              <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 font-medium">
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {selectedFiles.map((file, i) => (
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {previews[i] && (
                    <img src={previews[i]} alt={file.name} className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 truncate">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || !selectedAssignment || uploading}
          className={`mt-5 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
            selectedFiles.length > 0 && selectedAssignment && !uploading
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Uploading {selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''}...
            </span>
          ) : `Submit ${selectedFiles.length > 0 ? selectedFiles.length + ' ' : ''}Image${selectedFiles.length !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Past Submissions */}
      {submissions.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📋 My Submissions
          </h2>
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{sub.assignment_title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      🖼️ {getFileCount(sub)} image{getFileCount(sub) !== 1 ? 's' : ''} &middot; {formatFileSize(sub.file_size)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(sub.submitted_at)}</p>
                  </div>
                  <div className="ml-3 text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sub.status === 'graded' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      sub.status === 'reviewed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {sub.status}
                    </span>
                    {sub.grade && (
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">{sub.grade}</p>
                    )}
                  </div>
                </div>
                {sub.feedback && (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">💬 Teacher Feedback</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300 whitespace-pre-line">{sub.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

