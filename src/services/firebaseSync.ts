import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  AnatomyTerm,
  CustomPlate,
  ExamSessionRecord,
  StudentRosterEntry,
} from '../types/anatomy';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        result[k] = stripUndefined(v);
      }
    }
    return result as T;
  }
  return value;
}

// --- Shared State Synchronizers ---

export function syncCustomPlates(
  callback: (plates: CustomPlate[]) => void,
  onError?: (msg: string) => void
) {
  const path = 'plates';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const plates = snapshot.docs.map((d) => d.data() as CustomPlate);
      callback(plates);
    },
    (error) => {
      onError?.(error.message);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function syncCustomTerms(
  callback: (terms: AnatomyTerm[]) => void,
  onError?: (msg: string) => void
) {
  const path = 'customTerms';
  const q = collection(db, path);
  return onSnapshot(
    q,
    (snapshot) => {
      const terms = snapshot.docs.map((d) => d.data() as AnatomyTerm);
      callback(terms);
    },
    (error) => {
      onError?.(error.message);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function syncRoster(
  callback: (roster: StudentRosterEntry[]) => void,
  onError?: (msg: string) => void
) {
  const path = 'roster';
  const q = collection(db, path);
  return onSnapshot(
    q,
    (snapshot) => {
      const roster = snapshot.docs.map((d) => d.data() as StudentRosterEntry);
      callback(roster);
    },
    (error) => {
      onError?.(error.message);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function syncHistory(
  callback: (history: ExamSessionRecord[]) => void,
  onError?: (msg: string) => void
) {
  const path = 'history';
  const q = query(collection(db, path), orderBy('completedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const history = snapshot.docs.map((d) => d.data() as ExamSessionRecord);
      callback(history);
    },
    (error) => {
      onError?.(error.message);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function syncSettings(
  callback: (desc: string) => void,
  onError?: (msg: string) => void
) {
  const path = 'settings/exam';
  return onSnapshot(
    doc(db, 'settings', 'exam'),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data().examDescription || '');
      }
    },
    (error) => {
      onError?.(error.message);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// --- Write Operations ---

export async function savePlateToFirebase(plate: CustomPlate) {
  const path = `plates/${plate.id}`;
  const cleanPlate = stripUndefined({
    ...plate,
    title: plate.title.slice(0, 200),
  });
  try {
    await setDoc(doc(db, 'plates', plate.id), cleanPlate);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePlateFromFirebase(id: string) {
  const path = `plates/${id}`;
  try {
    await deleteDoc(doc(db, 'plates', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTermToFirebase(term: AnatomyTerm) {
  const path = `customTerms/${term.id}`;
  const cleanTerm = stripUndefined({
    ...term,
    termEn: term.termEn.slice(0, 200),
    termTh: term.termTh.slice(0, 200),
    termLatin: term.termLatin ? term.termLatin.slice(0, 200) : undefined,
    isCustom: true,
  });
  try {
    await setDoc(doc(db, 'customTerms', term.id), cleanTerm);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTermFromFirebase(id: string) {
  const path = `customTerms/${id}`;
  try {
    await deleteDoc(doc(db, 'customTerms', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveRosterEntryToFirebase(entry: StudentRosterEntry) {
  const path = `roster/${entry.id}`;
  const cleanEntry = stripUndefined({
    ...entry,
    seatNumber: entry.seatNumber.slice(0, 50),
    studentId: entry.studentId.slice(0, 100),
    studentName: entry.studentName.slice(0, 200),
  });
  try {
    await setDoc(doc(db, 'roster', entry.id), cleanEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteRosterEntryFromFirebase(id: string) {
  const path = `roster/${id}`;
  try {
    await deleteDoc(doc(db, 'roster', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveRosterToFirebase(roster: StudentRosterEntry[]) {
  const path = 'roster';
  try {
    for (let i = 0; i < roster.length; i += 400) {
      const chunk = roster.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const entry of chunk) {
        const cleanEntry = stripUndefined({
          ...entry,
          seatNumber: entry.seatNumber.slice(0, 50),
          studentId: entry.studentId.slice(0, 100),
          studentName: entry.studentName.slice(0, 200),
        });
        batch.set(doc(db, 'roster', entry.id), cleanEntry);
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function clearRosterInFirebase(roster: StudentRosterEntry[]) {
  const path = 'roster';
  try {
    for (let i = 0; i < roster.length; i += 400) {
      const chunk = roster.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const entry of chunk) {
        batch.delete(doc(db, 'roster', entry.id));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSessionToFirebase(session: ExamSessionRecord) {
  const path = `history/${session.id}`;
  const cleanSession = stripUndefined({
    ...session,
    studentName: session.studentName.slice(0, 200),
    studentId: session.studentId.slice(0, 100),
    seatNumber: session.seatNumber ? session.seatNumber.slice(0, 50) : undefined,
  });
  try {
    await setDoc(doc(db, 'history', session.id), cleanSession);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSessionFromFirebase(id: string) {
  const path = `history/${id}`;
  try {
    await deleteDoc(doc(db, 'history', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearHistoryInFirebase(sessions: ExamSessionRecord[]) {
  const path = 'history';
  try {
    for (let i = 0; i < sessions.length; i += 400) {
      const chunk = sessions.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const s of chunk) {
        batch.delete(doc(db, 'history', s.id));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateExamDescriptionInFirebase(desc: string) {
  const path = 'settings/exam';
  try {
    await setDoc(
      doc(db, 'settings', 'exam'),
      {
        examDescription: desc.slice(0, 5000),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
