import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, Database } from 'lucide-react';
import { db } from '../lib/firebase';
import { onSnapshotsInSync } from 'firebase/firestore';
import { useSync } from '../store';
import { isSupabaseConfigured } from '../lib/supabase';

export default function SyncStatus() {
  const { syncNow, isSyncing: isStoreSyncing, databaseType } = useSync();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const isSupabase = databaseType === 'supabase' || isSupabaseConfigured();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const justSyncedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startSyncing = (durationMs = 2000) => {
    setIsSyncing(true);
    setJustSynced(false);

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Safety timeout: Never stay spinning indefinitely
    syncTimeoutRef.current = setTimeout(() => {
      setIsSyncing(false);
      setJustSynced(true);
      if (justSyncedTimeoutRef.current) clearTimeout(justSyncedTimeoutRef.current);
      justSyncedTimeoutRef.current = setTimeout(() => setJustSynced(false), 2500);
    }, durationMs);
  };

  const finishSyncing = () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    setIsSyncing(false);
    setJustSynced(true);
    if (justSyncedTimeoutRef.current) clearTimeout(justSyncedTimeoutRef.current);
    justSyncedTimeoutRef.current = setTimeout(() => setJustSynced(false), 2500);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      startSyncing(1500);
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsSyncing(false);
      setJustSynced(false);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to Firestore synchronization events
    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshotsInSync(db, () => {
        finishSyncing();
      });
    } catch (e) {
      console.warn('onSnapshotsInSync listener warning:', e);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (justSyncedTimeoutRef.current) clearTimeout(justSyncedTimeoutRef.current);
      unsubscribe();
    };
  }, [syncNow]);

  // Listen for firestore-write-start to transition into brief Syncing state
  useEffect(() => {
    const handleWriteStart = () => {
      if (isOnline) {
        startSyncing(1200);
      }
    };

    window.addEventListener('firestore-write-start', handleWriteStart);
    return () => window.removeEventListener('firestore-write-start', handleWriteStart);
  }, [isOnline]);

  const handleForceSync = async () => {
    if (!isOnline || isSyncing || isStoreSyncing) return;
    startSyncing(2000);
    try {
      await syncNow();
    } catch (e) {
      console.error('Force sync error:', e);
    } finally {
      finishSyncing();
    }
  };

  const activeSyncing = isSyncing || isStoreSyncing;

  return (
    <button 
      id="sync-status-button"
      onClick={handleForceSync}
      disabled={!isOnline || activeSyncing}
      className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
        !isOnline
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse'
          : activeSyncing
            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-500/20'
            : justSynced
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : isSupabase
                ? 'border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/50 shadow-sm'
                : 'border-slate-300 dark:border-slate-800 text-cyan-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 shadow-sm'
      }`} 
      title={!isOnline ? "Offline Mode" : activeSyncing ? "Syncing..." : isSupabase ? "Supabase PostgreSQL Database Synced" : "Cloud Synced"}
    >
      {!isOnline ? (
        <>
          <CloudOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Offline</span>
        </>
      ) : activeSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          <span className="hidden sm:inline">Syncing...</span>
        </>
      ) : justSynced ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline text-emerald-400">{isSupabase ? 'Supabase Synced' : 'Synced'}</span>
        </>
      ) : isSupabase ? (
        <>
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-bold">Supabase</span>
        </>
      ) : (
        <>
          <Cloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Synced</span>
        </>
      )}
    </button>
  );
}


