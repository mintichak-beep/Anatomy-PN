import {
  AppSettingsData,
  AppSettingsRecord,
  Assessment,
  AssessmentResult,
  AuditLog,
  BackupPayload,
  CandidateStatus,
  Exam,
  ExamCandidate,
  ExamStatus,
  Question,
  QuestionAttempt,
  QuestionSet,
  RubricCriterion,
  RubricScoreValue,
  RubricTemplate,
  Student,
} from '../types/blueprint';
import {
  deleteRecord,
  exportAllStores,
  getAllRecords,
  getRecordById,
  importAllStores,
  putManyRecords,
  putRecord,
} from './db';

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeStudentCode(code: string): string {
  return code.trim().replace(/\s+/g, '').toUpperCase();
}

export function isValidScoreValue(v: unknown): v is RubricScoreValue {
  return v === 0 || v === 1 || v === 2;
}

export interface FullAppState {
  students: Student[];
  exams: Exam[];
  examCandidates: ExamCandidate[];
  questionSets: QuestionSet[];
  questions: Question[];
  rubricTemplates: RubricTemplate[];
  assessments: Assessment[];
  questionAttempts: QuestionAttempt[];
  auditLogs: AuditLog[];
  settings: AppSettingsData;
}

const DEFAULT_SETTINGS: AppSettingsData = {
  seeded: false,
  soundEnabled: true,
  lastBackupAt: null,
  activeExamId: null,
  activeCandidateId: null,
};

async function getOrInitSettings(): Promise<AppSettingsRecord> {
  const existing = await getRecordById<AppSettingsRecord>('appSettings', 'main');
  if (existing) return existing;
  const fresh: AppSettingsRecord = {
    id: 'main',
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: new Date().toISOString(),
  };
  await putRecord('appSettings', fresh);
  return fresh;
}

export async function updateAppSettings(
  patch: Partial<AppSettingsData>
): Promise<AppSettingsData> {
  const current = await getOrInitSettings();
  const next: AppSettingsRecord = {
    id: 'main',
    settings: { ...current.settings, ...patch },
    updatedAt: new Date().toISOString(),
  };
  await putRecord('appSettings', next);
  return next.settings;
}

export async function appendAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
  const log: AuditLog = {
    id: uid('audit'),
    ...entry,
    createdAt: new Date().toISOString(),
  };
  await putRecord('auditLogs', log);
  return log;
}

export async function initializeAndLoadState(): Promise<FullAppState> {
  const settingsRec = await getOrInitSettings();

  if (!settingsRec.settings.seeded) {
    await seedInitialSampleData();
    await updateAppSettings({ seeded: true });
  }

  // Sync any Running questionAttempts that expired while browser was closed/refreshed
  await syncExpiredAttempts();

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
    latestSettings,
  ] = await Promise.all([
    getAllRecords<Student>('students'),
    getAllRecords<Exam>('exams'),
    getAllRecords<ExamCandidate>('examCandidates'),
    getAllRecords<QuestionSet>('questionSets'),
    getAllRecords<Question>('questions'),
    getAllRecords<RubricTemplate>('rubricTemplates'),
    getAllRecords<Assessment>('assessments'),
    getAllRecords<QuestionAttempt>('questionAttempts'),
    getAllRecords<AuditLog>('auditLogs'),
    getOrInitSettings(),
  ]);

  return {
    students: students.sort((a, b) => a.studentCode.localeCompare(b.studentCode)),
    exams: exams.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    examCandidates: examCandidates.sort((a, b) => a.queueOrder - b.queueOrder),
    questionSets,
    questions,
    rubricTemplates: rubricTemplates.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    assessments,
    questionAttempts: questionAttempts.sort((a, b) => a.questionOrder - b.questionOrder),
    auditLogs: auditLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    settings: latestSettings.settings,
  };
}

async function seedInitialSampleData(): Promise<void> {
  const existingExams = await getAllRecords<Exam>('exams');
  if (existingExams.length > 0) return;

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const rubricId = 'rubric-oral-default';
  const rubric: RubricTemplate = {
    id: rubricId,
    title: 'เกณฑ์ประเมินการสอบปากเปล่ามาตรฐาน (0–2 คะแนน/เกณฑ์)',
    criteria: [
      {
        id: 'crit-accuracy',
        name: 'ความถูกต้องของเนื้อหา',
        description: 'ระบุตำแหน่ง หน้าที่ หรือสาระสำคัญได้ถูกต้องตรงประเด็น',
        maxScore: 2,
      },
      {
        id: 'crit-terminology',
        name: 'การใช้ศัพท์วิชาการ',
        description: 'ออกเสียงและใช้คำศัพท์เฉพาะทางได้อย่างถูกต้องเหมาะสม',
        maxScore: 2,
      },
      {
        id: 'crit-reasoning',
        name: 'ความเชื่อมโยงและการอธิบาย',
        description: 'อธิบายเหตุผล ความสัมพันธ์ของโครงสร้างหรือกลไกได้ชัดเจน',
        maxScore: 2,
      },
      {
        id: 'crit-clarity',
        name: 'ความมั่นใจและการสื่อสาร',
        description: 'ตอบคำถามฉะฉาน ตรงประเด็น ภายในเวลาที่กำหนด',
        maxScore: 2,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const students: Student[] = [
    {
      id: 'stu-01',
      studentCode: '6701001',
      normalizedStudentCode: '6701001',
      fullName: 'กิตติพงศ์ ใจดี',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'stu-02',
      studentCode: '6701002',
      normalizedStudentCode: '6701002',
      fullName: 'ณัฐธิดา สุขสวัสดิ์',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'stu-03',
      studentCode: '6701003',
      normalizedStudentCode: '6701003',
      fullName: 'ปิยวัฒน์ วัฒนากูล',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const examId = 'exam-sample-01';
  const exam: Exam = {
    id: examId,
    title: 'สอบปากเปล่ากลางภาค · รุ่น 67 (ตัวอย่าง)',
    subject: 'กายวิภาคศาสตร์พื้นฐาน (Human Anatomy)',
    description: 'รอบสอบปากเปล่าตัวต่อตัว กำหนดเวลาตอบข้อละ 2 นาที ใช้เกณฑ์ประเมิน Rubric 4 ด้าน (เต็ม 8 คะแนน)',
    examDate: today,
    passingScore: 5,
    questionTimeLimitSeconds: 120,
    rubricTemplateId: rubricId,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };

  const qSetId = 'qset-sample-01';
  const questionSet: QuestionSet = {
    id: qSetId,
    examId,
    title: 'ชุดคำถามสอบปากเปล่า 5 ข้อหลัก',
    createdAt: now,
    updatedAt: now,
  };

  const questions: Question[] = [
    {
      id: 'q-sample-1',
      questionSetId: qSetId,
      questionText: 'อธิบายทางเดินลมหายใจส่วนต้นและส่วนปลายตั้งแต่ Trachea จนถึง Alveoli พร้อมหน้าที่ของ Epiglottis',
      category: 'ระบบหายใจ',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'q-sample-2',
      questionSetId: qSetId,
      questionText: 'ชี้และอธิบายการทำงานของลิ้นหัวใจทั้ง 4 ลิ้น รวมถึงทิศทางการไหลของเลือดผ่านห้องหัวใจ',
      category: 'ระบบหัวใจและหลอดเลือด',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'q-sample-3',
      questionSetId: qSetId,
      questionText: 'เปรียบเทียบโครงสร้างและหน้าที่ของลำไส้เล็กส่วน Duodenum, Jejunum และ Ileum',
      category: 'ระบบทางเดินอาหาร',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'q-sample-4',
      questionSetId: qSetId,
      questionText: 'อธิบายโครงสร้างของหน่วยไต (Nephron) และตำแหน่งที่มีการกรองเลือดที่ Glomerulus',
      category: 'ระบบขับถ่าย',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'q-sample-5',
      questionSetId: qSetId,
      questionText: 'ระบุส่วนประกอบสำคัญของระบบประสาทส่วนกลาง (Cerebrum, Cerebellum, Brainstem) และหน้าที่หลัก',
      category: 'ระบบประสาท',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const candidates: ExamCandidate[] = students.map((s, idx) => ({
    id: `cand-sample-${idx + 1}`,
    examId,
    studentId: s.id,
    status: 'Waiting',
    queueOrder: idx + 1,
    createdAt: now,
    updatedAt: now,
  }));

  await Promise.all([
    putRecord('rubricTemplates', rubric),
    putManyRecords('students', students),
    putRecord('exams', exam),
    putRecord('questionSets', questionSet),
    putManyRecords('questions', questions),
    putManyRecords('examCandidates', candidates),
  ]);
}

// ============================================================================
// STUDENTS CRUD
// ============================================================================

export async function saveStudent(input: {
  id?: string;
  studentCode: string;
  fullName: string;
  active?: boolean;
}): Promise<Student> {
  const cleanCode = input.studentCode.trim();
  const cleanName = input.fullName.trim();
  const normalized = normalizeStudentCode(cleanCode);

  if (!cleanCode || !cleanName) {
    throw new Error('กรุณากรอกรหัสนักศึกษาและชื่อ-นามสกุลให้ครบถ้วน');
  }

  const all = await getAllRecords<Student>('students');
  const duplicate = all.find(
    (s) => s.normalizedStudentCode === normalized && s.id !== input.id
  );
  if (duplicate) {
    throw new Error(`พบรหัสนักศึกษาซ้ำในระบบ (${duplicate.studentCode} · ${duplicate.fullName})`);
  }

  const now = new Date().toISOString();
  const existing = input.id ? all.find((s) => s.id === input.id) : undefined;
  const student: Student = {
    id: existing?.id || uid('stu'),
    studentCode: cleanCode,
    normalizedStudentCode: normalized,
    fullName: cleanName,
    active: input.active ?? existing?.active ?? true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await putRecord('students', student);
  return student;
}

export async function deleteStudent(studentId: string): Promise<void> {
  const candidates = await getAllRecords<ExamCandidate>('examCandidates');
  const inExam = candidates.some((c) => c.studentId === studentId);
  if (inExam) {
    throw new Error('ไม่สามารถลบนักศึกษาที่มีชื่ออยู่ในรอบสอบแล้วได้ (สามารถปิดการใช้งานแทนได้)');
  }
  await deleteRecord('students', studentId);
}

// ============================================================================
// EXAMS & TIMER LOCK RULES
// ============================================================================

export function hasExamStarted(
  exam: Exam,
  candidates: ExamCandidate[],
  assessments: Assessment[],
  attempts: QuestionAttempt[]
): boolean {
  if (exam.status === 'in_progress' || exam.status === 'completed') return true;
  const examCandIds = new Set(candidates.filter((c) => c.examId === exam.id).map((c) => c.id));
  if (candidates.some((c) => c.examId === exam.id && (c.status === 'In Progress' || c.status === 'Completed'))) {
    return true;
  }
  if (assessments.some((a) => a.examId === exam.id)) return true;
  if (attempts.some((qa) => examCandIds.has(qa.examCandidateId))) return true;
  return false;
}

export async function saveExam(input: {
  id?: string;
  title: string;
  subject: string;
  description: string;
  examDate: string;
  passingScore: number;
  minutesPerQuestion: number;
  rubricTemplateId: string;
  status?: ExamStatus;
}): Promise<Exam> {
  const title = input.title.trim();
  const subject = input.subject.trim();
  if (!title || !subject) {
    throw new Error('กรุณากรอกชื่อรอบสอบและรายวิชาให้ครบถ้วน');
  }

  if (!Number.isInteger(input.minutesPerQuestion) || input.minutesPerQuestion < 1) {
    throw new Error('เวลาต่อคำถามต้องเป็นจำนวนเต็มบวก (อย่างน้อย 1 นาที)');
  }

  const now = new Date().toISOString();
  const existing = input.id ? await getRecordById<Exam>('exams', input.id) : undefined;
  let timeLimitSeconds = input.minutesPerQuestion * 60;

  if (existing) {
    const [candidates, assessments, attempts] = await Promise.all([
      getAllRecords<ExamCandidate>('examCandidates'),
      getAllRecords<Assessment>('assessments'),
      getAllRecords<QuestionAttempt>('questionAttempts'),
    ]);
    const started = hasExamStarted(existing, candidates, assessments, attempts);
    if (started && existing.questionTimeLimitSeconds !== timeLimitSeconds) {
      throw new Error('ไม่สามารถเปลี่ยนเวลาต่อคำถามได้ เนื่องจากรอบสอบนี้เริ่มดำเนินการสอบไปแล้ว');
    }
    if (started) {
      timeLimitSeconds = existing.questionTimeLimitSeconds;
    }
  }

  const exam: Exam = {
    id: existing?.id || uid('exam'),
    title,
    subject,
    description: input.description.trim(),
    examDate: input.examDate || now.slice(0, 10),
    passingScore: Math.max(0, Math.round(input.passingScore)),
    questionTimeLimitSeconds: timeLimitSeconds,
    rubricTemplateId: input.rubricTemplateId,
    status: input.status ?? existing?.status ?? 'open',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await putRecord('exams', exam);

  // Ensure a default QuestionSet exists for a newly created exam
  if (!existing) {
    const qSet: QuestionSet = {
      id: uid('qset'),
      examId: exam.id,
      title: `ชุดคำถาม · ${exam.title}`,
      createdAt: now,
      updatedAt: now,
    };
    await putRecord('questionSets', qSet);
  }

  return exam;
}

export async function updateExamStatus(examId: string, status: ExamStatus): Promise<Exam> {
  const existing = await getRecordById<Exam>('exams', examId);
  if (!existing) throw new Error('ไม่พบรอบสอบ');
  const updated: Exam = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };
  await putRecord('exams', updated);
  return updated;
}

// ============================================================================
// QUESTION SETS & QUESTIONS
// ============================================================================

export async function saveQuestionSet(examId: string, title: string, id?: string): Promise<QuestionSet> {
  const clean = title.trim();
  if (!clean) throw new Error('กรุณาระบุชื่อชุดคำถาม');
  const now = new Date().toISOString();
  const existing = id ? await getRecordById<QuestionSet>('questionSets', id) : undefined;
  const qs: QuestionSet = {
    id: existing?.id || uid('qset'),
    examId,
    title: clean,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await putRecord('questionSets', qs);
  return qs;
}

export async function saveQuestion(input: {
  id?: string;
  questionSetId: string;
  questionText: string;
  category: string;
  active?: boolean;
}): Promise<Question> {
  const text = input.questionText.trim();
  if (!text) throw new Error('กรุณากรอกข้อความคำถาม');
  const now = new Date().toISOString();
  const existing = input.id ? await getRecordById<Question>('questions', input.id) : undefined;
  const q: Question = {
    id: existing?.id || uid('q'),
    questionSetId: input.questionSetId,
    questionText: text,
    category: input.category.trim() || 'ทั่วไป',
    active: input.active ?? existing?.active ?? true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await putRecord('questions', q);
  return q;
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const attempts = await getAllRecords<QuestionAttempt>('questionAttempts');
  if (attempts.some((a) => a.questionId === questionId)) {
    throw new Error('ไม่สามารถลบคำถามที่เคยใช้ในการสอบแล้วได้ (แนะนำให้ปิดการใช้งานแทน)');
  }
  await deleteRecord('questions', questionId);
}

// ============================================================================
// RUBRIC TEMPLATES (0, 1, 2 per criterion)
// ============================================================================

export async function saveRubricTemplate(input: {
  id?: string;
  title: string;
  criteria: Array<{ id?: string; name: string; description: string }>;
}): Promise<RubricTemplate> {
  const title = input.title.trim();
  if (!title) throw new Error('กรุณาระบุชื่อเกณฑ์ Rubric');

  const validCriteria: RubricCriterion[] = input.criteria
    .filter((c) => c.name.trim())
    .map((c, idx) => ({
      id: c.id || `crit-${Date.now()}-${idx}`,
      name: c.name.trim(),
      description: c.description.trim(),
      maxScore: 2,
    }));

  if (validCriteria.length === 0) {
    throw new Error('กรุณาเพิ่มเกณฑ์การประเมินอย่างน้อย 1 ข้อ');
  }

  const now = new Date().toISOString();
  const existing = input.id ? await getRecordById<RubricTemplate>('rubricTemplates', input.id) : undefined;
  const template: RubricTemplate = {
    id: existing?.id || uid('rubric'),
    title,
    criteria: validCriteria,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await putRecord('rubricTemplates', template);
  return template;
}

// ============================================================================
// EXAM CANDIDATES & QUEUE STATE MACHINE
// ============================================================================

export async function enrollStudentInExam(examId: string, studentId: string): Promise<ExamCandidate> {
  const all = await getAllRecords<ExamCandidate>('examCandidates');
  const existingInExam = all.filter((c) => c.examId === examId);

  if (existingInExam.some((c) => c.studentId === studentId)) {
    throw new Error('นักศึกษาคนนี้ลงทะเบียนในรอบสอบนี้แล้ว (ห้ามลงทะเบียนซ้ำ)');
  }

  const maxOrder = existingInExam.reduce((m, c) => Math.max(m, c.queueOrder), 0);
  const now = new Date().toISOString();
  const candidate: ExamCandidate = {
    id: uid('cand'),
    examId,
    studentId,
    status: 'Waiting',
    queueOrder: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };

  await putRecord('examCandidates', candidate);
  return candidate;
}

export async function reorderCandidateQueue(
  examId: string,
  candidateId: string,
  direction: 'up' | 'down'
): Promise<void> {
  const all = await getAllRecords<ExamCandidate>('examCandidates');
  const inExam = all
    .filter((c) => c.examId === examId)
    .sort((a, b) => a.queueOrder - b.queueOrder);

  const idx = inExam.findIndex((c) => c.id === candidateId);
  if (idx === -1) return;
  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= inExam.length) return;

  const now = new Date().toISOString();
  const current = { ...inExam[idx], queueOrder: inExam[targetIdx].queueOrder, updatedAt: now };
  const swapped = { ...inExam[targetIdx], queueOrder: inExam[idx].queueOrder, updatedAt: now };

  await putManyRecords('examCandidates', [current, swapped]);
}

export async function removeCandidateFromExam(candidateId: string): Promise<void> {
  const candidate = await getRecordById<ExamCandidate>('examCandidates', candidateId);
  if (!candidate) return;
  if (candidate.status !== 'Waiting') {
    throw new Error('สามารถถอนชื่อได้เฉพาะผู้เข้าสอบที่มีสถานะ Waiting เท่านั้น');
  }
  await deleteRecord('examCandidates', candidateId);
}

export async function transitionCandidateStatus(
  candidateId: string,
  nextStatus: CandidateStatus,
  reason?: string
): Promise<ExamCandidate> {
  const candidate = await getRecordById<ExamCandidate>('examCandidates', candidateId);
  if (!candidate) throw new Error('ไม่พบข้อมูลผู้เข้าสอบ');

  const prevStatus = candidate.status;
  if (prevStatus === nextStatus) return candidate;

  const allowed: Record<CandidateStatus, CandidateStatus[]> = {
    Waiting: ['In Progress', 'Absent'],
    'In Progress': ['Completed', 'Waiting'],
    Completed: [],
    Absent: [],
  };

  if (!allowed[prevStatus].includes(nextStatus)) {
    throw new Error(`ไม่อนุญาตให้เปลี่ยนสถานะจาก ${prevStatus} เป็น ${nextStatus}`);
  }

  if (prevStatus === 'In Progress' && nextStatus === 'Waiting') {
    if (!reason || !reason.trim()) {
      throw new Error('การกู้คืนสถานะจาก In Progress กลับเป็น Waiting ต้องระบุเหตุผล');
    }
    await appendAuditLog({
      entityType: 'examCandidate',
      entityId: candidateId,
      action: 'RECOVER_CANDIDATE_TO_WAITING',
      reason: reason.trim(),
      previousValue: { status: prevStatus },
      newValue: { status: nextStatus },
    });
  }

  if (nextStatus === 'Absent') {
    await appendAuditLog({
      entityType: 'examCandidate',
      entityId: candidateId,
      action: 'MARK_CANDIDATE_ABSENT',
      reason: reason?.trim() || 'กรรมการบันทึกสถานะขาดสอบ',
      previousValue: { status: prevStatus },
      newValue: { status: nextStatus },
    });
  }

  const updated: ExamCandidate = {
    ...candidate,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };
  await putRecord('examCandidates', updated);

  // If moving into In Progress, lock the exam round into in_progress too & save active pointers
  if (nextStatus === 'In Progress') {
    const exam = await getRecordById<Exam>('exams', candidate.examId);
    if (exam && (exam.status === 'draft' || exam.status === 'open')) {
      await putRecord('exams', {
        ...exam,
        status: 'in_progress',
        updatedAt: new Date().toISOString(),
      });
    }
    await updateAppSettings({
      activeExamId: candidate.examId,
      activeCandidateId: candidate.id,
    });
  } else if (nextStatus === 'Waiting' || nextStatus === 'Completed') {
    const settings = (await getOrInitSettings()).settings;
    if (settings.activeCandidateId === candidate.id) {
      await updateAppSettings({ activeCandidateId: null });
    }
  }

  return updated;
}

// ============================================================================
// QUESTION ATTEMPTS & TIMESTAMP TIMER RECOVERY
// ============================================================================

export async function syncExpiredAttempts(): Promise<QuestionAttempt[]> {
  const attempts = await getAllRecords<QuestionAttempt>('questionAttempts');
  const nowMs = Date.now();
  const changed: QuestionAttempt[] = [];

  for (const att of attempts) {
    if (att.status === 'Running' && att.expiresAt) {
      const expMs = new Date(att.expiresAt).getTime();
      if (nowMs >= expMs) {
        changed.push({
          ...att,
          status: 'Time Up',
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  if (changed.length > 0) {
    await putManyRecords('questionAttempts', changed);
  }
  return changed;
}

export async function prepareQuestionAttempt(
  examCandidateId: string,
  questionId: string
): Promise<QuestionAttempt> {
  const all = await getAllRecords<QuestionAttempt>('questionAttempts');
  const existing = all.find(
    (a) => a.examCandidateId === examCandidateId && a.questionId === questionId
  );
  if (existing) return existing;

  const candAttempts = all.filter((a) => a.examCandidateId === examCandidateId);
  const maxOrder = candAttempts.reduce((m, a) => Math.max(m, a.questionOrder), 0);
  const now = new Date().toISOString();

  const attempt: QuestionAttempt = {
    id: uid('att'),
    examCandidateId,
    questionId,
    questionOrder: maxOrder + 1,
    status: 'Not Started',
    startedAt: null,
    expiresAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await putRecord('questionAttempts', attempt);
  return attempt;
}

export async function startQuestionTimer(
  attemptId: string,
  questionTimeLimitSeconds: number
): Promise<QuestionAttempt> {
  const attempt = await getRecordById<QuestionAttempt>('questionAttempts', attemptId);
  if (!attempt) throw new Error('ไม่พบข้อมูลข้อคำถามที่เลือก');

  if (attempt.status !== 'Not Started') {
    throw new Error('สามารถเริ่มจับเวลาได้เฉพาะคำถามที่มีสถานะ Not Started เท่านั้น');
  }

  const nowMs = Date.now();
  const startedAt = new Date(nowMs).toISOString();
  const expiresAt = new Date(nowMs + questionTimeLimitSeconds * 1000).toISOString();

  const updated: QuestionAttempt = {
    ...attempt,
    status: 'Running',
    startedAt,
    expiresAt,
    updatedAt: startedAt,
  };
  await putRecord('questionAttempts', updated);
  return updated;
}

export async function markAttemptTimeUp(attemptId: string): Promise<QuestionAttempt> {
  const attempt = await getRecordById<QuestionAttempt>('questionAttempts', attemptId);
  if (!attempt) throw new Error('ไม่พบข้อคำถาม');
  if (attempt.status !== 'Running') return attempt;

  const updated: QuestionAttempt = {
    ...attempt,
    status: 'Time Up',
    updatedAt: new Date().toISOString(),
  };
  await putRecord('questionAttempts', updated);
  return updated;
}

export async function markAttemptAnsweredReadyNext(attemptId: string): Promise<QuestionAttempt> {
  const attempt = await getRecordById<QuestionAttempt>('questionAttempts', attemptId);
  if (!attempt) throw new Error('ไม่พบข้อคำถาม');

  if (attempt.status !== 'Running' && attempt.status !== 'Time Up') {
    throw new Error('ต้องเริ่มจับเวลาคำถามก่อนจึงจะทำเครื่องหมายว่าตอบแล้วได้');
  }

  const now = new Date().toISOString();
  const updated: QuestionAttempt = {
    ...attempt,
    status: 'Answered / Ready for Next',
    completedAt: now,
    updatedAt: now,
  };
  await putRecord('questionAttempts', updated);
  return updated;
}

export async function skipQuestionAttempt(attemptId: string): Promise<QuestionAttempt> {
  const attempt = await getRecordById<QuestionAttempt>('questionAttempts', attemptId);
  if (!attempt) throw new Error('ไม่พบข้อคำถาม');
  if (attempt.status !== 'Not Started') {
    throw new Error('สามารถข้ามได้เฉพาะข้อที่ยังไม่เริ่มจับเวลา (Not Started) เท่านั้น');
  }

  const now = new Date().toISOString();
  const updated: QuestionAttempt = {
    ...attempt,
    status: 'Skipped',
    completedAt: now,
    updatedAt: now,
  };
  await putRecord('questionAttempts', updated);
  return updated;
}

// ============================================================================
// ASSESSMENTS, RUBRIC SNAPSHOT, LOCKING & AUDIT LOG
// ============================================================================

export function calculateAssessmentResult(
  scores: Record<string, RubricScoreValue>,
  criteria: RubricCriterion[],
  passingScore: number
): { totalScore: number; result: AssessmentResult } {
  let totalScore = 0;
  for (const crit of criteria) {
    const val = scores[crit.id] ?? 0;
    if (!isValidScoreValue(val)) {
      throw new Error('คะแนนแต่ละเกณฑ์มีได้เฉพาะ 0, 1 หรือ 2 เท่านั้น');
    }
    totalScore += val;
  }
  const result: AssessmentResult = totalScore >= passingScore ? 'PASS' : 'FAIL';
  return { totalScore, result };
}

export async function getOrCreateDraftAssessment(
  exam: Exam,
  candidate: ExamCandidate,
  template: RubricTemplate
): Promise<Assessment> {
  const all = await getAllRecords<Assessment>('assessments');
  const existing = all.find((a) => a.examCandidateId === candidate.id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const initialScores: Record<string, RubricScoreValue> = {};
  for (const c of template.criteria) {
    initialScores[c.id] = 0;
  }

  const { totalScore, result } = calculateAssessmentResult(
    initialScores,
    template.criteria,
    exam.passingScore
  );

  const assessment: Assessment = {
    id: uid('assess'),
    examId: exam.id,
    examCandidateId: candidate.id,
    rubricSnapshot: {
      templateId: template.id,
      title: template.title,
      criteria: template.criteria.map((c) => ({ ...c, maxScore: 2 })),
    },
    scores: initialScores,
    totalScore,
    result,
    status: 'draft',
    submittedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await putRecord('assessments', assessment);
  return assessment;
}

export async function updateDraftAssessmentScore(
  assessmentId: string,
  criterionId: string,
  score: RubricScoreValue,
  passingScore: number
): Promise<Assessment> {
  if (!isValidScoreValue(score)) {
    throw new Error('คะแนนแต่ละเกณฑ์ต้องเป็น 0, 1 หรือ 2 เท่านั้น');
  }
  const assessment = await getRecordById<Assessment>('assessments', assessmentId);
  if (!assessment) throw new Error('ไม่พบแบบประเมิน');
  if (assessment.status === 'submitted') {
    throw new Error('ผลสอบที่ยืนยันแล้วถูกล็อก กรุณาใช้เมนูแก้ไขผลสอบพร้อมระบุเหตุผล');
  }

  const nextScores = { ...assessment.scores, [criterionId]: score };
  const { totalScore, result } = calculateAssessmentResult(
    nextScores,
    assessment.rubricSnapshot.criteria,
    passingScore
  );

  const updated: Assessment = {
    ...assessment,
    scores: nextScores,
    totalScore,
    result,
    updatedAt: new Date().toISOString(),
  };
  await putRecord('assessments', updated);
  return updated;
}

export async function submitAndLockAssessment(
  assessmentId: string,
  passingScore: number
): Promise<Assessment> {
  const assessment = await getRecordById<Assessment>('assessments', assessmentId);
  if (!assessment) throw new Error('ไม่พบแบบประเมิน');
  if (assessment.status === 'submitted') return assessment;

  const { totalScore, result } = calculateAssessmentResult(
    assessment.scores,
    assessment.rubricSnapshot.criteria,
    passingScore
  );

  const now = new Date().toISOString();
  const locked: Assessment = {
    ...assessment,
    totalScore,
    result,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
  };
  await putRecord('assessments', locked);

  // Transition candidate In Progress -> Completed
  await transitionCandidateStatus(assessment.examCandidateId, 'Completed');

  await appendAuditLog({
    entityType: 'assessment',
    entityId: locked.id,
    action: 'SUBMIT_AND_LOCK_ASSESSMENT',
    reason: 'กรรมการยืนยันส่งผลสอบและล็อกคะแนน',
    previousValue: { status: 'draft' },
    newValue: { status: 'submitted', totalScore, result },
  });

  // Auto-mark exam completed if no Waiting or In Progress candidates remain
  const examCandidates = (await getAllRecords<ExamCandidate>('examCandidates')).filter(
    (c) => c.examId === assessment.examId
  );
  const allDone =
    examCandidates.length > 0 &&
    examCandidates.every((c) => c.status === 'Completed' || c.status === 'Absent');
  if (allDone) {
    const exam = await getRecordById<Exam>('exams', assessment.examId);
    if (exam && exam.status !== 'completed') {
      await putRecord('exams', { ...exam, status: 'completed', updatedAt: now });
    }
  }

  return locked;
}

export async function amendLockedAssessment(
  assessmentId: string,
  nextScores: Record<string, RubricScoreValue>,
  passingScore: number,
  reason: string
): Promise<Assessment> {
  const cleanReason = reason.trim();
  if (!cleanReason) {
    throw new Error('การแก้ไขผลสอบที่ยืนยันแล้วต้องระบุเหตุผลทุกครั้ง');
  }

  const assessment = await getRecordById<Assessment>('assessments', assessmentId);
  if (!assessment) throw new Error('ไม่พบข้อมูลผลสอบ');

  const { totalScore, result } = calculateAssessmentResult(
    nextScores,
    assessment.rubricSnapshot.criteria,
    passingScore
  );

  const previousValue = {
    scores: assessment.scores,
    totalScore: assessment.totalScore,
    result: assessment.result,
  };

  const now = new Date().toISOString();
  const amended: Assessment = {
    ...assessment,
    scores: nextScores,
    totalScore,
    result,
    updatedAt: now,
  };
  await putRecord('assessments', amended);

  await appendAuditLog({
    entityType: 'assessment',
    entityId: amended.id,
    action: 'AMEND_LOCKED_ASSESSMENT',
    reason: cleanReason,
    previousValue,
    newValue: {
      scores: nextScores,
      totalScore,
      result,
    },
  });

  return amended;
}

// ============================================================================
// JSON BACKUP & RESTORE
// ============================================================================

export async function createBackupPayload(): Promise<BackupPayload> {
  const now = new Date().toISOString();
  await updateAppSettings({ lastBackupAt: now });
  const stores = await exportAllStores();
  return {
    schemaVersion: '1.3.0',
    exportedAt: now,
    stores,
  };
}

export async function restoreFromBackupPayload(raw: unknown): Promise<{
  studentsCount: number;
  examsCount: number;
  assessmentsCount: number;
}> {
  if (!raw || typeof raw !== 'object') {
    throw new Error('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
  }
  const payload = raw as Partial<BackupPayload>;
  if (!payload.stores || typeof payload.stores !== 'object') {
    throw new Error('ไม่พบข้อมูล stores ในไฟล์สำรอง');
  }

  const requiredArrays: Array<keyof BackupPayload['stores']> = [
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
  ];

  for (const key of requiredArrays) {
    if (!Array.isArray(payload.stores[key])) {
      throw new Error(`ไฟล์สำรองขาดตารางข้อมูล "${key}" หรือโครงสร้างไม่สมบูรณ์`);
    }
  }

  await importAllStores(payload.stores);
  await appendAuditLog({
    entityType: 'backup',
    entityId: 'system',
    action: 'RESTORE_JSON_BACKUP',
    reason: `กู้คืนข้อมูลจากไฟล์สำรอง (${payload.exportedAt || 'ไม่ระบุเวลา'})`,
    previousValue: null,
    newValue: {
      students: payload.stores.students.length,
      exams: payload.stores.exams.length,
      assessments: payload.stores.assessments.length,
    },
  });

  return {
    studentsCount: payload.stores.students.length,
    examsCount: payload.stores.exams.length,
    assessmentsCount: payload.stores.assessments.length,
  };
}
