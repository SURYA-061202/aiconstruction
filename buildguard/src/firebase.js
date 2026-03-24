import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBXqKv3i9ZFdwLbQgOU6V3xUi_rFvadk34",
    authDomain: "rckengine.firebaseapp.com",
    projectId: "rckengine",
    storageBucket: "rckengine.firebasestorage.app",
    messagingSenderId: "1074732380498",
    appId: "1:1074732380498:web:ae1d5df2e408be60e88a8b",
    measurementId: "G-EXS9H31D3D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
