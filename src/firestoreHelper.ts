import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch,
  DocumentReference,
  DocumentData,
  Unsubscribe
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { ErrorRecord } from "./types";

const RECORDS_COLLECTION = "records";

/**
 * Adds a new record to the Firestore 'records' collection.
 * Supports both simple (userId, employeeName) and full ErrorRecord data.
 * 
 * @param userId - Unique identifier of the user creating the record
 * @param recordOrEmployee - Employee name string OR partial record object
 * @returns DocumentReference of the created Firestore record document
 */
export async function addRecord(
  userId: string, 
  recordOrEmployee: string | Partial<ErrorRecord>
): Promise<DocumentReference<DocumentData>> {
  const path = RECORDS_COLLECTION;
  try {
    let payload: Record<string, any>;

    if (typeof recordOrEmployee === "string") {
      payload = {
        userId,
        employeeName: recordOrEmployee,
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };
    } else {
      payload = {
        ...recordOrEmployee,
        userId,
        createdAt: recordOrEmployee.createdAt || new Date().toISOString(),
      };
    }

    const docRef = await addDoc(collection(db, path), payload);
    return docRef;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Creates or overwrites a record with a specific ID.
 */
export async function setRecord(record: ErrorRecord): Promise<void> {
  const path = `${RECORDS_COLLECTION}/${record.id}`;
  try {
    const docRef = doc(db, RECORDS_COLLECTION, record.id);
    await setDoc(docRef, record, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Retrieves all records belonging to a specific user.
 * 
 * @param userId - User UID to filter records
 * @returns Array of type-safe ErrorRecord objects
 */
export async function getUserRecords(userId: string): Promise<ErrorRecord[]> {
  const path = RECORDS_COLLECTION;
  try {
    const q = query(collection(db, path), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as ErrorRecord;
      return {
        ...data,
        id: data.id || docSnap.id,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}

/**
 * Retrieves all records from the 'records' collection.
 */
export async function getAllRecords(): Promise<ErrorRecord[]> {
  const path = RECORDS_COLLECTION;
  try {
    const querySnapshot = await getDocs(collection(db, path));
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as ErrorRecord;
      return {
        ...data,
        id: data.id || docSnap.id,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}

/**
 * Fetches a single record by its document ID.
 */
export async function getRecordById(recordId: string): Promise<ErrorRecord | null> {
  const path = `${RECORDS_COLLECTION}/${recordId}`;
  try {
    const docSnap = await getDoc(doc(db, RECORDS_COLLECTION, recordId));
    if (docSnap.exists()) {
      const data = docSnap.data() as ErrorRecord;
      return {
        ...data,
        id: data.id || docSnap.id,
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
}

/**
 * Updates an existing record by document ID.
 */
export async function updateRecord(recordId: string, updates: Partial<ErrorRecord>): Promise<void> {
  const path = `${RECORDS_COLLECTION}/${recordId}`;
  try {
    const docRef = doc(db, RECORDS_COLLECTION, recordId);
    await updateDoc(docRef, updates as DocumentData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Deletes a record by document ID.
 */
export async function deleteRecord(recordId: string): Promise<void> {
  const path = `${RECORDS_COLLECTION}/${recordId}`;
  try {
    const docRef = doc(db, RECORDS_COLLECTION, recordId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Subscribes to real-time updates for a user's records.
 */
export function subscribeToUserRecords(
  userId: string,
  onUpdate: (records: ErrorRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const path = RECORDS_COLLECTION;
  const q = query(collection(db, path), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: ErrorRecord[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as ErrorRecord;
        return {
          ...data,
          id: data.id || docSnap.id,
        };
      });
      onUpdate(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error as Error);
    }
  );
}

/**
 * Batch saves multiple records in atomic chunks.
 */
export async function batchSaveRecords(records: ErrorRecord[], userId?: string): Promise<void> {
  if (!records || records.length === 0) return;
  const path = `${RECORDS_COLLECTION} (batch)`;
  
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      
      chunk.forEach(record => {
        const docRef = doc(db, RECORDS_COLLECTION, record.id);
        const dataToSave = userId ? { ...record, userId } : record;
        batch.set(docRef, dataToSave, { merge: true });
      });

      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}
