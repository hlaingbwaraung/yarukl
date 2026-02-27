'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { loginUser } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.error) {
        setError(data.error);
      } else {
        loginUser(data.user, data.token);
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sakura-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center px-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-4xl">🎌</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-sakura-500 bg-clip-text text-transparent mt-2">
              Yaruki
            </h1>
          </Link>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Welcome back! ようこそ！</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-center mb-6 dark:text-gray-100">Log In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
              Sign Up
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Test: student@yaruki.com / student123
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
