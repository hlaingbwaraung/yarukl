import Link from 'next/link';
import { ThemeToggle } from '@/lib/theme-context';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sakura-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎌</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-sakura-500 bg-clip-text text-transparent">
              Yaruki
            </span>
          </div>
          <div className="flex gap-3">
            <ThemeToggle />
            <Link href="/login" className="btn-secondary text-sm py-2 px-4">
              Login
            </Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-6xl mb-6">🇯🇵</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
            Learn Japanese
            <span className="block bg-gradient-to-r from-indigo-600 to-sakura-500 bg-clip-text text-transparent">
              the Myanmar Way
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            မြန်မာစကားပြောသူများအတွက် ဂျပန်စာသင်ကြားရေး platform
          </p>
          <p className="text-base text-gray-500 dark:text-gray-400 mb-10">
            A modern Japanese language learning platform designed specifically for Burmese speakers.
            From N5 to N3, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              Start Learning Free
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-4">
              I have an account
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">Homework System</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Submit your handwriting practice and get feedback from teachers.
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">JLPT Quizzes</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Practice Kanji and Grammar for N5, N4, N3, N2, and N1 levels.
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">📖</div>
            <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">JP-MM Dictionary</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Japanese to Burmese dictionary with readings and examples.
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">Mobile Friendly</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Learn anytime, anywhere on your phone or tablet.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 Yaruki Japanese Language School. Built with ❤️ for Myanmar learners.
          </p>
        </div>
      </footer>
    </div>
  );
}
