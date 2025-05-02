// services/addHabit.ts
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export async function addHabit(name: string, frequency: number) {
  const userId = 'wLOSk2y7kPMpQxVWCbZ2'; // Replace with auth.currentUser.uid when auth is added
  const habitsRef = collection(db, `users/${userId}/habits`);

  await addDoc(habitsRef, {
    habitName: name,
    frequency,
    order: 0,
    createdAt: serverTimestamp()
  });
}
