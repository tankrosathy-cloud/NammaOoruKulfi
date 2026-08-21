import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const invRef = doc(db, 'inventory', 'global');
  const snap = await getDoc(invRef);
  const data = snap.exists() ? snap.data() : {};
  
  await setDoc(invRef, {
    ...data,
    id: 'global',
    lastUpdatedDate: '2026-08-14',
    stickQuantity: 1574,
    potQuantity: 0
  });
  console.log('Restored inventory doc to 14-Aug-2026 base 1574');
  process.exit(0);
}
run();
