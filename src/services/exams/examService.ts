import {
  ExaminationFormInput,
  ExaminationRecord,
  ExaminationStatus,
} from '../../types/oralExam';
import {
  checkReferenceInFutureStores,
  DatabaseError,
  generateRecordId,
  nowIsoString,
  requestToPromise,
  STORE_NAMES,
  withTransaction,
} from '../database/db';

export interface ExamValidationErrors {
  title?: string;
  examDate?: string;
  passingScore?: string;
  status?: string;
}

const VALID_STATUSES: readonly ExaminationStatus[] = ['draft', 'published', 'closed'];

export function isValidCalendarDate(dateStr: string): boolean {
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function validateExamInput(input: ExaminationFormInput): ExamValidationErrors {
  const errors: ExamValidationErrors = {};

  if (!input.title.trim()) {
    errors.title = 'กรุณากรอกชื่อการสอบ';
  }

  if (!input.examDate.trim()) {
    errors.examDate = 'กรุณาระบุวันที่สอบ';
  } else if (!isValidCalendarDate(input.examDate)) {
    errors.examDate = 'รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็นวันที่จริงในรูปแบบ YYYY-MM-DD)';
  }

  const scoreRaw = input.passingScore.trim();
  if (scoreRaw === '') {
    errors.passingScore = 'กรุณาระบุเกณฑ์คะแนนผ่าน (0 ขึ้นไป)';
  } else if (!/^\d+$/.test(scoreRaw)) {
    errors.passingScore = 'เกณฑ์คะแนนผ่านต้องเป็นจำนวนเต็มที่ไม่ติดลบ (0, 1, 2, ...)';
  } else {
    const parsedScore = Number(scoreRaw);
    if (!Number.isSafeInteger(parsedScore) || parsedScore < 0) {
      errors.passingScore = 'เกณฑ์คะแนนผ่านต้องเป็นจำนวนเต็มที่มากกว่าหรือเท่ากับ 0';
    }
  }

  if (!VALID_STATUSES.includes(input.status)) {
    errors.status = 'สถานะการสอบไม่ถูกต้อง';
  }

  return errors;
}

export async function listExams(): Promise<ExaminationRecord[]> {
  return withTransaction(STORE_NAMES.EXAMS, 'readonly', async (tx) => {
    const store = tx.objectStore(STORE_NAMES.EXAMS);
    const all = await requestToPromise<ExaminationRecord[]>(store.getAll());
    return all.sort((a, b) => {
      const dateCmp = b.examDate.localeCompare(a.examDate);
      if (dateCmp !== 0) return dateCmp;
      return b.createdAt.localeCompare(a.createdAt);
    });
  });
}

export async function createExam(input: ExaminationFormInput): Promise<ExaminationRecord> {
  const errors = validateExamInput(input);
  if (errors.title || errors.examDate || errors.passingScore || errors.status) {
    throw new DatabaseError(
      'TRANSACTION_FAILED',
      errors.title ||
        errors.examDate ||
        errors.passingScore ||
        errors.status ||
        'ข้อมูลการสอบไม่ถูกต้อง'
    );
  }

  const now = nowIsoString();
  const record: ExaminationRecord = {
    id: generateRecordId('exam'),
    title: input.title.trim(),
    subject: input.subject.trim(),
    description: input.description.trim(),
    examDate: input.examDate.trim(),
    questionSetId: null,
    rubricTemplateId: null,
    passingScore: Number(input.passingScore.trim()),
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };

  return withTransaction(STORE_NAMES.EXAMS, 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_NAMES.EXAMS);
    await requestToPromise(store.add(record));
    return record;
  });
}

export async function updateExam(
  id: string,
  input: ExaminationFormInput
): Promise<ExaminationRecord> {
  const errors = validateExamInput(input);
  if (errors.title || errors.examDate || errors.passingScore || errors.status) {
    throw new DatabaseError(
      'TRANSACTION_FAILED',
      errors.title ||
        errors.examDate ||
        errors.passingScore ||
        errors.status ||
        'ข้อมูลการสอบไม่ถูกต้อง'
    );
  }

  return withTransaction(STORE_NAMES.EXAMS, 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_NAMES.EXAMS);
    const current = await requestToPromise<ExaminationRecord | undefined>(store.get(id));

    if (!current) {
      throw new DatabaseError('NOT_FOUND', 'ไม่พบข้อมูลการสอบที่ต้องการแก้ไข');
    }

    const updated: ExaminationRecord = {
      ...current,
      title: input.title.trim(),
      subject: input.subject.trim(),
      description: input.description.trim(),
      examDate: input.examDate.trim(),
      passingScore: Number(input.passingScore.trim()),
      status: input.status,
      updatedAt: nowIsoString(),
    };

    await requestToPromise(store.put(updated));
    return updated;
  });
}

export async function deleteExam(id: string): Promise<void> {
  return withTransaction(STORE_NAMES.EXAMS, 'readwrite', async (tx, db) => {
    const hasReferences = await checkReferenceInFutureStores(db, 'examId', id);
    if (hasReferences) {
      throw new DatabaseError(
        'REFERENCE_CONFLICT',
        'ไม่สามารถลบการสอบนี้ได้ เนื่องจากมีข้อมูลผู้เข้าสอบหรือผลการประเมินอ้างอิงอยู่'
      );
    }

    const store = tx.objectStore(STORE_NAMES.EXAMS);
    const current = await requestToPromise<ExaminationRecord | undefined>(store.get(id));

    if (!current) {
      throw new DatabaseError('NOT_FOUND', 'ไม่พบข้อมูลการสอบที่ต้องการลบ');
    }

    await requestToPromise(store.delete(id));
  });
}
