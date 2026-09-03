import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'superadminnok@gmail.com', 'Armaan@1');
    const user = cred.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      role: 'superadmin',
      franchiseId: 'superadmin',
      createdAt: new Date().toISOString()
    });
    console.log("Superadmin created successfully with uid:", user.uid);
    process.exit(0);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log("User already exists. Skipping creation.");
      process.exit(0);
    }
    console.error("Error creating superadmin:", err);
    process.exit(1);
  }
}

run();
