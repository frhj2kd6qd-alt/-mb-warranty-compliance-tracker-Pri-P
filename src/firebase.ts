import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore,
  doc, 
  runTransaction, 
  Firestore,
  getDocFromServer
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import appletConfig from '../firebase-applet-config.json';

// Project Configuration with fallback for apt-impact-501115-d1
export const firebaseConfig = {
  apiKey: appletConfig.apiKey || "AIzaSyD0T4ns7WlUeeR3YgIZTP4VnnLOHP3ZNuk",
  authDomain: appletConfig.authDomain || "apt-impact-501115-d1.firebaseapp.com",
  projectId: appletConfig.projectId || "apt-impact-501115-d1",
  firestoreDatabaseId: appletConfig.firestoreDatabaseId || "ai-studio-remixremixremixr-40f8c76e-37a4-464a-87ee-46056ca4e3f5",
  storageBucket: appletConfig.storageBucket || "apt-impact-501115-d1.firebasestorage.app",
  messagingSenderId: appletConfig.messagingSenderId || "546842962646",
  appId: appletConfig.appId || "1:546842962646:web:7e88d23cb60c1336833777",
  measurementId: appletConfig.measurementId || "G-K5994Q8LRR",
  recaptchaSiteKey: appletConfig.recaptchaSiteKey || ""
};

// Initialize or reuse Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize AppCheck only if a valid recaptchaSiteKey is provided in configuration
export let appCheck: ReturnType<typeof initializeAppCheck> | null = null;
if (firebaseConfig.recaptchaSiteKey && firebaseConfig.recaptchaSiteKey.trim().length > 0) {
  try {
    if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(firebaseConfig.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.warn("AppCheck initialization skipped or failed:", err);
  }
}

// Critical: Initialize Firestore with databaseId and resilient long-polling auto-detection
export const db: Firestore = firebaseConfig.firestoreDatabaseId 
  ? initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    )
  : getFirestore(app);

export const auth = getAuth(app);
export const storage = getStorage(app);
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => yes && (analytics = getAnalytics(app)));
}

// Validate connection to Firestore on initialization
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection check: operating in offline cache mode.");
    }
  }
}
testConnection();

export interface RecordData {
  employeeName?: string;
  category?: string;
  createdAt?: string;
  userId?: string;
  [key: string]: any;
}

export async function addRecordWithStats(
  dbInstance: Firestore, 
  newRecordId: string, 
  newRecordData: RecordData
): Promise<void> {
  const recordRef = doc(dbInstance, "records", newRecordId);
  const statsRef = doc(dbInstance, "stats", "dashboard");

  try {
    await runTransaction(dbInstance, async (transaction) => {
      // 1. READ: Fetch current stats first
      const statsSnapshot = await transaction.get(statsRef);
      let currentCount = 0;
      
      if (statsSnapshot.exists()) {
        currentCount = statsSnapshot.data().totalRecords || 0;
      }

      // 2. CALCULATE: Increment the counter
      const updatedCount = currentCount + 1;

      // 3. WRITE: Commit both writes atomically
      transaction.set(recordRef, newRecordData);
      transaction.set(statsRef, { totalRecords: updatedCount }, { merge: true });
    });
    console.log("Successfully committed record and updated stats.");
  } catch (error) {
    console.error("Transaction failed and was aborted:", error);
    throw error;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errStr = error instanceof Error ? error.message : String(error);

  // Gracefully handle network offline/unavailability issues without breaking the app flow
  if (
    errStr.toLowerCase().includes("unavailable") || 
    errStr.toLowerCase().includes("could not reach cloud firestore") || 
    errStr.toLowerCase().includes("offline") ||
    errStr.toLowerCase().includes("connection failed")
  ) {
    console.warn(`[Firestore Offline Notice] Operation: ${operationType} on path: ${path}. Operating in offline cache mode.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
