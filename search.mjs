import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "nammaoorukulfi-86069",
  appId: "1:300150512424:web:f8364b3f2a112b4d530e1d",
  apiKey: "AIzaSyBPsdXI_9pJ6NNMCt-SDeyGGRrh8xxRobE",
  authDomain: "nammaoorukulfi-86069.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function search() {
  console.log("Fetching logs...");
  const logsSnapshot = await getDocs(collection(db, "logs"));
  const logs = logsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const deletedLogs = logs.filter(l => l.action && l.action.includes('DELETE'));
  console.log("Deleted logs:", deletedLogs.map(l => ({ action: l.action, details: l.details, date: l.timestamp })));

  console.log("Fetching entries...");
  const entriesSnapshot = await getDocs(collection(db, "entries"));
  const entries = entriesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const aprilEntries = entries.filter(e => e.date && e.date.includes('-04-03') || e.id.includes('-04-03'));
  console.log("April 3rd Entries:", aprilEntries);
}

search().catch(console.error).finally(() => process.exit(0));
