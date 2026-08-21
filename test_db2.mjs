import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import fs from 'fs';
import { parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const q = query(collection(db, 'entries'));
  const snapshot = await getDocs(q);
  
  let entryMonth = 0;
  let entryWeek = 0;
  
  snapshot.docs.forEach(doc => {
    const e = doc.data();
    if (e.date) {
      const revenue = Math.max(0, (e.actualAmount || 0) - (e.cashBagLoaded || 0) + (e.expenses || 0) + (e.additionalExpenses || 0) + (e.bonus || 0));
      try {
        const date = parseISO(e.date);
        if (isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd })) {
          entryMonth += revenue;
        }
        if (isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd })) {
          entryWeek += revenue;
        }
      } catch(err) {}
    }
  });
  console.log("Entries Month:", entryMonth, "Week:", entryWeek);
  
  const q2 = query(collection(db, 'specialOrders'));
  const snapshot2 = await getDocs(q2);
  let specialMonth = 0;
  let specialWeek = 0;
  snapshot2.docs.forEach(doc => {
    const e = doc.data();
    if (e.date) {
       const revenue = e.amountReceived || 0;
       try {
        const date = parseISO(e.date);
        if (isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd })) {
          specialMonth += revenue;
        }
        if (isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd })) {
          specialWeek += revenue;
        }
      } catch(err) {}
    }
  });
  console.log("Special Month:", specialMonth, "Week:", specialWeek);
  process.exit(0);
}
run();
