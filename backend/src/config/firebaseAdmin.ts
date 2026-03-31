import admin from 'firebase-admin';

const firebaseProjectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  'gen-lang-client-0821473873';

const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const hasServiceAccount = Boolean(firebaseClientEmail && firebasePrivateKey);

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseProjectId,
    credential: hasServiceAccount
      ? admin.credential.cert({
          projectId: firebaseProjectId,
          clientEmail: firebaseClientEmail!,
          privateKey: firebasePrivateKey!,
        })
      : admin.credential.applicationDefault(),
  });
}

export default admin;
