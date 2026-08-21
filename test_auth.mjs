import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function run() {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, 'nadeem@nammaoorukulfi.com', 'password'); // or whatever it was
    console.log("Logged in:", userCredential.user.uid);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
