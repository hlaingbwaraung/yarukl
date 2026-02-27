'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAdminAnalytics } from '@/lib/api';

function StatCard({ title, value, subtitle, icon, color }) {
  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    sakura: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    matcha: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-gray-100">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorClasses[color] || colorClasses.indigo}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const data = await getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Failed to load analytics data.</p>
        <button onClick={loadAnalytics} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  const { users, quiz, homework, payments, subscriptions, recentActivity, signupTrends } = analytics;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.name}. Here&apos;s your platform overview.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={users?.total_students || 0}
          subtitle={`+${users?.new_users_7d || 0} this week`}
          icon="👥"
          color="indigo"
        />
        <StatCard
          title="Active Users"
          value={users?.active_users || 0}
          subtitle={`${users?.suspended_users || 0} suspended`}
          icon="✅"
          color="matcha"
        />
        <StatCard
          title="Quiz Attempts"
          value={quiz?.total_attempts || 0}
          subtitle={`Avg score: ${quiz?.avg_score_pct || 0}%`}
          icon="🎯"
          color="purple"
        />
        <StatCard
          title="Total Revenue"
          value={`${Number(payments?.total_revenue || 0).toLocaleString()} MMK`}
          subtitle={`${payments?.pending_payments || 0} pending`}
          icon="💰"
          color="amber"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Teachers"
          value={users?.total_teachers || 0}
          icon="👨‍🏫"
          color="blue"
        />
        <StatCard
          title="Assignments"
          value={homework?.total_assignments || 0}
          subtitle={`${homework?.pending_reviews || 0} pending review`}
          icon="📝"
          color="sakura"
        />
        <StatCard
          title="Submissions"
          value={homework?.total_submissions || 0}
          subtitle={`+${homework?.submissions_7d || 0} this week`}
          icon="📤"
          color="matcha"
        />
        <StatCard
          title="Active Subscriptions"
          value={subscriptions?.active_subs || 0}
          subtitle={`${subscriptions?.premium_plan || 0} premium`}
          icon="⭐"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Subscription Plans</h2>
          <div className="space-y-3">
            {[
              { label: 'Free', count: subscriptions?.free_plan || 0, color: 'bg-gray-400' },
              { label: 'Basic', count: subscriptions?.basic_plan || 0, color: 'bg-blue-500' },
              { label: 'Premium', count: subscriptions?.premium_plan || 0, color: 'bg-indigo-600' },
              { label: 'Enterprise', count: subscriptions?.enterprise_plan || 0, color: 'bg-purple-600' },
            ].map((plan) => {
              const total = (subscriptions?.active_subs || 1);
              const pct = Math.round((plan.count / total) * 100) || 0;
              return (
                <div key={plan.label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300 w-24">{plan.label}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                    <div className={`${plan.color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">{plan.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signup Trends */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Signups</h2>
          {signupTrends && signupTrends.length > 0 ? (
            <div className="space-y-2">
              {signupTrends.map((item) => {
                const maxSignups = Math.max(...signupTrends.map(s => parseInt(s.signups)));
                const pct = Math.round((parseInt(item.signups) / (maxSignups || 1)) * 100);
                return (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300 w-20">{item.month}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">{item.signups}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No signup data available yet.</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
        {recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xs flex-shrink-0">
                  {activity.action?.includes('login') ? '🔑' :
                   activity.action?.includes('payment') ? '💰' :
                   activity.action?.includes('announcement') ? '📢' :
                   activity.action?.includes('delete') ? '🗑️' :
                   activity.action?.includes('update') ? '✏️' : '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{activity.action?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activity.details}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {activity.user_name} &middot; {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 dark:text-gray-500 text-sm">No recent activity to show.</p>
        )}
      </div>

      {/* Quick Stats Summary */}
      <div className="card bg-gradient-to-r from-indigo-500 to-purple-600 border-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white">
          <div>
            <h3 className="text-lg font-semibold">Platform Summary</h3>
            <p className="text-indigo-100 text-sm mt-1">
              {users?.total_users || 0} total users &middot; {homework?.total_assignments || 0} assignments &middot; {quiz?.total_attempts || 0} quiz attempts
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{users?.new_users_30d || 0}</p>
              <p className="text-xs text-indigo-200">New (30d)</p>
            </div>
            <div className="border-l border-indigo-400 pl-4">
              <p className="text-2xl font-bold">{Number(payments?.revenue_30d || 0).toLocaleString()}</p>
              <p className="text-xs text-indigo-200">Revenue (30d)</p>
            </div>
            <div className="border-l border-indigo-400 pl-4">
              <p className="text-2xl font-bold">{quiz?.attempts_7d || 0}</p>
              <p className="text-xs text-indigo-200">Quizzes (7d)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
