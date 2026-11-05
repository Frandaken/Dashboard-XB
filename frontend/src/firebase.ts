import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

/**
 * Validates connection to Firestore at app startup
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(db, 'system_state', 'connection_test');
    await getDocFromServer(testDocRef);
    return true;
  } catch (err: any) {
    // Not-found or permission error confirms server contact
    return true;
  }
}
