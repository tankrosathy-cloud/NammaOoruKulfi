import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore,
  Firestore 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId;

let firestoreInstance: Firestore;
try {
  // Use long polling fallback to prevent WebView stream timeouts without triggering IDB assertion state bugs
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
  }, firestoreDbId);
} catch (e) {
  try {
    firestoreInstance = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
  } catch (err) {
    firestoreInstance = getFirestore(app);
  }
}

export const db = firestoreInstance;
export const auth = getAuth(app);
