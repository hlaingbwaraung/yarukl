'use client';

import { useState, useEffect } from 'react';
import { searchDictionary, getAllDictionary } from '@/lib/api';

export default function DictionaryPage() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Load all words on mount
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const data = await getAllDictionary();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleSearch(e) {
    e?.preventDefault();
    if (!query.trim()) {
      loadAll();
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const data = await searchDictionary(query.trim(), level || undefined);
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function filterByLevel(selectedLevel) {
    setLevel(selectedLevel);
    setLoading(true);
    try {
      if (query.trim()) {
        const data = await searchDictionary(query.trim(), selectedLevel || undefined);
        setResults(data.results || []);
      } else {
        const data = await getAllDictionary(selectedLevel || undefined);
        setResults(data.results || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          📖 Dictionary | အဘိဓာန်
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Search Japanese words with Burmese meanings. | ဂျပန်စကားလုံးများ ရှာဖွေပါ။
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-10"
              placeholder="Search in English, Hiragana, Kanji, or Burmese..."
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <button type="submit" className="btn-primary whitespace-nowrap">
            Search
          </button>
        </div>
      </form>

      {/* Level Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => filterByLevel('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            level === '' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All Levels
        </button>
        {['N5', 'N4', 'N3', 'N2', 'N1'].map((l) => (
          <button
            key={l}
            onClick={() => filterByLevel(l)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              level === l ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl animate-bounce mb-3">📖</div>
          <p className="text-gray-500 dark:text-gray-400">Searching...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {searched ? 'No results found' : 'Start searching'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {searched
              ? 'Try a different search term.'
              : 'Type a word in English, Japanese, or Burmese.'}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">{results.length} word(s) found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((word) => (
              <div key={word.id} className="card hover:border-indigo-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-japanese">
                      {word.japanese}
                    </h3>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-japanese mt-0.5">
                      {word.reading}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {word.level && (
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                        {word.level}
                      </span>
                    )}
                    {word.category && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                        {word.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">EN</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{word.english}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">MM</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{word.burmese}</span>
                  </div>
                </div>

                {word.example_sentence && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Example:</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-japanese">{word.example_sentence}</p>
                    {word.example_reading && (
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 font-japanese mt-0.5">{word.example_reading}</p>
                    )}
                    {word.example_burmese && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{word.example_burmese}</p>
                    )}
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
