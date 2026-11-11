export const DB_NAME = 'oralTestManagementDB';
export const DB_VERSION = 1;

export const STORE_NAMES = {
  STUDENTS: 'students',
  EXAMS: 'exams',
  APP_SETTINGS: 'appSettings',
} as const;

export type DatabaseErrorCode =
  | 'UNAVAILABLE'
  | 'BLOCKED'
  | 'DUPLICATE_KEY'
  | 'NOT_FOUND'
  | 'REFERENCE_CONFLICT'
  | 'TRANSACTION_FAILED';

export class DatabaseError extends Error {
  public readonly code: DatabaseErrorCode;
  public readonly cause?: unknown;

  constructor(code: DatabaseErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.cause = cause;
  }
}

let activeConnectionPromise: Promise<IDBDatabase> | null = null;

function applySchemaUpgrade(
  db: IDBDatabase,
  oldVersion: number,
  transaction: IDBTransaction | null
): void {
  // Additive schema creation for v1; preserves any existing records on future upgrades
  if (oldVersion < 1) {
    if (!db.objectStoreNames.contains(STORE_NAMES.STUDENTS)) {
      const studentStore = db.createObjectStore(STORE_NAMES.STUDENTS, {
        keyPath: 'id',
      });
      studentStore.createIndex('normalizedStudentCode', 'normalizedStudentCode', {
        unique: true,
      });
      studentStore.createIndex('active', 'active', { unique: false });
      studentStore.createIndex('fullName', 'fullName', { unique: false });
    } else if (transaction) {
      const studentStore = transaction.objectStore(STORE_NAMES.STUDENTS);
      if (!studentStore.indexNames.contains('normalizedStudentCode')) {
        studentStore.createIndex('normalizedStudentCode', 'normalizedStudentCode', {
          unique: true,
        });
      }
      if (!studentStore.indexNames.contains('active')) {
        studentStore.createIndex('active', 'active', { unique: false });
      }
      if (!studentStore.indexNames.contains('fullName')) {
        studentStore.createIndex('fullName', 'fullName', { unique: false });
      }
    }

    if (!db.objectStoreNames.contains(STORE_NAMES.EXAMS)) {
      const examStore = db.createObjectStore(STORE_NAMES.EXAMS, {
        keyPath: 'id',
      });
      examStore.createIndex('examDate', 'examDate', { unique: false });
      examStore.createIndex('status', 'status', { unique: false });
    } else if (transaction) {
      const examStore = transaction.objectStore(STORE_NAMES.EXAMS);
      if (!examStore.indexNames.contains('examDate')) {
        examStore.createIndex('examDate', 'examDate', { unique: false });
      }
      if (!examStore.indexNames.contains('status')) {
        examStore.createIndex('status', 'status', { unique: false });
      }
    }

    if (!db.objectStoreNames.contains(STORE_NAMES.APP_SETTINGS)) {
      db.createObjectStore(STORE_NAMES.APP_SETTINGS, { keyPath: 'id' });
    }
  }
}

export function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window) || !window.indexedDB) {
    return Promise.reject(
      new DatabaseError(
        'UNAVAILABLE',
        'เบราว์เซอร์นี้ไม่รองรับ IndexedDB หรือปิดกั้นการจัดเก็บข้อมูลภายในเครื่อง'
      )
    );
  }

  if (activeConnectionPromise) {
    return activeConnectionPromise;
  }

  activeConnectionPromise = new Promise<IDBDatabase>((resolve, reject) => {
    let settled = false;

    let request: IDBOpenDBRequest;
    try {
      request = window.indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      activeConnectionPromise = null;
      reject(
        new DatabaseError(
          'UNAVAILABLE',
          'ไม่สามารถเปิดฐานข้อมูล IndexedDB ในเบราว์เซอร์ได้',
          err
        )
      );
      return;
    }

    request.onupgradeneeded = (event) => {
      const db = request.result;
      applySchemaUpgrade(db, event.oldVersion, request.transaction);
    };

    request.onblocked = () => {
      activeConnectionPromise = null;
      if (!settled) {
        settled = true;
        reject(
          new DatabaseError(
            'BLOCKED',
            'การอัปเกรดฐานข้อมูลถูกบล็อก กรุณาปิดแท็บอื่นที่เปิดระบบนี้อยู่แล้วลองใหม่อีกครั้ง'
          )
        );
      }
    };

    request.onerror = () => {
      activeConnectionPromise = null;
      if (!settled) {
        settled = true;
        reject(
          new DatabaseError(
            'UNAVAILABLE',
            'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล IndexedDB',
            request.error
          )
        );
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        activeConnectionPromise = null;
      };

      db.onclose = () => {
        activeConnectionPromise = null;
      };

      if (!settled) {
        settled = true;
        resolve(db);
      }
    };
  });

  return activeConnectionPromise;
}

export function resetDatabaseConnectionCache(): void {
  activeConnectionPromise = null;
}

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function withTransaction<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  executor: (tx: IDBTransaction, db: IDBDatabase) => Promise<T> | T
): Promise<T> {
  const db = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    let tx: IDBTransaction;
    try {
      tx = db.transaction(storeNames, mode);
    } catch (err) {
      reject(
        new DatabaseError(
          'TRANSACTION_FAILED',
          'ไม่สามารถสร้าง Transaction ในฐานข้อมูลได้',
          err
        )
      );
      return;
    }

    let resultValue: T;
    let hasResult = false;
    let settled = false;

    tx.oncomplete = () => {
      if (!settled) {
        settled = true;
        resolve(hasResult ? resultValue : (undefined as unknown as T));
      }
    };

    tx.onabort = () => {
      if (!settled) {
        settled = true;
        if (tx.error instanceof DatabaseError) {
          reject(tx.error);
        } else if (tx.error?.name === 'ConstraintError') {
          reject(
            new DatabaseError(
              'DUPLICATE_KEY',
              'ข้อมูลซ้ำกับรายการที่มีอยู่แล้วในฐานข้อมูล',
              tx.error
            )
          );
        } else {
          reject(
            new DatabaseError(
              'TRANSACTION_FAILED',
              'การทำรายการกับฐานข้อมูลถูกยกเลิก',
              tx.error
            )
          );
        }
      }
    };

    tx.onerror = () => {
      if (!settled) {
        settled = true;
        if (tx.error?.name === 'ConstraintError') {
          reject(
            new DatabaseError(
              'DUPLICATE_KEY',
              'ข้อมูลซ้ำกับรายการที่มีอยู่แล้วในฐานข้อมูล',
              tx.error
            )
          );
        } else {
          reject(
            new DatabaseError(
              'TRANSACTION_FAILED',
              'เกิดข้อผิดพลาดระหว่างบันทึกข้อมูลลงฐานข้อมูล',
              tx.error
            )
          );
        }
      }
    };

    Promise.resolve()
      .then(() => executor(tx, db))
      .then((res) => {
        resultValue = res;
        hasResult = true;
      })
      .catch((err) => {
        try {
          tx.abort();
        } catch {
          // Transaction may already be finished/aborted
        }
        if (!settled) {
          settled = true;
          if (err instanceof DatabaseError) {
            reject(err);
          } else if (
            err &&
            typeof err === 'object' &&
            'name' in err &&
            (err as { name?: string }).name === 'ConstraintError'
          ) {
            reject(
              new DatabaseError(
                'DUPLICATE_KEY',
                'ข้อมูลซ้ำกับรายการที่มีอยู่แล้วในฐานข้อมูล',
                err
              )
            );
          } else {
            reject(
              new DatabaseError(
                'TRANSACTION_FAILED',
                'ไม่สามารถประมวลผลคำสั่งฐานข้อมูลได้',
                err
              )
            );
          }
        }
      });
  });
}

export function generateRecordId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIsoString(): string {
  return new Date().toISOString();
}

/**
 * Checks whether any future candidate or assessment object stores (if added in
 * later schema versions) reference the specified foreign key field and value.
 */
export async function checkReferenceInFutureStores(
  db: IDBDatabase,
  foreignKeyField: 'studentId' | 'examId',
  targetId: string
): Promise<boolean> {
  const futureStores = ['candidates', 'assessments', 'results'].filter((name) =>
    db.objectStoreNames.contains(name)
  );
  if (futureStores.length === 0) return false;

  const tx = db.transaction(futureStores, 'readonly');
  for (const storeName of futureStores) {
    const store = tx.objectStore(storeName);
    const records = await requestToPromise<Record<string, unknown>[]>(store.getAll());
    if (records.some((r) => r && r[foreignKeyField] === targetId)) {
      return true;
    }
  }
  return false;
}
