import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const fRef = collection(db, 'franchises');
  const fSnap = await getDocs(fRef);
  fSnap.forEach(doc => {
    console.log("Franchise:", doc.data());
  });

  const eRef = collection(db, 'entries');
  const eSnap = await getDocs(eRef);
  let byFid = {};
  eSnap.forEach(doc => {
    const data = doc.data();
    const fid = data.franchiseId || 'none';
    byFid[fid] = (byFid[fid] || 0) + 1;
  });
  console.log("Entries by franchiseId:", byFid);
  
  process.exit(0);
}
run();
