import { cert, getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const app = !getApps().length ? initializeApp({
  credential: cert({
    projectId: process.env.GOOGLE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
}) : getApp();

const db = getFirestore(app);
const adminAuth = getAuth(app);

export { db, adminAuth };
