// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';

// import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBMpjgT0tz4Yga_ItS9nYkykU8CzxjLVek",
  authDomain: "habits-f120d.firebaseapp.com",
  projectId: "habits-f120d",
  storageBucket: "habits-f120d.appspot.com", // FIXED: should be firebaseapp.com
  messagingSenderId: "313975540430",
  appId: "1:313975540430:web:83edfc85bdca6b07085e9f",
  measurementId: "G-5ETM9QTPSL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional: only works in browser, not needed in React Native
// const analytics = getAnalytics(app);
