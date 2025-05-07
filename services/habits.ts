// services/habits.ts
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
  query,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { startOfWeek, format } from 'date-fns';

function isHabitVisible(habit: any, weekStart: Date): boolean {
  const created = habit.createdAt?.toDate?.(); // safely get JS Date
  const createdWeekStart = created ? startOfWeek(created, { weekStartsOn: 1 }) : null;

  if (!createdWeekStart || weekStart < createdWeekStart) {
    return false;
  }

  const ranges = habit.archiveRanges || [];

  return !ranges.some(({ start, end }: any) => {
    const from = new Date(start);
    const to = end ? new Date(end) : null;
    return from <= weekStart && (!to || weekStart <= to);
  });
}


export async function fetchHabits(userId: string, week: Date[]) {
  const q = query(collection(db, `users/${userId}/habits`), orderBy('order'));
  const querySnapshot = await getDocs(q);
  const habitsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const weekStart = week[0];
  const filteredHabits = habitsData.filter(habit => isHabitVisible(habit, weekStart));

  const statusMap: Record<string, boolean> = {};
  const completionMap: Record<string, number> = {};

  for (const habit of filteredHabits) {
    const statusQuery = await getDocs(collection(db, `users/${userId}/habits/${habit.id}/habitStatus`));
    const habitStatus = statusQuery.docs.map(doc => ({ date: doc.id, ...doc.data() }));

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

  return { habits: filteredHabits, statusMap, completionMap };
}

export async function toggleStatus(userId: string, habitId: string, date: string, current: boolean, week: Date[]) {
  const key = `${habitId}_${date}`;
  const statusRef = doc(db, `users/${userId}/habits/${habitId}/habitStatus/${date}`);

  if (!current) {
    await setDoc(statusRef, { completed: true });
  } else {
    await setDoc(statusRef, { completed: false });
  }
}

export async function archiveHabit(userId: string, habitId: string) {
  const habitRef = doc(db, `users/${userId}/habits/${habitId}`);
  const snapshot = await getDoc(habitRef);
  const habit = snapshot.data();
  if (!habit) return;

  const archiveRanges = habit.archiveRanges || [];
  const today = startOfWeek(new Date(), { weekStartsOn: 1 });

  archiveRanges.push({ start: today.toISOString(), end: null });

  await updateDoc(habitRef, { archiveRanges });
}

export async function unarchiveHabit(userId: string, habitId: string) {
  const habitRef = doc(db, `users/${userId}/habits/${habitId}`);
  const snapshot = await getDoc(habitRef);
  const habit = snapshot.data();
  if (!habit) return;

  const archiveRanges = habit.archiveRanges || [];
  const today = startOfWeek(new Date(), { weekStartsOn: 1 });

  const updatedRanges = archiveRanges.map((range: any) => {
    if (!range.end) {
      return { ...range, end: today.toISOString() };
    }
    return range;
  });

  await updateDoc(habitRef, { archiveRanges: updatedRanges });
}

// services/habits.ts
export async function getArchivedHabits(userId: string) {
  const snapshot = await getDocs(collection(db, `users/${userId}/habits`));
  const allHabits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const archived = allHabits.filter(h =>
    (h.archiveRanges || []).some((r: any) => !r.end)
  );

  return archived;
}

