
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWHbrZ3qkdB_RYsTlqHM-P1YACTaY_Igo",
  authDomain: "finalamgapp.firebaseapp.com",
  projectId: "finalamgapp",
  storageBucket: "finalamgapp.appspot.com",
  messagingSenderId: "847389384820",
  appId: "1:847389384820:web:ccc74be0b0796c5603b121"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
