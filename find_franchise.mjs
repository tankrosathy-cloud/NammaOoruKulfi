import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  snapshot.forEach(doc => {
    console.log("User:", doc.data());
  });
  
  const fRef = collection(db, 'franchises');
  const fSnap = await getDocs(fRef);
  fSnap.forEach(doc => {
    console.log("Franchise:", doc.data());
  });
  
  process.exit(0);
}
run();
