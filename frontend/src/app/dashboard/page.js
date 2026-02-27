'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { getQuizHistory, getMySubmissions, getAssignments } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ quizzes: 0, submissions: 0, assignments: 0 });
  const [recentQuizzes, setRecentQuizzes] = useState([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [quizData, subData, assignData] = await Promise.all([
          getQuizHistory(),
          getMySubmissions(),
          getAssignments(),
        ]);
        setStats({
          quizzes: quizData.history?.length || 0,
          submissions: subData.submissions?.length || 0,
          assignments: assignData.assignments?.length || 0,
        });
        setRecentQuizzes((quizData.history || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }
    loadStats();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5)  return 'おやすみなさい！ Good Midnight!';
    if (hour >= 5 && hour < 12) return 'おはようございます！ Good Morning!';
    if (hour >= 12 && hour < 18) return 'こんにちは！ Good Afternoon!';
    return 'こんばんは！ Good Evening!';
  };

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {getGreeting()}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back, <span className="font-medium text-indigo-600 dark:text-indigo-400">{user?.name}</span>! 
          Ready to study? | စာကျက်ဖို့ အဆင်သင့်ဖြစ်ပြီလား?
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <div className="text-3xl mb-2">🎯</div>
          <p className="text-indigo-100 text-sm">Quizzes Taken</p>
          <p className="text-3xl font-bold">{stats.quizzes}</p>
        </div>
        <div className="card bg-gradient-to-br from-sakura-500 to-sakura-600 text-white">
          <div className="text-3xl mb-2">📝</div>
          <p className="text-sakura-100 text-sm">Homework Submitted</p>
          <p className="text-3xl font-bold">{stats.submissions}</p>
        </div>
        <div className="card bg-gradient-to-br from-matcha-500 to-matcha-600 text-white">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-matcha-100 text-sm">Total Assignments</p>
          <p className="text-3xl font-bold">{stats.assignments}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions | လုပ်ဆောင်ချက်များ</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/quiz" className="card hover:border-indigo-200 group">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎯</div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Take a Quiz</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Test your Kanji & Grammar</p>
        </Link>
        <Link href="/homework" className="card hover:border-sakura-200 group">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📝</div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Check Homework</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View & submit assignments</p>
        </Link>
        <Link href="/dictionary" className="card hover:border-matcha-200 group">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📖</div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dictionary</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Japanese-Burmese lookup</p>
        </Link>
        <Link href="/quiz" className="card hover:border-yellow-200 group">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">⭐</div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Practice N5</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Start with beginner level</p>
        </Link>
      </div>

      {/* Recent Quiz History */}
      {recentQuizzes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Quiz Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentQuizzes.map((quiz) => (
              <div key={quiz.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium">
                    {quiz.level}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(quiz.completed_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{quiz.category}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {quiz.score}/{quiz.total}
                  <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">
                    ({Math.round((quiz.score / quiz.total) * 100)}%)
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Section */}
      <div className="mt-8 card bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-4">
          <span className="text-4xl">💪</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">やる気 (Yaruki) = Motivation!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              "千里の道も一歩から" — A journey of a thousand miles begins with a single step.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              မိုင်တစ်ထောင်ခရီးလည်း ခြေတစ်လှမ်းကနေ စတာပါ။ ကြိုးစားပါ！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
