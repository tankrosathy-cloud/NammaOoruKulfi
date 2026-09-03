import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app); // default db

async function run() {
  const snap = await getDocs(collection(db, 'franchises'));
  console.log('Franchises found:', snap.docs.map(d => d.id));
  process.exit(0);
}
run();
