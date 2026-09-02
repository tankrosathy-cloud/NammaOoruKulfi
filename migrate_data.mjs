import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const TARGET_FRANCHISE_ID = 'F-1788087111153';

async function migrateCollection(collectionName) {
  const ref = collection(db, collectionName);
  const snapshot = await getDocs(ref);
  let updated = 0;
  
  for (const document of snapshot.docs) {
    const data = document.data();
    if (!data.franchiseId) {
      await updateDoc(doc(db, collectionName, document.id), {
        franchiseId: TARGET_FRANCHISE_ID
      });
      updated++;
    }
  }
  console.log(`Migrated ${updated} documents in ${collectionName}`);
}

async function run() {
  const collections = ['entries', 'expenses', 'profitWithdrawals', 'specialOrders', 'inventory', 'daily_denominations', 'logs'];
  for (const coll of collections) {
    await migrateCollection(coll);
  }
  process.exit(0);
}

run();
