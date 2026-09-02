import React, { useState } from 'react';
import { useFranchise } from '../context/FranchiseContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Building2, KeyRound, LogOut, ArrowRight, Loader2 } from 'lucide-react';

export function FranchiseOnboarding() {
  const { createFranchise, joinFranchise } = useFranchise();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createFranchise(name.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to create franchise');
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      await joinFranchise(inviteCode.trim().toUpperCase());
    } catch (err: any) {
      setError(err.message || 'Failed to join franchise. Check the invite code.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-stone-200">
        <div className="text-center mb-8">
          <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-amber-700" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800">Welcome to Kulfi</h2>
          <p className="text-stone-500 mt-2">Set up your workspace to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        {mode === 'select' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full p-4 flex items-center justify-between bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm group-hover:text-amber-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-stone-800 group-hover:text-amber-800">Create Franchise</h3>
                  <p className="text-sm text-stone-500">I am a Franchise Owner setting up a new location</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-amber-600" />
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full p-4 flex items-center justify-between bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm group-hover:text-amber-600">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-stone-800 group-hover:text-amber-800">Join Franchise</h3>
                  <p className="text-sm text-stone-500">I have an invite code from my franchise owner</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-amber-600" />
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Franchise Location</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Saravanampatti, Coimbatore"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="px-6 py-3 rounded-xl font-medium text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Invite Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-center font-mono text-xl tracking-widest uppercase"
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="px-6 py-3 rounded-xl font-medium text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={inviteCode.length < 5 || loading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join'}
              </button>
            </div>
          </form>
        )}
        
        <div className="mt-8 pt-6 border-t border-stone-100 text-center">
          <button 
            onClick={() => signOut(auth)}
            className="text-stone-400 hover:text-stone-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
