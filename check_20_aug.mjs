import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'entries'));
  const snap = await getDocs(q);
  const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
  
  const aug20 = data.filter(d => d.date === '2026-08-20');
  console.log("Aug 20 entries:", aug20);
  
  const aug21 = data.filter(d => d.date === '2026-08-21');
  console.log("Aug 21 entries:", aug21);
  process.exit(0);
}
run();
