import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    const ownerId = "B4MMdJpX0hOmZ3AzLvKOcH2URoj2"; // aashiqahmed59@gmail.com
    const staffId = "eYsEhdFvL0bVFgmnNdtNKekQ1pG3"; // staff123@gmail.com
    
    // We cannot login without password.
    // Let's just create an admin app to see the document data.
    console.log("We can't easily test security rules as a real user without their password, unless we use the Firebase emulator.");
    
    // Let's just use admin SDK if we had it, but we can just fix the rule.
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
run();
