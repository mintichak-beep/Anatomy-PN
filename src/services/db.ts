import { BackupPayload } from '../types/blueprint';

const DB_NAME = 'OralExamManagementDB';
const DB_VERSION = 1;

export const STORE_NAMES = [
  'students',
  'exams',
  'examCandidates',
  'questionSets',
  'questions',
  'rubricTemplates',
  'assessments',
  'questionAttempts',
  'auditLogs',
  'appSettings',
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('students')) {
        const s = db.createObjectStore('students', { keyPath: 'id' });
        s.createIndex('normalizedStudentCode', 'normalizedStudentCode', { unique: true });
      }
      if (!db.objectStoreNames.contains('exams')) {
        db.createObjectStore('exams', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('examCandidates')) {
        const c = db.createObjectStore('examCandidates', { keyPath: 'id' });
        c.createIndex('examId', 'examId', { unique: false });
        c.createIndex('studentId', 'studentId', { unique: false });
      }
      if (!db.objectStoreNames.contains('questionSets')) {
        const qs = db.createObjectStore('questionSets', { keyPath: 'id' });
        qs.createIndex('examId', 'examId', { unique: false });
      }
      if (!db.objectStoreNames.contains('questions')) {
        const q = db.createObjectStore('questions', { keyPath: 'id' });
        q.createIndex('questionSetId', 'questionSetId', { unique: false });
      }
      if (!db.objectStoreNames.contains('rubricTemplates')) {
        db.createObjectStore('rubricTemplates', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('assessments')) {
        const a = db.createObjectStore('assessments', { keyPath: 'id' });
        a.createIndex('examId', 'examId', { unique: false });
        a.createIndex('examCandidateId', 'examCandidateId', { unique: true });
      }
      if (!db.objectStoreNames.contains('questionAttempts')) {
        const qa = db.createObjectStore('questionAttempts', { keyPath: 'id' });
        qa.createIndex('examCandidateId', 'examCandidateId', { unique: false });
      }
      if (!db.objectStoreNames.contains('auditLogs')) {
        db.createObjectStore('auditLogs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('appSettings')) {
        db.createObjectStore('appSettings', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });

  return dbPromise;
}

function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed'));
  });
}

function promisifyTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

export async function getAllRecords<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const result = await promisifyRequest(store.getAll());
  return result as T[];
}

export async function getRecordById<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const result = await promisifyRequest(store.get(id));
  return result as T | undefined;
}

export async function putRecord<T>(storeName: StoreName, record: T): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).put(record);
  await promisifyTransaction(tx);
}

export async function putManyRecords<T>(storeName: StoreName, records: T[]): Promise<void> {
  if (records.length === 0) return;
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const r of records) {
    store.put(r);
  }
  await promisifyTransaction(tx);
}

export async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(id);
  await promisifyTransaction(tx);
}

export async function exportAllStores(): Promise<BackupPayload['stores']> {
  const db = await openDatabase();
  const tx = db.transaction([...STORE_NAMES], 'readonly');

  const [
    students,
    exams,
    examCandidates,
    questionSets,
    questions,
    rubricTemplates,
    assessments,
    questionAttempts,
    auditLogs,
    appSettings,
  ] = await Promise.all([
    promisifyRequest(tx.objectStore('students').getAll()),
    promisifyRequest(tx.objectStore('exams').getAll()),
    promisifyRequest(tx.objectStore('examCandidates').getAll()),
    promisifyRequest(tx.objectStore('questionSets').getAll()),
    promisifyRequest(tx.objectStore('questions').getAll()),
    promisifyRequest(tx.objectStore('rubricTemplates').getAll()),
    promisifyRequest(tx.objectStore('assessments').getAll()),
    promisifyRequest(tx.objectStore('questionAttempts').getAll()),
    promisifyRequest(tx.objectStore('auditLogs').getAll()),
    promisifyRequest(tx.objectStore('appSettings').getAll()),
  ]);

  return {
    students,
    exams,
    examCandidates,
    questionSets,
    questions,
    rubricTemplates,
    assessments,
    questionAttempts,
    auditLogs,
    appSettings,
  };
}

export async function importAllStores(stores: BackupPayload['stores']): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction([...STORE_NAMES], 'readwrite');

  for (const name of STORE_NAMES) {
    const objectStore = tx.objectStore(name);
    objectStore.clear();
    const list = stores[name] || [];
    for (const item of list) {
      objectStore.put(item);
    }
  }

  await promisifyTransaction(tx);
}
