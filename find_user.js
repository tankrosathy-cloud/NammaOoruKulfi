import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    let found = false;
    snapshot.forEach(doc => {
      const data = doc.data();
      if(data.email && data.email.toLowerCase() === 'tankrosathy@gmail.com') {
         console.log(doc.id, '=>', data);
         found = true;
      }
    });
    if (!found) {
        console.log("tankrosathy@gmail.com not found!");
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
run();
