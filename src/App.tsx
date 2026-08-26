/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import AppShell from './AppShell';
import { Logo } from './components/Logo';
import { auth } from './lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, User } from 'firebase/auth';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-bold tracking-widest text-sm uppercase transition-colors duration-300 ${
        isDark ? 'bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-slate-800'
      }`}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <AppShell />;
}

function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const allowedUsers = [
    { name: 'Nadeem', role: 'Owner' },
    { name: 'Admin', role: 'Admin' },
    { name: 'Yuvaraj', role: 'Owner' },
    { name: 'Althaf', role: 'Staff' },
    { name: 'Sebastin', role: 'Staff' },
    { name: 'Nafees', role: 'Staff' }
  ];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('Please select a user');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
      
      const userIdLower = userId.toLowerCase().trim();
      const email = `${userIdLower}@nammaoorukulfi.com`;

      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/user-not-found') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
          } catch (createErr: any) {
             if (createErr.code === 'auth/email-already-in-use') {
               setError("Invalid password.");
             } else {
               setError(createErr.message);
             }
          }
        } else if (signInErr.code === 'auth/operation-not-allowed') {
          setError("Email/Password auth is disabled. Please enable it in Firebase Console -> Authentication -> Sign-in method.");
        } else {
          setError(signInErr.message);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 font-sans relative transition-colors duration-300 ${
      isDark ? 'bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      {/* Theme toggle in top corner */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-full border transition-all ${
          isDark 
            ? 'bg-slate-900/50 border-slate-800 text-cyan-400 hover:text-cyan-300' 
            : 'bg-white border-slate-200 text-pink-500 hover:text-pink-600 shadow-sm'
        }`}
        title={isDark ? "Switch to Day Vision" : "Switch to Night Vision"}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className={`w-full max-w-sm p-8 rounded-3xl border transition-all duration-300 ${
        isDark 
          ? 'bg-slate-900/50 border-slate-800 shadow-2xl' 
          : 'bg-white border-slate-100 shadow-lg shadow-slate-200/50'
      }`}>
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo className={`w-20 h-20 mb-4 transition-all ${
            isDark ? 'shadow-lg shadow-pink-500/20' : 'shadow-md shadow-pink-500/10'
          }`} />
          <span className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-2 block ${
            isDark ? 'text-cyan-400' : 'text-cyan-600'
          }`}>Authorized Personnel</span>
          <h1 className={`text-2xl font-black tracking-tighter uppercase ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>Namma Ooru <span className="text-pink-500">Kulfi</span></h1>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {error && (
            <div className={`p-3 border text-xs font-bold rounded-lg uppercase tracking-wider ${
              isDark 
                ? 'bg-red-950/50 border-red-900 text-red-400' 
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            <label className={`text-[10px] font-bold uppercase tracking-widest block text-center mb-4 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>Select User</label>
            <div className="grid grid-cols-2 gap-2.5">
              {allowedUsers.map(u => (
                <button
                  key={u.name}
                  type="button"
                  onClick={() => setUserId(u.name)}
                  className={`h-12 px-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex flex-col items-center justify-center ${
                    userId === u.name 
                      ? isDark
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                        : 'bg-cyan-50 border-cyan-500 text-cyan-600 shadow-md'
                      : isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>{u.name}</span>
                  <span className={`text-[8px] font-bold opacity-75 uppercase tracking-tight`}>
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-4 relative">
            <label className={`text-[10px] font-bold uppercase tracking-widest block text-center ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full h-12 rounded-xl px-12 font-medium focus:ring-1 outline-none transition-all text-center tracking-widest ${
                  isDark 
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-400 focus:ring-cyan-400' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:ring-cyan-500'
                }`}
                required 
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1 ${
                  isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-400 hover:text-cyan-600'
                }`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !userId}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-50 transition-all mt-4 cursor-pointer shadow-md"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

