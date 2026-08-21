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
  data.sort((a, b) => b.date.localeCompare(a.date));
  console.log(data.slice(0, 5).map(d => `${d.date} - Rev: ${d.actualAmount}, Stick: ${d.stickSold}, Notes: ${d.notes}`));
  process.exit(0);
}
run();
