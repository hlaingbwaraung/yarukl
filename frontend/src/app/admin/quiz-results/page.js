'use client';

import { useState, useEffect } from 'react';
import { getAdminQuizResults } from '@/lib/api';

export default function AdminQuizResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', level: '', category: '' });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadResults();
  }, [currentPage, filters]);

  async function loadResults() {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
      };
      if (filters.search) params.search = filters.search;
      if (filters.level) params.level = filters.level;
      if (filters.category) params.category = filters.category;

      const data = await getAdminQuizResults(params);
      setResults(data.results || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load quiz results:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }

  function getScoreColor(percentage) {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  function getScoreBg(percentage) {
    if (percentage >= 80) return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    if (percentage >= 50) return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🎯 Quiz Results</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          View all student quiz results &middot; {pagination.total} total results
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Student</label>
            <input
              type="text"
              placeholder="Name or email..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Levels</option>
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="kanji">Kanji</option>
              <option value="grammar">Grammar</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : results.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 dark:text-gray-400">No quiz results found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Student</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Level</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Score</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">%</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const pct = parseInt(r.percentage) || 0;
                  return (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{r.student_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{r.student_email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                          {r.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 capitalize">
                        {r.category === 'kanji' ? '漢字 Kanji' : r.category === 'grammar' ? '文法 Grammar' : '🔀 Mixed'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${getScoreColor(pct)}`}>
                          {r.score}/{r.total}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreBg(pct)} ${getScoreColor(pct)}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 dark:text-gray-500 text-xs">
                        {new Date(r.completed_at).toLocaleDateString()}{' '}
                        {new Date(r.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} results)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
