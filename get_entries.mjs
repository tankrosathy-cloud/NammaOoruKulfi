import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const querySnapshot = await getDocs(query(collection(db, 'entries'), limit(5)));
  querySnapshot.forEach((doc) => {
    console.log(doc.id, "=>", doc.data().franchiseId);
  });
  process.exit(0);
}
run();
