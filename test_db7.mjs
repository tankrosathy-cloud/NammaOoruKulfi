import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q2 = query(collection(db, 'specialOrders'));
  const snapshot2 = await getDocs(q2);
  snapshot2.docs.forEach(doc => {
    const e = doc.data();
    console.log("Special order:", e.date, e.amountReceived);
  });
  
  const q = query(collection(db, 'entries'));
  const snap = await getDocs(q);
  snap.docs.forEach(doc => {
    const e = doc.data();
    console.log("Entry:", e.date);
  });
  process.exit(0);
}
run();
