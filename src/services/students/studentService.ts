import { StudentFormInput, StudentRecord } from '../../types/oralExam';
import {
  checkReferenceInFutureStores,
  DatabaseError,
  generateRecordId,
  nowIsoString,
  requestToPromise,
  STORE_NAMES,
  withTransaction,
} from '../database/db';

export interface StudentValidationErrors {
  studentCode?: string;
  fullName?: string;
}

export function normalizeStudentCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function validateStudentInput(input: StudentFormInput): StudentValidationErrors {
  const errors: StudentValidationErrors = {};
  const trimmedCode = input.studentCode.trim();
  const trimmedName = input.fullName.trim();

  if (!trimmedCode) {
    errors.studentCode = 'กรุณากรอกรหัสประจำตัวผู้เข้าสอบ';
  }
  if (!trimmedName) {
    errors.fullName = 'กรุณากรอกชื่อ-นามสกุลผู้เข้าสอบ';
  }

  return errors;
}

export async function listStudents(): Promise<StudentRecord[]> {
  return withTransaction(STORE_NAMES.STUDENTS, 'readonly', async (tx) => {
    const store = tx.objectStore(STORE_NAMES.STUDENTS);
    const all = await requestToPromise<StudentRecord[]>(store.getAll());
    return all.sort((a, b) => a.studentCode.localeCompare(b.studentCode, 'th'));
  });
}

export async function createStudent(input: StudentFormInput): Promise<StudentRecord> {
  const errors = validateStudentInput(input);
  if (errors.studentCode || errors.fullName) {
    throw new DatabaseError(
      'TRANSACTION_FAILED',
      errors.studentCode || errors.fullName || 'ข้อมูลผู้เข้าสอบไม่ถูกต้อง'
    );
  }

  const trimmedCode = input.studentCode.trim();
  const normalizedCode = normalizeStudentCode(input.studentCode);
  const now = nowIsoString();

  const record: StudentRecord = {
    id: generateRecordId('stu'),
    studentCode: trimmedCode,
    normalizedStudentCode: normalizedCode,
    fullName: input.fullName.trim(),
    department: input.department.trim(),
    program: input.program.trim(),
    active: input.active ?? true,
    createdAt: now,
    updatedAt: now,
  };

  return withTransaction(STORE_NAMES.STUDENTS, 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_NAMES.STUDENTS);
    const codeIndex = store.index('normalizedStudentCode');
    const existing = await requestToPromise<StudentRecord | undefined>(
      codeIndex.get(normalizedCode)
    );

    if (existing) {
      throw new DatabaseError(
        'DUPLICATE_KEY',
        `รหัสประจำตัว "${trimmedCode}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`
      );
    }

    await requestToPromise(store.add(record));
    return record;
  });
}

export async function updateStudent(
  id: string,
  input: StudentFormInput
): Promise<StudentRecord> {
  const errors = validateStudentInput(input);
  if (errors.studentCode || errors.fullName) {
    throw new DatabaseError(
      'TRANSACTION_FAILED',
      errors.studentCode || errors.fullName || 'ข้อมูลผู้เข้าสอบไม่ถูกต้อง'
    );
  }

  const trimmedCode = input.studentCode.trim();
  const normalizedCode = normalizeStudentCode(input.studentCode);

  return withTransaction(STORE_NAMES.STUDENTS, 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_NAMES.STUDENTS);
    const current = await requestToPromise<StudentRecord | undefined>(store.get(id));

    if (!current) {
      throw new DatabaseError('NOT_FOUND', 'ไม่พบข้อมูลผู้เข้าสอบที่ต้องการแก้ไข');
    }

    const codeIndex = store.index('normalizedStudentCode');
    const duplicate = await requestToPromise<StudentRecord | undefined>(
      codeIndex.get(normalizedCode)
    );

    if (duplicate && duplicate.id !== id) {
      throw new DatabaseError(
        'DUPLICATE_KEY',
        `รหัสประจำตัว "${trimmedCode}" ซ้ำกับผู้เข้าสอบรายอื่นในระบบ`
      );
    }

    const updated: StudentRecord = {
      ...current,
      studentCode: trimmedCode,
      normalizedStudentCode: normalizedCode,
      fullName: input.fullName.trim(),
      department: input.department.trim(),
      program: input.program.trim(),
      active: input.active,
      updatedAt: nowIsoString(),
    };

    await requestToPromise(store.put(updated));
    return updated;
  });
}

export async function setStudentActiveStatus(
  id: string,
  active: boolean
): Promise<StudentRecord> {
  return withTransaction(STORE_NAMES.STUDENTS, 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_NAMES.STUDENTS);
    const current = await requestToPromise<StudentRecord | undefined>(store.get(id));

    if (!current) {
      throw new DatabaseError('NOT_FOUND', 'ไม่พบข้อมูลผู้เข้าสอบที่ต้องการเปลี่ยนสถานะ');
    }

    const updated: StudentRecord = {
      ...current,
      active,
      updatedAt: nowIsoString(),
    };

    await requestToPromise(store.put(updated));
    return updated;
  });
}

export async function deleteStudent(id: string): Promise<void> {
  return withTransaction(STORE_NAMES.STUDENTS, 'readwrite', async (tx, db) => {
    const hasReferences = await checkReferenceInFutureStores(db, 'studentId', id);
    if (hasReferences) {
      throw new DatabaseError(
        'REFERENCE_CONFLICT',
        'ไม่สามารถลบผู้เข้าสอบรายนี้ได้ เนื่องจากมีข้อมูลการลงทะเบียนหรือผลการประเมินอ้างอิงอยู่'
      );
    }

    const store = tx.objectStore(STORE_NAMES.STUDENTS);
    const current = await requestToPromise<StudentRecord | undefined>(store.get(id));

    if (!current) {
      throw new DatabaseError('NOT_FOUND', 'ไม่พบข้อมูลผู้เข้าสอบที่ต้องการลบ');
    }

    await requestToPromise(store.delete(id));
  });
}
