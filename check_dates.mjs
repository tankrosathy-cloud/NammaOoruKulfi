import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'entries'));
  const snap = await getDocs(q);
  const dates = snap.docs.map(d => d.data().date);
  console.log(dates.sort());
  process.exit(0);
}
run();
