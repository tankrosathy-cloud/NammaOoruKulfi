import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'logs'));
  const snap = await getDocs(q);
  const logs = snap.docs.map(d => d.data());
  // Sort by timestamp
  logs.sort((a, b) => {
    const tA = a.timestamp?.seconds || 0;
    const tB = b.timestamp?.seconds || 0;
    return tA - tB;
  });
  
  logs.forEach(l => {
    console.log(`[${new Date((l.timestamp?.seconds || 0)*1000).toISOString()}] ${l.userName || l.userId}: ${l.action} - ${l.details}`);
  });
  process.exit(0);
}
run();
