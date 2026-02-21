// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCev7d7RurQaI2e5jzP1RkqNXNCNnOTpw4",
  authDomain: "attendance-hvpp.firebaseapp.com",
  projectId: "attendance-hvpp",
  storageBucket: "attendance-hvpp.firebasestorage.app",
  messagingSenderId: "1052095327914",
  appId: "1:1052095327914:web:f6c526dfe3dc9526eaaad3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);