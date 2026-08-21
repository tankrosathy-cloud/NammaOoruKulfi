import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, 'system@nammaoorukulfi.com', 'system_password');
  } catch(e) {
    await createUserWithEmailAndPassword(auth, 'system@nammaoorukulfi.com', 'system_password');
  }

  // Insert a placeholder ProfitWithdrawal
  await addDoc(collection(db, 'profitWithdrawals'), {
    date: '2026-08-20',
    amount: 0,
    notes: 'Placeholder - Please Edit',
    createdAt: serverTimestamp()
  });
  console.log("Inserted placeholder Profit Withdrawal");

  // Insert a placeholder SpecialOrder
  await addDoc(collection(db, 'specialOrders'), {
    date: '2026-08-20',
    eventType: 'Event',
    stickQuantity: 0,
    potQuantity: 0,
    amountReceived: 0,
    notes: 'Placeholder - Please Edit',
    createdAt: serverTimestamp()
  });
  console.log("Inserted placeholder Special Order");

  process.exit(0);
}
run();
