import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'entries'));
  const snap = await getDocs(q);
  const data = snap.docs.map(d => d.data());
  const aug19 = data.find(d => d.date === '2026-08-19');
  console.log(aug19);
  
  const rev = aug19.actualAmount - (aug19.cashBagLoaded || 0) + (aug19.expenses || 0) + (aug19.additionalExpenses || 0) + (aug19.bonus || 0);
  console.log("Calculated Rev:", rev);
  process.exit(0);
}
run();
