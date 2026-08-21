import { initializeApp } from 'firebase/app';
import { getFirestore, collectionGroup, getDocs, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const allGroups = ['entries', 'expenses', 'profitWithdrawals', 'specialOrders', 'logs', 'daily_entries'];
  let found = false;
  for (const g of allGroups) {
    const q = query(collectionGroup(db, g));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data();
      if (data.actualAmount === -1450 || data.actualAmount === 2220 || data.stickSold === 57 || data.date === '2026-08-21') {
        console.log(`Found in collection ${d.ref.path}:`, data);
        found = true;
      }
    }
  }
  if (!found) console.log("Not found anywhere in the known collection groups.");
  process.exit(0);
}
run();
