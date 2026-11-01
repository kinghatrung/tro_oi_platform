import { getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Firebase Auth client, hoặc null khi chưa cấu hình env (dùng dev-login). */
export function getFirebaseAuth(): Auth | null {
  if (!firebaseConfig.apiKey) return null;
  const auth = getAuth(getApps()[0] ?? initializeApp(firebaseConfig));
  auth.languageCode = 'vi';
  return auth;
}
