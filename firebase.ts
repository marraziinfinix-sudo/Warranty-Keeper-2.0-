
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAaFCL5c0G7IctNFGOMjMJDoxl_7q4iIXA",
  authDomain: "gen-lang-client-0518963012.firebaseapp.com",
  projectId: "gen-lang-client-0518963012",
  storageBucket: "gen-lang-client-0518963012.firebasestorage.app",
  messagingSenderId: "745320669074",
  appId: "1:745320669074:web:16f47417b5ae3b33f12b4b",
  measurementId: "G-3RN8N5WRP4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
// This allows the app to work offline and syncs changes in the background when connection is restored
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      console.log("Persistence failed: Multiple tabs open");
  } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
       console.log("Persistence failed: Not supported");
  }
});
