import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const invSnap = await getDoc(doc(db, 'inventory', 'global'));
  console.log('Current Inventory Doc:', invSnap.data());

  const snap = await getDocs(collection(db, 'entries'));
  console.log(`Total entries: ${snap.size}`);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.date.localeCompare(b.date));
  list.forEach(e => {
    console.log(`${e.date} | Loaded: (stick ${e.stickLoaded}, pot ${e.potLoaded}) | Sold: (stick ${e.stickSold}, pot ${e.potSold}) | Balance: (stick ${e.stickBalance}, pot ${e.potBalance})`);
  });
  process.exit(0);
}
run();
