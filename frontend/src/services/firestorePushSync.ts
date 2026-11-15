import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { NotificationPreferences } from '../hooks/usePushNotifications';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

function logFirestorePermissionError(error: unknown, operationType: OperationType, path: string | null) {
  const msg = error instanceof Error ? error.message : String(error);
  if (/permission|insufficient/i.test(msg)) {
    console.warn(
      'Firestore Error: ',
      JSON.stringify({
        error: msg,
        operationType,
        path,
        authInfo: { userId: null }
      })
    );
  } else {
    console.warn('Firestore notice:', msg);
  }
}

function getSubscriptionDocId(endpoint: string): string {
  try {
    const b64 = btoa(endpoint).replace(/[^a-zA-Z0-9_-]/g, '_');
    return 'sub_' + b64.slice(-60);
  } catch {
    return 'sub_' + Math.abs(hashCode(endpoint));
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Persists and backs up Web Push subscription to Cloud Firestore.
 */
export async function syncSubscriptionToFirestore(
  sub: PushSubscription,
  preferences: NotificationPreferences
): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  let path = 'push_subscriptions';
  try {
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys || !json.keys.p256dh || !json.keys.auth) {
      return;
    }

    const docId = getSubscriptionDocId(json.endpoint);
    path = `push_subscriptions/${docId}`;
    const docRef = doc(db, 'push_subscriptions', docId);

    await setDoc(
      docRef,
      {
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth
        },
        preferences,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err: unknown) {
    logFirestorePermissionError(err, OperationType.WRITE, path);
  }
}

/**
 * Removes subscription document from Cloud Firestore when unsubscribed.
 */
export async function removeSubscriptionFromFirestore(endpoint: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  const docId = getSubscriptionDocId(endpoint);
  const path = `push_subscriptions/${docId}`;
  try {
    const docRef = doc(db, 'push_subscriptions', docId);
    await deleteDoc(docRef);
  } catch (err: unknown) {
    logFirestorePermissionError(err, OperationType.DELETE, path);
  }
}
