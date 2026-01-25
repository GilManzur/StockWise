import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDIu2yRapA6J1WrBHVtciBouBhrEDGb4Mw",
  authDomain: "stockwise-23868.firebaseapp.com",
  databaseURL: "https://stockwise-23868-default-rtdb.firebaseio.com",
  projectId: "stockwise-23868",
  storageBucket: "stockwise-23868.firebasestorage.app",
  messagingSenderId: "1064015174406",
  appId: "1:1064015174406:web:fd4a2740ed0904c6141c87"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const firestore = getFirestore(app);

export { createUserWithEmailAndPassword, doc, setDoc, getDoc, collection, addDoc, updateDoc, arrayUnion };
export default app;
