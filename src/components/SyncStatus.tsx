import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, Database } from 'lucide-react';
import { db } from '../lib/firebase';
import { onSnapshotsInSync } from 'firebase/firestore';
import { useSync } from '../store';
import { isSupabaseConfigured } from '../lib/supabase';
import { useFranchise } from '../context/FranchiseContext';
import { auth } from '../lib/firebase';

export default function SyncStatus() {
  return null;
}


