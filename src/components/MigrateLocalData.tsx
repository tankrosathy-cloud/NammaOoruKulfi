import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Database, Loader2 } from 'lucide-react';
import localforage from 'localforage';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function MigrateLocalData() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [localKeys, setLocalKeys] = useState<string[]>([]);
  const [hasLocalStorage, setHasLocalStorage] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    localforage.keys().then(keys => setLocalKeys(keys)).catch(console.error);
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('entries') || localStorage.getItem('expenses')) {
        setHasLocalStorage(true);
      }
    }
  }, []);

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMessage('Reading local data...');
    try {
      const keys = await localforage.keys();
      const localStoreKeys = Object.keys(localStorage);
      const allKeys = Array.from(new Set([...keys, ...localStoreKeys]));
      let totalItems = 0;
      
      for (const key of allKeys) {
        if (['entries', 'expenses', 'profitWithdrawals', 'specialOrders', 'logs'].includes(key)) {
          let items = await localforage.getItem<any[]>(key);
          if (!items) {
             const str = localStorage.getItem(key);
             if (str) {
               try { items = JSON.parse(str); } catch (e) {}
             }
          }
          if (items && Array.isArray(items)) {
            for (const item of items) {
              if (item.id) {
                await setDoc(doc(db, key, item.id), item);
                totalItems++;
              }
            }
          }
        } else if (key === 'settings' || key === 'inventory') {
          let data = await localforage.getItem<any>(key);
          if (!data) {
             const str = localStorage.getItem(key);
             if (str) {
               try { data = JSON.parse(str); } catch (e) {}
             }
          }
          if (data) {
            await setDoc(doc(db, key, 'global'), data);
            totalItems++;
          }
        }
      }
      
      setMessage(`Successfully migrated ${totalItems} items to Cloud!`);
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  if (localKeys.length === 0 && !hasLocalStorage) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col gap-2 border-b border-amber-200 dark:border-amber-900/50 pb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Database className="w-4 h-4" /> Migrate Local Data
          </h3>
          <p className="text-[10px] text-amber-600/80 font-bold uppercase tracking-wide">
            We found old offline data in your browser. Click below to sync it to the cloud.
          </p>
        </div>
        
        <Button 
          onClick={handleMigrate} 
          disabled={isMigrating}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black tracking-widest"
        >
          {isMigrating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {isMigrating ? 'MIGRATING...' : 'SYNC OFFLINE DATA TO CLOUD'}
        </Button>
        {message && <p className="text-xs font-bold text-amber-600 mt-2 text-center">{message}</p>}
      </CardContent>
    </Card>
  );
}
