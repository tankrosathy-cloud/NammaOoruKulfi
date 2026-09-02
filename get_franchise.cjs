const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "nammaoorukulfi-86069",
  appId: "1:300150512424:web:f8364b3f2a112b4d530e1d",
  apiKey: "AIzaSyBPsdXI_9pJ6NNMCt-SDeyGGRrh8xxRobE",
  authDomain: "nammaoorukulfi-86069.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Querying franchises...");
  const q = query(collection(db, 'franchises'));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log("Franchise:", doc.id, doc.data());
  });

  console.log("Querying users...");
  const uq = query(collection(db, 'users'));
  const usnap = await getDocs(uq);
  usnap.forEach(doc => {
    console.log("User:", doc.id, doc.data());
  });
  
  process.exit(0);
}

run().catch(console.error);
