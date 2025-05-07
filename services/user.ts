import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export async function getUserCreationDate(userId: string) {
    const ref = doc(db, `users/${userId}`);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) return null;

    const data = snap.data();
    return data.createdAt?.toDate() // Converts Firestore Timestamp to JS Date
}
  