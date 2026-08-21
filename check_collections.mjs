import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const collections = ['entries', 'expenses', 'profitWithdrawals', 'specialOrders', 'logs', 'daily_entries'];
  for (const c of collections) {
    const snap = await getDocs(query(collection(db, c)));
    console.log(`Collection ${c}: ${snap.size} docs`);
    if (snap.size > 0) {
        const firstDoc = snap.docs[0].data();
        console.log(`  Sample:`, Object.keys(firstDoc).includes('date') ? firstDoc.date : 'No date field');
    }
  }
  process.exit(0);
}
run();
