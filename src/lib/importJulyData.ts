import { db, auth } from './firebase';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

export async function deleteJulyData() {
  const user = auth.currentUser;
  if (!user) {
    console.warn("User not authenticated, cannot delete July data.");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const q = query(
      collection(db, 'entries'),
      where('date', '>=', '2026-07-01'),
      where('date', '<=', '2026-07-31')
    );
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`Successfully deleted ${snapshot.size} July entries.`);
    return { success: true, count: snapshot.size };
  } catch (err: any) {
    console.error("Error deleting July data:", err);
    return { success: false, error: err.message };
  }
}
