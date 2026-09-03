import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const q = collection(db, 'users');
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      if(data.role === 'owner' || data.role === 'manager' || data.role === 'superadmin') {
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
