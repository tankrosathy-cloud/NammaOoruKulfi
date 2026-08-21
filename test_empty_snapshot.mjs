import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const unsub = onSnapshot(query(collection(db, 'entries')), (snap) => {
  console.log("Snapshot size:", snap.size);
  unsub();
  process.exit(0);
});
