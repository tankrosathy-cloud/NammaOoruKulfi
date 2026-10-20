import React, { useState } from 'react';
import { useFranchise, SATHY_FRANCHISE_ID, SATHY_FRANCHISE_NAME } from '../context/FranchiseContext';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Building2, KeyRound, LogOut, ArrowRight, Loader2, Store } from 'lucide-react';
import { UserProfile, Franchise } from '../types';

export function FranchiseOnboarding() {
  const { createFranchise, joinFranchise } = useFranchise();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentUser = auth.currentUser;
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const isSathyUser = userEmail === 'nammaoorukulfisathy@gmail.com' || userEmail.includes('sathy') || userEmail.includes('kulfi');

  // Auto-connect Sathyamangalam store without requiring user to go through onboarding
  React.useEffect(() => {
    if (isSathyUser && currentUser && !loading) {
      handleAccessSathyStore();
    }
  }, [isSathyUser, currentUser]);

  const handleAccessSathyStore = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const sProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || 'nammaoorukulfisathy@gmail.com',
        role: 'owner',
        franchiseId: SATHY_FRANCHISE_ID
      };
      const sFranchise: Franchise = {
        id: SATHY_FRANCHISE_ID,
        name: SATHY_FRANCHISE_NAME,
        ownerId: currentUser.uid,
        inviteCode: 'SATHY1',
        createdAt: '2026-08-31T09:27:24.071Z'
      };

      localStorage.setItem(`namma_profile_${currentUser.uid}`, JSON.stringify(sProfile));
      localStorage.setItem(`namma_franchise_${currentUser.uid}`, JSON.stringify(sFranchise));
      localStorage.setItem('namma_last_profile', JSON.stringify(sProfile));
      localStorage.setItem('namma_last_franchise', JSON.stringify(sFranchise));

      try {
        await setDoc(doc(db, 'users', currentUser.uid), sProfile, { merge: true });
        await setDoc(doc(db, 'franchises', SATHY_FRANCHISE_ID), sFranchise, { merge: true });
      } catch (err) {
        console.warn("Could not write store docs to Firestore immediately:", err);
      }

      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Sathyamangalam store');
      setLoading(false);
    }
  };

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

  if (isSathyUser && loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-stone-200 text-center space-y-4">
          <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-amber-700">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-stone-800">Connecting to Sathyamangalam Store...</h2>
          <p className="text-sm text-stone-500">Loading your store dashboard and inventory</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-stone-200">
        <div className="text-center mb-8">
          <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-amber-700" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800">Welcome to Namma Ooru Kulfi</h2>
          <p className="text-stone-500 mt-2">Set up or connect your store workspace to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        {mode === 'select' && (
          <div className="space-y-4">
            {/* Quick Connect for Sathyamangalam / Existing Owner */}
            <button
              onClick={handleAccessSathyStore}
              disabled={loading}
              className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-2 border-amber-300 rounded-2xl transition-all shadow-sm group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-amber-500 text-white p-3 rounded-xl shadow-sm">
                  <Store className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-amber-950">Sathyamangalam Store</h3>
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">Existing</span>
                  </div>
                  <p className="text-xs text-amber-800/80">Connect to Sathyamangalam (Namma Ooru Kulfi)</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
            </button>
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
