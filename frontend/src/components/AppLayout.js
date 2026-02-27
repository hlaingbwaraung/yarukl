'use client';

import { AuthProvider, useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function ProtectedContent({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🎌</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Yaruki...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <ProtectedContent>{children}</ProtectedContent>
    </AuthProvider>
  );
}
