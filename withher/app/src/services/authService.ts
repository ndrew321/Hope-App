import {
  initializeApp,
  getApps,
  getApp,
  FirebaseApp,
} from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import type { FirebaseUser } from '../types';
import { tokenStorage } from './tokenStorage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

let firebaseApp: FirebaseApp;
const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

let firebaseAuth: Auth | null = null;

if (hasFirebaseConfig) {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  firebaseAuth = getAuth(firebaseApp);
} else {
  // Allows app shell to render in local/dev environments without Firebase env vars.
  console.warn('Firebase config is missing. Auth actions are disabled until EXPO_PUBLIC_FIREBASE_* values are set.');
}

function ensureFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not configured. Set EXPO_PUBLIC_FIREBASE_* environment variables.');
  }
  return firebaseAuth;
}

function mapFirebaseUser(user: User): FirebaseUser {
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export const authService = {
  async registerWithEmail(
    email: string,
    password: string,
  ): Promise<{ firebaseUser: FirebaseUser; idToken: string }> {
    const auth = ensureFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(credential.user);
    const idToken = await credential.user.getIdToken();
    await tokenStorage.set(idToken);
    return { firebaseUser: mapFirebaseUser(credential.user), idToken };
  },

  async signInWithEmail(
    email: string,
    password: string,
  ): Promise<{ firebaseUser: FirebaseUser; idToken: string }> {
    const auth = ensureFirebaseAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();
    await tokenStorage.set(idToken);
    return { firebaseUser: mapFirebaseUser(credential.user), idToken };
  },

  async signOut(): Promise<void> {
    if (!firebaseAuth) {
      await tokenStorage.remove();
      return;
    }
    await firebaseSignOut(firebaseAuth);
    await tokenStorage.remove();
  },

  async getIdToken(forceRefresh = false): Promise<string | undefined> {
    if (!firebaseAuth) return undefined;
    const user = firebaseAuth.currentUser;
    if (!user) return undefined;
    const token = await user.getIdToken(forceRefresh);
    await tokenStorage.set(token);
    return token;
  },

  async sendPasswordReset(email: string): Promise<void> {
    const auth = ensureFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
  },

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    if (!firebaseAuth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(firebaseAuth, (user) => {
      callback(user ? mapFirebaseUser(user) : null);
    });
  },

  getCurrentUser(): FirebaseUser | null {
    if (!firebaseAuth) return null;
    const user = firebaseAuth.currentUser;
    return user ? mapFirebaseUser(user) : null;
  },
};
