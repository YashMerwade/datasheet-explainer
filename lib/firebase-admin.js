import admin from 'firebase-admin';

if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (privateKey) {
    // Strip wrapping double quotes if pasted directly from .env.local into Vercel Dashboard
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

export const db = admin.firestore();
export default admin;
