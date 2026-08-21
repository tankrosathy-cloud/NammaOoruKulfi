import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'entries'));
  const snapshot = await getDocs(q);
  
  snapshot.docs.forEach(doc => {
    const e = doc.data();
    if (e.date && e.date.startsWith('2024-')) {
      const revenue = Math.max(0, (e.actualAmount || 0) - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0));
      console.log(e.date, revenue);
    }
  });
  process.exit(0);
}
run();
