import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Načti proměnné z prostředí
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Inicializace Firebase
let app;
let auth;

if (typeof window !== 'undefined') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
}

export { auth };