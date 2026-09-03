import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      if(data.email && data.email.toLowerCase().includes('tankrosathy')) {
         console.log(doc.id, '=>', data);
      }
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
run();
