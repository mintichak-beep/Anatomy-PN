import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  AnatomyTerm,
  CustomPlate,
  ExamSessionRecord,
  StudentRosterEntry,
} from '../types/anatomy';

// --- Shared State Synchronizers ---

export function syncCustomPlates(callback: (plates: CustomPlate[]) => void) {
  const q = query(collection(db, 'plates'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const plates = snapshot.docs.map((d) => d.data() as CustomPlate);
    callback(plates);
  });
}

export function syncCustomTerms(callback: (terms: AnatomyTerm[]) => void) {
  const q = collection(db, 'customTerms');
  return onSnapshot(q, (snapshot) => {
    const terms = snapshot.docs.map((d) => d.data() as AnatomyTerm);
    callback(terms);
  });
}

export function syncRoster(callback: (roster: StudentRosterEntry[]) => void) {
  const q = collection(db, 'roster');
  return onSnapshot(q, (snapshot) => {
    const roster = snapshot.docs.map((d) => d.data() as StudentRosterEntry);
    callback(roster);
  });
}

export function syncHistory(callback: (history: ExamSessionRecord[]) => void) {
  const q = query(collection(db, 'history'), orderBy('completedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map((d) => d.data() as ExamSessionRecord);
    callback(history);
  });
}

export function syncSettings(callback: (desc: string) => void) {
  return onSnapshot(doc(db, 'settings', 'exam'), (doc) => {
    if (doc.exists()) {
      callback(doc.data().examDescription || '');
    }
  });
}

// --- Write Operations ---

export async function savePlateToFirebase(plate: CustomPlate) {
  await setDoc(doc(db, 'plates', plate.id), plate);
}

export async function deletePlateFromFirebase(id: string) {
  await deleteDoc(doc(db, 'plates', id));
}

export async function saveTermToFirebase(term: AnatomyTerm) {
  await setDoc(doc(db, 'customTerms', term.id), term);
}

export async function deleteTermFromFirebase(id: string) {
  await deleteDoc(doc(db, 'customTerms', id));
}

export async function saveRosterEntryToFirebase(entry: StudentRosterEntry) {
  await setDoc(doc(db, 'roster', entry.id), entry);
}

export async function deleteRosterEntryFromFirebase(id: string) {
  await deleteDoc(doc(db, 'roster', id));
}

export async function saveRosterToFirebase(roster: StudentRosterEntry[]) {
  // Batch roster update or individual? For simplicity with current code, we replace/update.
  for (const entry of roster) {
    await setDoc(doc(db, 'roster', entry.id), entry);
  }
}

export async function clearRosterInFirebase(roster: StudentRosterEntry[]) {
  for (const entry of roster) {
    await deleteDoc(doc(db, 'roster', entry.id));
  }
}

export async function saveSessionToFirebase(session: ExamSessionRecord) {
  await setDoc(doc(db, 'history', session.id), session);
}

export async function deleteSessionFromFirebase(id: string) {
  await deleteDoc(doc(db, 'history', id));
}

export async function clearHistoryInFirebase(sessions: ExamSessionRecord[]) {
  for (const s of sessions) {
    await deleteDoc(doc(db, 'history', s.id));
  }
}

export async function updateExamDescriptionInFirebase(desc: string) {
  await setDoc(doc(db, 'settings', 'exam'), {
    examDescription: desc,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
