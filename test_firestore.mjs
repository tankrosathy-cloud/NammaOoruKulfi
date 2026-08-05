import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'entries'), orderBy('date', 'desc'), limit(10));
  const snapshot = await getDocs(q);
  console.log("Entries ordered by date desc:");
  snapshot.docs.forEach(doc => console.log(doc.id, doc.data().date));
  
  const q2 = query(collection(db, 'entries'), limit(10));
  const snapshot2 = await getDocs(q2);
  console.log("Entries unordered:");
  snapshot2.docs.forEach(doc => console.log(doc.id, doc.data().date));
}
run();
