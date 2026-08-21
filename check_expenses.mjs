import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'expenses'));
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} expenses`);
  snap.docs.forEach(d => {
    console.log(d.data().date, d.data().amount, d.data().paidBy, d.data().category, d.data().notes);
  });
  process.exit(0);
}
run();
