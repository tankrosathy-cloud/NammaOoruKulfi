
import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Eye, EyeOff, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Basic Logo component placeholder
const Logo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 22h20L12 2z" />
  </svg>
);

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // 'auth': normal login/signup
  // 'forgot': choosing forgot password method (email only now)
  const [step, setStep] = useState<'auth' | 'forgot'>('auth');
  
  const isDark = theme === 'dark';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      try {
        sessionStorage.setItem('just_logged_in', 'true');
        sessionStorage.removeItem('namma_active_tab');
        localStorage.removeItem('namma_active_tab');
        sessionStorage.removeItem('namma_edit_date');
      } catch {}
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
         setError("Invalid credentials.");
      } else if (err.code === 'auth/email-already-in-use') {
         setError("Email already in use.");
      } else {
         setError(err.message || 'Authentication failed');
      }
    }
    setLoading(false);
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');

    try {
      if (!email) {
        setError('Please enter your email');
        setLoading(false);
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setMsg('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset request');
    }
    setLoading(false);
  };

  const renderAuthForm = () => (
    <form onSubmit={handleAuth} className="space-y-6">
      {error && (
        <div className={`p-3 border text-xs font-bold rounded-lg uppercase tracking-wider ${isDark ? 'bg-red-950/50 border-red-900 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {error}
        </div>
      )}

      <div className="space-y-2 relative">
        <label className={`text-[10px] font-bold uppercase tracking-widest block text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full h-12 rounded-xl px-4 font-medium focus:ring-1 outline-none transition-all text-center tracking-wide ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-400 focus:ring-cyan-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:ring-cyan-500'}`}
          required 
          placeholder="partner@example.com"
        />
      </div>

      <div className="space-y-2 relative">
        <label className={`text-[10px] font-bold uppercase tracking-widest block text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Access PIN / Password</label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full h-12 rounded-xl px-4 font-medium focus:ring-1 outline-none transition-all text-center tracking-widest ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-400 focus:ring-cyan-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:ring-cyan-500'}`}
            required 
            placeholder="••••••••"
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {!isSignUp && (
          <div className="text-right mt-1">
            <button 
              type="button" 
              onClick={() => setStep('forgot')}
              className={`text-[10px] font-bold uppercase tracking-widest hover:underline ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}
            >
              Forgot Access?
            </button>
          </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className={`w-full h-12 text-white font-black uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md ${isDark ? 'bg-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)]'}`}
      >
        {loading ? 'Authenticating...' : (isSignUp ? 'Initialize Profile' : 'Access Dashboard')}
      </button>
    </form>
  );

  const renderForgot = () => (
    <form onSubmit={handleSendReset} className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <button type="button" onClick={() => setStep('auth')} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}><ArrowLeft className="w-5 h-5" /></button>
        <h3 className={`text-lg font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Reset Access</h3>
      </div>
      
      {error && (
        <div className={`p-3 border text-xs font-bold rounded-lg uppercase tracking-wider ${isDark ? 'bg-red-950/50 border-red-900 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {error}
        </div>
      )}

      {msg && (
        <div className={`p-3 border text-xs font-bold rounded-lg uppercase tracking-wider ${isDark ? 'bg-emerald-950/50 border-emerald-900 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
          {msg}
        </div>
      )}

      <div className="space-y-2 relative">
        <label className={`text-[10px] font-bold uppercase tracking-widest block text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Registered Email</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full h-12 rounded-xl px-4 font-medium focus:ring-1 outline-none transition-all text-center tracking-wide ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-400 focus:ring-cyan-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:ring-cyan-500'}`}
          required 
          placeholder="partner@example.com"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full h-12 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 font-sans relative transition-colors duration-300 ${isDark ? 'bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-slate-800'}`}>
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-full border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800 text-cyan-400 hover:text-cyan-300' : 'bg-white border-slate-200 text-pink-500 hover:text-pink-600 shadow-sm'}`}
        title={isDark ? "Switch to Day Vision" : "Switch to Night Vision"}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className={`w-full max-w-sm p-8 rounded-3xl border transition-all duration-300 ${isDark ? 'bg-slate-900/50 border-slate-800 shadow-2xl' : 'bg-white border-slate-100 shadow-lg shadow-slate-200/50'}`}>
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo className={`w-20 h-20 mb-4 transition-all ${isDark ? 'text-cyan-400 shadow-lg shadow-cyan-500/20' : 'text-pink-500 shadow-md shadow-pink-500/10'}`} />
          <span className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-2 block ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
            {step === 'auth' ? (isSignUp ? 'New Partner' : 'Authorized Personnel') : 'Security Protocol'}
          </span>
          <h1 className={`text-2xl font-black tracking-tighter uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>Kulfi <span className="text-pink-500">Franchise</span></h1>
        </div>

        {step === 'auth' && renderAuthForm()}
        {step === 'forgot' && renderForgot()}

        {step === 'auth' && (
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className={`text-xs font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
