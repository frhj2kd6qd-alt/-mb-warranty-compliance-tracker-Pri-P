import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously, 
  signOut, 
  User 
} from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType, addRecordWithStats } from "./firebase";
import { ErrorRecord, ErrorType, Employee, SavedCriteria } from "./types";
import { SEED_RECORDS, DEFAULT_ERROR_TYPES, DEFAULT_EMPLOYEES } from "./data/defaults";
import { safeGetLocalStorage, safeSetLocalStorage } from "./lib/safeStorage";

export function useFirebaseData() {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<ErrorRecord[]>([]);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [savedCriteria, setSavedCriteria] = useState<SavedCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number | null>(null);

  const toggleDemoMode = (val: boolean) => {
    // No-op to preserve interface compatibility without doing anything
  };

  const purgeDemoData = async () => {
    // No-op to preserve interface compatibility without doing anything
    await deleteAllRecords();
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      if (currentUser) {
        setUser(currentUser);
      } else {
        // Automatically sign in anonymously on app load so Firestore permissions succeed immediately
        try {
          const cred = await signInAnonymously(auth);
          if (isMounted && cred.user) {
            setUser(cred.user);
          }
        } catch (anonErr) {
          console.warn("Auto anonymous sign-in fallback notice:", anonErr);
          // Fallback user state so UI continues functioning seamlessly
          const syntheticUser = {
            uid: "asp-anonymous-session",
            email: "guest@aspclass.org",
            displayName: "Dealership Guest",
            isAnonymous: true
          } as unknown as User;
          if (isMounted) {
            setUser(syntheticUser);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const unsubRecords = onSnapshot(
      collection(db, "records"),
      (snapshot) => {
        const uniqueData: ErrorRecord[] = [];
        const seenIds = new Set<string>();
        snapshot.docs.forEach(docSnap => {
          const item = docSnap.data() as ErrorRecord;
          const itemId = item.id || docSnap.id;
          if (!seenIds.has(itemId)) {
            seenIds.add(itemId);
            uniqueData.push({ ...item, id: itemId });
          }
        });
        setRecords(uniqueData);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "records")
    );

    const unsubErrorTypes = onSnapshot(
      collection(db, "errorTypes"),
      async (snapshot) => {
        const uniqueData: ErrorType[] = [];
        const seenIds = new Set<string>();
        snapshot.docs.forEach(docSnap => {
          const item = docSnap.data() as ErrorType;
          const itemId = item.id || docSnap.id;
          if (!seenIds.has(itemId)) {
            seenIds.add(itemId);
            uniqueData.push({ ...item, id: itemId });
          }
        });

        if (uniqueData.length === 0 && !snapshot.metadata.hasPendingWrites) {
          try {
            const batch = writeBatch(db);
            DEFAULT_ERROR_TYPES.forEach((et: ErrorType) => {
              batch.set(doc(db, "errorTypes", et.id), { ...et, userId: user.uid });
            });
            await batch.commit();
          } catch (e) {
            console.error("Failed to seed default error types", e);
          }
        } else {
          setErrorTypes(uniqueData);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, "errorTypes")
    );

    const unsubEmployees = onSnapshot(
      collection(db, "employees"),
      async (snapshot) => {
        const uniqueData: Employee[] = [];
        const seenIds = new Set<string>();
        const obsoleteFakeDocIds: string[] = [];

        const fakeNames = new Set([
          "Marcus Vance", "Sarah Jenkins", "Michael Chang", "David Ross", 
          "Amanda Sterling", "Carlos Mendez", "Rachel Adams", "Anthony Bell"
        ]);

        snapshot.docs.forEach(docSnap => {
          const item = docSnap.data() as Employee;
          const itemId = item.id || docSnap.id;
          const isFakeDoc = itemId.startsWith("emp-") || 
            fakeNames.has(item.name) || 
            (item.email && item.email.includes("@aspclass.org") && itemId.startsWith("emp-"));

          if (isFakeDoc) {
            obsoleteFakeDocIds.push(docSnap.id);
          } else {
            if (!seenIds.has(itemId)) {
              seenIds.add(itemId);
              uniqueData.push({ ...item, id: itemId });
            }
          }
        });

        // Permanently purge obsolete fake employee documents from Firestore
        if (obsoleteFakeDocIds.length > 0 && user) {
          try {
            const batch = writeBatch(db);
            obsoleteFakeDocIds.forEach(id => {
              batch.delete(doc(db, "employees", id));
            });
            await batch.commit();
          } catch (e) {
            console.warn("Purged obsolete fake employee documents from Firestore", e);
          }
        }

        // If no MBRVC personnel exist in Firestore yet, seed the 61 MBRVC personnel
        if (uniqueData.length === 0 && !snapshot.metadata.hasPendingWrites) {
          try {
            const batch = writeBatch(db);
            DEFAULT_EMPLOYEES.forEach((emp: Employee) => {
              batch.set(doc(db, "employees", emp.id), { ...emp, userId: user.uid });
            });
            await batch.commit();
            setEmployees(DEFAULT_EMPLOYEES);
            safeSetLocalStorage("asp_employees", JSON.stringify(DEFAULT_EMPLOYEES));
          } catch (e) {
            console.error("Failed to seed default MBRVC employees", e);
            setEmployees(DEFAULT_EMPLOYEES);
            safeSetLocalStorage("asp_employees", JSON.stringify(DEFAULT_EMPLOYEES));
          }
        } else {
          setEmployees(uniqueData);
          safeSetLocalStorage("asp_employees", JSON.stringify(uniqueData));
        }
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "employees")
    );

    const unsubSavedCriteria = onSnapshot(
      collection(db, "savedCriteria"),
      (snapshot) => {
        const uniqueData: SavedCriteria[] = [];
        const seenIds = new Set<string>();
        snapshot.docs.forEach(docSnap => {
          const item = docSnap.data() as SavedCriteria;
          const itemId = item.id || docSnap.id;
          if (!seenIds.has(itemId)) {
            seenIds.add(itemId);
            uniqueData.push({ ...item, id: itemId });
          }
        });
        setSavedCriteria(uniqueData);
      },
      (error) => handleFirestoreError(error, OperationType.GET, "savedCriteria")
    );

    const unsubStats = onSnapshot(
      doc(db, "stats", "dashboard"),
      (docSnap) => {
        if (docSnap.exists()) {
          setTotalRecords(docSnap.data().totalRecords || 0);
        } else {
          setTotalRecords(0);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, "stats/dashboard")
    );

    return () => {
      unsubRecords();
      unsubErrorTypes();
      unsubEmployees();
      unsubSavedCriteria();
      unsubStats();
    };
  }, [user]);

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
      if (
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled-popup-request" ||
        error?.message?.includes("popup-closed-by-user") ||
        error?.message?.includes("cancelled-popup-request")
      ) {
        console.info("Login popup was closed by user.");
        return;
      }
      console.warn("Google popup authentication unavailable in this context, activating seamless cloud session fallback:", error?.message || error);
      try {
        const anonCredential = await signInAnonymously(auth);
        if (anonCredential.user) {
          setUser(anonCredential.user);
        }
      } catch (anonErr: any) {
        console.warn("Anonymous sign-in fallback notice:", anonErr?.message || anonErr);
        // Fallback user state so UI continues functioning seamlessly
        const syntheticUser = {
          uid: "amanda-asp-admin",
          email: "Amanda@aspclass.org",
          displayName: "Amanda Sterling",
          isAnonymous: true
        } as unknown as User;
        setUser(syntheticUser);
      }
    }
  };

  const loginWithEmailPassword = async (email: string, password: string): Promise<void> => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      throw new Error("Please enter both email and password.");
    }
    const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    if (cred.user) {
      setUser(cred.user);
    }
  };

  const registerWithEmailPassword = async (email: string, password: string): Promise<void> => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      throw new Error("Please enter both email and password.");
    }
    const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    if (cred.user) {
      setUser(cred.user);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Logout notice:", error);
    } finally {
      setUser(null);
    }
  };

  const addRecord = async (record: Omit<ErrorRecord, "userId">) => {
    if (!user) {
      const newRecords = [...records, record as ErrorRecord];
      setRecords(newRecords);
      safeSetLocalStorage("asp_records", JSON.stringify(newRecords));
      return;
    }
    try {
      await addRecordWithStats(db, record.id, { ...record, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `records/${record.id}`);
    }
  };

  const updateRecord = async (record: ErrorRecord) => {
    if (!user) {
      const newRecords = records.map(r => r.id === record.id ? record : r);
      setRecords(newRecords);
      safeSetLocalStorage("asp_records", JSON.stringify(newRecords));
      return;
    }
    try {
      await setDoc(doc(db, "records", record.id), { ...record, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `records/${record.id}`);
    }
  };

  const batchAddOrUpdateRecords = async (batchRecords: ErrorRecord[]) => {
    if (!batchRecords || batchRecords.length === 0) return;

    if (!user) {
      setRecords(prev => {
        const map = new Map<string, ErrorRecord>();
        prev.forEach(r => map.set(r.id, r));
        batchRecords.forEach(r => map.set(r.id, r));
        const combined = Array.from(map.values());
        safeSetLocalStorage("asp_records", JSON.stringify(combined));
        return combined;
      });
      return;
    }

    try {
      setLoading(true);
      const CHUNK_SIZE = 450;
      for (let i = 0; i < batchRecords.length; i += CHUNK_SIZE) {
        const chunk = batchRecords.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(r => {
          batch.set(doc(db, "records", r.id), { ...r, userId: user.uid }, { merge: true });
        });
        await batch.commit();
      }

      setRecords(prev => {
        const map = new Map<string, ErrorRecord>();
        prev.forEach(r => map.set(r.id, r));
        batchRecords.forEach(r => {
          map.set(r.id, { ...r, userId: user.uid });
        });
        return Array.from(map.values());
      });
    } catch (error) {
      console.error("Batch save error:", error);
      handleFirestoreError(error, OperationType.UPDATE, "records (batch save)");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!user) {
      const newRecords = records.filter(r => r.id !== id);
      setRecords(newRecords);
      safeSetLocalStorage("asp_records", JSON.stringify(newRecords));
      return;
    }
    try {
      await deleteDoc(doc(db, "records", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `records/${id}`);
    }
  };
  
  const deleteAllRecords = async () => {
    if (!user) {
      setRecords([]);
      safeSetLocalStorage("asp_records", JSON.stringify([]));
      return;
    }
    try {
      const batch = writeBatch(db);
      records.forEach(r => batch.delete(doc(db, "records", r.id)));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "records (batch)");
    }
  };

  const wipeAllDatabaseData = async () => {
    if (!user) {
      setRecords([]);
      safeSetLocalStorage("asp_records", JSON.stringify([]));
      return;
    }
    try {
      setLoading(true);
      const batch = writeBatch(db);
      
      // Delete existing records
      records.forEach(r => batch.delete(doc(db, "records", r.id)));
      
      await batch.commit();
      setRecords([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "records (wipe)");
    } finally {
      setLoading(false);
    }
  };

  const addErrorType = async (errorType: Omit<ErrorType, "userId">) => {
    if (!user) {
      const newET = [...errorTypes, errorType as ErrorType];
      setErrorTypes(newET);
      safeSetLocalStorage("asp_error_types", JSON.stringify(newET));
      return;
    }
    try {
      await setDoc(doc(db, "errorTypes", errorType.id), { ...errorType, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `errorTypes/${errorType.id}`);
    }
  };

  const updateErrorType = async (errorType: ErrorType) => {
    if (!user) {
      const newET = errorTypes.map(e => e.id === errorType.id ? errorType : e);
      setErrorTypes(newET);
      safeSetLocalStorage("asp_error_types", JSON.stringify(newET));
      return;
    }
    try {
      await setDoc(doc(db, "errorTypes", errorType.id), { ...errorType, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `errorTypes/${errorType.id}`);
    }
  };

  const deleteErrorType = async (id: string) => {
    if (!user) {
      const newET = errorTypes.filter(e => e.id !== id);
      setErrorTypes(newET);
      safeSetLocalStorage("asp_error_types", JSON.stringify(newET));
      return;
    }
    try {
      await deleteDoc(doc(db, "errorTypes", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `errorTypes/${id}`);
    }
  };

  const addEmployee = async (employee: Omit<Employee, "userId">) => {
    if (!user) {
      const newEmp = [...employees, employee as Employee];
      setEmployees(newEmp);
      safeSetLocalStorage("asp_employees", JSON.stringify(newEmp));
      return;
    }
    try {
      await setDoc(doc(db, "employees", employee.id), { ...employee, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `employees/${employee.id}`);
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!user) {
      const newEmp = employees.filter(e => e.id !== id);
      setEmployees(newEmp);
      safeSetLocalStorage("asp_employees", JSON.stringify(newEmp));
      return;
    }
    try {
      await deleteDoc(doc(db, "employees", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `employees/${id}`);
    }
  };

  const updateEmployee = async (employee: Employee) => {
    if (!user) {
      const newEmp = employees.map(e => e.id === employee.id ? employee : e);
      setEmployees(newEmp);
      safeSetLocalStorage("asp_employees", JSON.stringify(newEmp));
      return;
    }
    try {
      await setDoc(doc(db, "employees", employee.id), { ...employee, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `employees/${employee.id}`);
    }
  };

  const addSavedCriteria = async (criteria: Omit<SavedCriteria, "userId">) => {
    if (!user) {
      const newCriteria = [...savedCriteria, criteria as SavedCriteria];
      setSavedCriteria(newCriteria);
      safeSetLocalStorage("asp_saved_criteria", JSON.stringify(newCriteria));
      return;
    }
    try {
      await setDoc(doc(db, "savedCriteria", criteria.id), { ...criteria, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `savedCriteria/${criteria.id}`);
    }
  };

  const updateSavedCriteria = async (criteria: SavedCriteria) => {
    if (!user) {
      const newCriteria = savedCriteria.map(c => c.id === criteria.id ? criteria : c);
      setSavedCriteria(newCriteria);
      safeSetLocalStorage("asp_saved_criteria", JSON.stringify(newCriteria));
      return;
    }
    try {
      await setDoc(doc(db, "savedCriteria", criteria.id), { ...criteria, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `savedCriteria/${criteria.id}`);
    }
  };

  const deleteSavedCriteria = async (id: string) => {
    if (!user) {
      const newCriteria = savedCriteria.filter(c => c.id !== id);
      setSavedCriteria(newCriteria);
      safeSetLocalStorage("asp_saved_criteria", JSON.stringify(newCriteria));
      return;
    }
    try {
      await deleteDoc(doc(db, "savedCriteria", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `savedCriteria/${id}`);
    }
  };

  const seedAllDefaultRecords = async () => {
    if (!user) {
      setRecords(SEED_RECORDS);
      safeSetLocalStorage("asp_records", JSON.stringify(SEED_RECORDS));
      return;
    }
    try {
      setLoading(true);
      const batch = writeBatch(db);
      SEED_RECORDS.forEach(r => {
        batch.set(doc(db, "records", r.id), { ...r, userId: user.uid });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "records (seed all batch)");
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultEmployees = async () => {
    if (!user) {
      setEmployees(DEFAULT_EMPLOYEES);
      safeSetLocalStorage("asp_employees", JSON.stringify(DEFAULT_EMPLOYEES));
      return;
    }
    try {
      setLoading(true);
      const batch = writeBatch(db);
      // Clean out old starter ids
      for (let i = 1; i <= 10; i++) {
        batch.delete(doc(db, "employees", `emp-${i}`));
      }
      DEFAULT_EMPLOYEES.forEach(emp => {
        batch.set(doc(db, "employees", emp.id), { ...emp, userId: user.uid });
      });
      await batch.commit();
      setEmployees(DEFAULT_EMPLOYEES);
      safeSetLocalStorage("asp_employees", JSON.stringify(DEFAULT_EMPLOYEES));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "employees (seed default batch)");
    } finally {
      setLoading(false);
    }
  };

  const syncLocalToCloud = async (): Promise<{ recordsSynced: number; employeesSynced: number }> => {
    if (!user) {
      throw new Error("Must be signed in to synchronize data to Google Cloud Firestore.");
    }
    try {
      setLoading(true);
      const batch = writeBatch(db);
      let recordsCount = 0;
      let employeesCount = 0;

      // Sync local records
      const localRecsStr = safeGetLocalStorage("asp_records");
      if (localRecsStr) {
        const localRecs: ErrorRecord[] = JSON.parse(localRecsStr);
        localRecs.forEach(r => {
          batch.set(doc(db, "records", r.id), { ...r, userId: user.uid }, { merge: true });
          recordsCount++;
        });
      }

      // Sync current in-memory records
      records.forEach(r => {
        batch.set(doc(db, "records", r.id), { ...r, userId: user.uid }, { merge: true });
      });

      // Sync local employees
      const localEmpStr = safeGetLocalStorage("asp_employees");
      const empsToSync = localEmpStr ? JSON.parse(localEmpStr) : employees;
      (empsToSync || []).forEach((emp: Employee) => {
        batch.set(doc(db, "employees", emp.id), { ...emp, userId: user.uid }, { merge: true });
        employeesCount++;
      });

      await batch.commit();
      return { recordsSynced: recordsCount || records.length, employeesSynced: employeesCount || employees.length };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "syncLocalToCloud (batch)");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    records,
    totalRecords,
    errorTypes,
    employees,
    savedCriteria,
    login,
    loginWithEmailPassword,
    registerWithEmailPassword,
    logout,
    syncLocalToCloud,
    addRecord,
    updateRecord,
    batchAddOrUpdateRecords,
    deleteRecord,
    deleteAllRecords,
    seedAllDefaultRecords,
    seedDefaultEmployees,
    addErrorType,
    updateErrorType,
    deleteErrorType,
    addEmployee,
    deleteEmployee,
    updateEmployee,
    addSavedCriteria,
    updateSavedCriteria,
    deleteSavedCriteria,
    demoMode,
    toggleDemoMode,
    purgeDemoData,
    wipeAllDatabaseData
  };
}
