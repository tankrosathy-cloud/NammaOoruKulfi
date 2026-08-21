import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  await signInWithEmailAndPassword(auth, 'system@nammaoorukulfi.com', 'system_password');

  // Delete placeholders
  const qProfit = query(collection(db, 'profitWithdrawals'), where('notes', '==', 'Placeholder - Please Edit'));
  const snapProfit = await getDocs(qProfit);
  for (const d of snapProfit.docs) {
    await deleteDoc(d.ref);
  }

  const qEvent = query(collection(db, 'specialOrders'), where('notes', '==', 'Placeholder - Please Edit'));
  const snapEvent = await getDocs(qEvent);
  for (const d of snapEvent.docs) {
    await deleteDoc(d.ref);
  }

  // Insert actual Profit Taken
  await addDoc(collection(db, 'profitWithdrawals'), {
    date: '2026-08-14',
    amount: 40000,
    notes: '20K EACH'
  });
  console.log("Inserted Profit Taken");

  // Insert actual Event Order
  await addDoc(collection(db, 'specialOrders'), {
    date: '2026-08-13',
    eventType: 'Event',
    stickQuantity: 0,
    potQuantity: 0,
    amountReceived: 2376,
    notes: 'FOOD MALL'
  });
  console.log("Inserted Event Order");

  process.exit(0);
}
run();
