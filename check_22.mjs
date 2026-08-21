import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'entries'), where('date', '==', '2026-08-22'));
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} entries for Aug 22`);
  snap.docs.forEach(d => console.log(d.data()));
  process.exit(0);
}
run();
