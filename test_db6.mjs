import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'expenses'));
  const snapshot = await getDocs(q);
  
  let expenses = 0;
  snapshot.docs.forEach(doc => {
    const e = doc.data();
    expenses += (e.amount || 0);
  });
  console.log("Total expenses collection:", expenses);
  
  const q2 = query(collection(db, 'entries'));
  const snap2 = await getDocs(q2);
  let inlineExpenses = 0;
  let shortage = 0;
  snap2.docs.forEach(doc => {
    const e = doc.data();
    inlineExpenses += ((e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0));
    shortage += (e.shortage || 0);
  });
  console.log("Total entries expenses:", inlineExpenses, "shortage:", shortage);
  process.exit(0);
}
run();
