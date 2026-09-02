import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const usersRef = collection(db, 'users');
  const usersSnap = await getDocs(usersRef);
  usersSnap.forEach(doc => {
    console.log("User doc:", doc.id, doc.data());
  });
  process.exit(0);
}
run();
