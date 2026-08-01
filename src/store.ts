import localforage from 'localforage';
import { useState, useEffect } from 'react';
import { DailyEntry, Settings } from './types';

localforage.config({
  name: 'NammaOoruKulfi',
  version: 1.0,
  storeName: 'kulfi_store',
});

const DEFAULT_SETTINGS: Settings = {
  stickPrice: 35,
  platePrice: 60,
  potPrice: 150,
};

export async function getEntries(): Promise<DailyEntry[]> {
  const entries = await localforage.getItem<DailyEntry[]>('entries');
  return entries || [];
}

export async function saveEntry(entry: DailyEntry): Promise<void> {
  const entries = await getEntries();
  const index = entries.findIndex(e => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  // Sort by date ascending
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  await localforage.setItem('entries', entries);
}

export async function deleteEntry(id: string): Promise<void> {
  const entries = await getEntries();
  const newEntries = entries.filter(e => e.id !== id);
  await localforage.setItem('entries', newEntries);
}

export async function getSettings(): Promise<Settings> {
  const settings = await localforage.getItem<Settings>('settings');
  return settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await localforage.setItem('settings', settings);
}

// React Hooks
export function useEntries() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = async () => {
    setLoading(true);
    const data = await getEntries();
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  return { entries, loading, reload: loadEntries };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    const data = await getSettings();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, loading, reload: loadSettings };
}
