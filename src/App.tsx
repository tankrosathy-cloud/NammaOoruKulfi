import React, { useState, useEffect } from 'react';
import AppShell from './AppShell';
import SuperAdmin from './pages/SuperAdmin';
import { Login } from './components/Login';
import { auth } from './lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { useFranchise } from './context/FranchiseContext';
import { FranchiseOnboarding } from './components/FranchiseOnboarding';

// Basic Logo component placeholder if Logo is not imported
const Logo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 22h20L12 2z" />
  </svg>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { theme } = useTheme();
  const { profile, loading: franchiseLoading } = useFranchise();
  const isDark = theme === 'dark';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  if (authLoading || franchiseLoading) {
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

  if (user.email === 'superadmin@gmail.com') {
    return <SuperAdmin />;
  }

  if (!profile) {
    return <FranchiseOnboarding />;
  }

  return <AppShell />;
}

