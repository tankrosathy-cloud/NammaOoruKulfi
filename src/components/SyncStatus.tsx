import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { db } from '../lib/firebase';
import { onSnapshotsInSync } from 'firebase/firestore';

export default function SyncStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online, indicate that we are syncing pending offline operations
      setIsSyncing(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsSyncing(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to Firestore synchronization events
    const unsubscribe = onSnapshotsInSync(db, () => {
      setIsSyncing(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  // Listen for firestore-write-start to transition into Syncing state
  useEffect(() => {
    const handleWriteStart = () => {
      if (isOnline) {
        setIsSyncing(true);
      }
    };
    window.addEventListener('firestore-write-start', handleWriteStart);
    return () => window.removeEventListener('firestore-write-start', handleWriteStart);
  }, [isOnline]);

  return (
    <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 border ${
      !isOnline
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse'
        : isSyncing
          ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500'
          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
    }`} title={!isOnline ? "Offline Mode" : isSyncing ? "Syncing data..." : "Live Synced"}>
      {!isOnline ? (
        <>
          <CloudOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Offline Mode</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span className="hidden sm:inline">Syncing data...</span>
        </>
      ) : (
        <>
          <Cloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Live Synced</span>
        </>
      )}
    </div>
  );
}
