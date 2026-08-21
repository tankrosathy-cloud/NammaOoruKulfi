import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, addDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, 'nadeem@nammaoorukulfi.com', 'password');
  } catch(e) {
    await createUserWithEmailAndPassword(auth, 'nadeem@nammaoorukulfi.com', 'password');
  }

  const q20 = query(collection(db, 'entries'), where('date', '==', '2026-08-20'));
  const snap20 = await getDocs(q20);
  if (!snap20.empty) {
    const docRef = snap20.docs[0].ref;
    await updateDoc(docRef, {
      stickSold: 57,
      potSold: 0,
      expenses: 15,
      actualAmount: 3430,
      cashBagLoaded: 1225,
      notes: 'KASTHURI BAKES 20-FRIEND 40'
    });
    console.log("Updated Aug 20");
  }

  const q21 = query(collection(db, 'entries'), where('date', '==', '2026-08-21'));
  const snap21 = await getDocs(q21);
  if (snap21.empty) {
    await addDoc(collection(db, 'entries'), {
      date: '2026-08-21',
      stickLoaded: 0,
      potLoaded: 0,
      stickBalance: 0,
      potBalance: 0,
      stickSold: 0,
      potSold: 0,
      cashBagLoaded: 1450,
      actualAmount: 0,
      requiredAmount: 1450,
      shortage: 1450,
      discount: 0,
      phonePe: 0,
      cashBagTotal: 0,
      expenses: 0,
      additionalExpenses: 0,
      bonus: 0,
      expenseDetails: '',
      notes: ''
    });
    console.log("Inserted Aug 21");
  }
  process.exit(0);
}
run();
