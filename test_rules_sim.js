import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

async function run() {
  const testEnv = await initializeTestEnvironment({
    projectId: "demo-project-1234",
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    // Create the manager
    await setDoc(doc(db, 'users', 'manager123'), {
      role: 'manager',
      franchiseId: 'F-1788087111153',
      uid: 'manager123'
    });
    // Create the staff
    await setDoc(doc(db, 'users', 'staff123'), {
      role: 'staff',
      franchiseId: 'F-1788087111153',
      uid: 'staff123'
    });
  });

  const managerContext = testEnv.authenticatedContext('manager123');
  const managerDb = managerContext.firestore();

  try {
    console.log("Testing update by manager...");
    await assertSucceeds(updateDoc(doc(managerDb, 'users', 'staff123'), {
      franchiseId: null,
      role: 'user'
    }));
    console.log("SUCCESS!");
  } catch(e) {
    console.error("FAIL:", e);
  }

  await testEnv.cleanup();
}

run().catch(console.error);
