import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyCFe10LK4WNEASzpnGd7X7oklIEwsZs8cI",
  authDomain: "rox-shoppersite.firebaseapp.com",
  projectId: "rox-shoppersite",
  storageBucket: "rox-shoppersite.firebasestorage.app",
  messagingSenderId: "849711979912",
  appId: "1:849711979912:web:6b760a3ec69c88339b6e3d",
  measurementId: "G-EWC656BK97",
};

// Initialize Firebase singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Safe Analytics initialization for Next.js browser execution
export const getClientAnalytics = async () => {
  if (typeof window !== "undefined" && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
};
