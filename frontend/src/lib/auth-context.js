'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('yaruki_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await getMe();
      if (data.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem('yaruki_token');
      }
    } catch (err) {
      localStorage.removeItem('yaruki_token');
    }
    setLoading(false);
  }

  function loginUser(userData, token) {
    localStorage.setItem('yaruki_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('yaruki_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
