import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'entries'));
  const snapshot = await getDocs(q);
  
  let revenues = {};
  snapshot.docs.forEach(doc => {
    const e = doc.data();
    const dateStr = e.date ? e.date.substring(0, 7) : 'unknown';
    const revenue = Math.max(0, (e.actualAmount || 0) - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0));
    revenues[dateStr] = (revenues[dateStr] || 0) + revenue;
  });
  console.log("Monthly revenues:", revenues);
  process.exit(0);
}
run();
