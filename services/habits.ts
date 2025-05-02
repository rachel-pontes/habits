// services/habits.ts
import {
    collection,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    doc,
    query,
    orderBy
  } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
  import { format } from 'date-fns';
  
  export async function fetchHabits(userId: string, week: Date[]) {
    const q = query(collection(db, `users/${userId}/habits`), orderBy('order'));
    const querySnapshot = await getDocs(q);
    const habitsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
    const statusMap: Record<string, boolean> = {};
    const completionMap: Record<string, number> = {};
  
    for (const habit of habitsData) {
      const statusQuery = await getDocs(collection(db, `users/${userId}/habits/${habit.id}/habitStatus`));
      const habitStatus = statusQuery.docs.map(doc => ({
        date: doc.id,
        ...doc.data()
      }));
  
      let completedCount = 0;
  
      for (const { date, completed } of habitStatus) {
        const key = `${habit.id}_${date}`;
        statusMap[key] = completed;
  
        if (week.find(d => format(d, 'yyyy-MM-dd') === date) && completed) {
          completedCount++;
        }
      }
  
      completionMap[habit.id] = completedCount;
    }
  
    return { habits: habitsData, statusMap, completionMap };
  }
  
  export async function toggleStatus(
    userId: string,
    habitId: string,
    date: string,
    currentStatus: boolean,
    week: Date[]
  ) {
    const statusRef = doc(db, `users/${userId}/habits/${habitId}/habitStatus/${date}`);
  
    if (!currentStatus) {
      await setDoc(statusRef, { completed: true });
    } else {
      await deleteDoc(statusRef);
    }
  
    const updatedStatus = !currentStatus;
  
    // Recalculate completed count
    let completedCount = 0;
    for (const dateObj of week) {
      const d = format(dateObj, 'yyyy-MM-dd');
      const ref = doc(db, `users/${userId}/habits/${habitId}/habitStatus/${d}`);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().completed) {
        completedCount++;
      }
    }
  
    return { updatedStatus, completedCount };
  }
  