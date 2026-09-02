import { initializeApp } from 'firebase/app';
import { getFirestore, getDoc, setDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const TARGET_FRANCHISE_ID = 'F-1788087111153';

async function copyGlobalDoc(coll) {
  const globalRef = doc(db, coll, 'global');
  const snap = await getDoc(globalRef);
  if (snap.exists()) {
    const data = snap.data();
    data.franchiseId = TARGET_FRANCHISE_ID;
    const targetRef = doc(db, coll, TARGET_FRANCHISE_ID);
    await setDoc(targetRef, data);
    console.log(`Copied ${coll}/global to ${coll}/${TARGET_FRANCHISE_ID}`);
  }
}

async function run() {
  await copyGlobalDoc('settings');
  await copyGlobalDoc('inventory');
  process.exit(0);
}

run();
