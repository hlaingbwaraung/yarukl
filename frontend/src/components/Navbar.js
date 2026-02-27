'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/lib/theme-context';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { getNotifications, markUserMessageRead, markAllMessagesRead } from '@/lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  // Fetch notifications on mount and poll every 30s
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
    } catch (err) {
      // silent fail for polling
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllMessagesRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {}
  }

  const isActive = (path) => pathname === path;

  const isAdminOrTeacher = user?.role === 'admin' || user?.role === 'teacher';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/messages', label: 'Messages', icon: '💬' },
    ...(!isAdminOrTeacher ? [{ href: '/homework', label: 'Homework', icon: '📝' }] : []),
    { href: '/quiz', label: 'Quiz', icon: '🎯' },
    { href: '/dictionary', label: 'Dictionary', icon: '📖' },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ href: '/admin', label: 'Admin Panel', icon: '⚙️' });
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🎌</span>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-sakura-500 bg-clip-text text-transparent">
              Yaruki
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive(link.href)
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
                {link.href === '/messages' && unreadCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {user?.name}
              <span className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                {user?.role}
              </span>
            </span>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <Link
                        key={n.id}
                        href="/messages"
                        onClick={() => setNotifOpen(false)}
                        className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700/50 transition-colors ${
                          !n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                            !n.is_read ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}>
                            {n.sender_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${!n.is_read ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                              {n.sender_name}
                              {n.sender_role === 'admin' && <span className="ml-1 text-red-500 text-xs">●</span>}
                            </p>
                            <p className={`text-xs truncate ${!n.is_read ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                              {n.subject}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{n.body?.substring(0, 60)}</p>
                          </div>
                          {!n.is_read && <span className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0"></span>}
                        </div>
                      </Link>
                    )) : (
                      <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                        <p className="text-2xl mb-1">🔔</p>
                        <p className="text-xs">No notifications yet</p>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/messages"
                    onClick={() => setNotifOpen(false)}
                    className="block px-4 py-2.5 text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700"
                  >
                    View all messages →
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 dark:border-gray-800">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive(link.href)
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
                {link.href === '/messages' && unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 px-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {user?.name} ({user?.role})
                </p>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 font-medium"
                >
                  Logout
                </button>
              </div>
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
