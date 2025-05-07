// services/editHabit.ts
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { startOfWeek } from 'date-fns';

export async function getHabit(userId: string, habitId: string) {
    const ref = doc(db, `users/${userId}/habits/${habitId}`);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: habitId, ...snap.data() } : null;
}

export async function saveHabit(userId: string, habitId: string, data: any) {
    const ref = doc(db, `users/${userId}/habits/${habitId}`);
    await updateDoc(ref, data);
}

export async function deleteHabit(userId: string, habitId: string) {
    const ref = doc(db, `users/${userId}/habits/${habitId}`);
    await deleteDoc(ref);
}

export async function toggleArchiveHabit(
    userId: string,
    habitId: string,
    isArchived: boolean,
    existingRanges: any[],
    viewWeekStart: Date
  ) {
    const ref = doc(db, `users/${userId}/habits/${habitId}`);
    const weekDate = startOfWeek(viewWeekStart, { weekStartsOn: 1 }).toISOString().split('T')[0];
  
    let newRanges;
    if (isArchived) {
      // add end date to open archive range
      newRanges = existingRanges.map((r: any) => (r.end ? r : { ...r, end: weekDate }));
    } else {
      // add a new archive range starting at this week
      newRanges = [...existingRanges, { start: weekDate }];
    }
  
    await updateDoc(ref, { archiveRanges: newRanges });
    return newRanges;
  }
  