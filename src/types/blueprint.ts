export type CandidateStatus = 'Waiting' | 'In Progress' | 'Completed' | 'Absent';

export type QuestionAttemptStatus =
  | 'Not Started'
  | 'Running'
  | 'Time Up'
  | 'Answered / Ready for Next'
  | 'Skipped';

export type ExamStatus = 'draft' | 'open' | 'in_progress' | 'completed';

export type AssessmentResult = 'PASS' | 'FAIL';
export type AssessmentStatus = 'draft' | 'submitted';
export type RubricScoreValue = 0 | 1 | 2;

export interface Student {
  id: string;
  studentCode: string;
  normalizedStudentCode: string;
  fullName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  description: string;
  examDate: string;
  passingScore: number;
  questionTimeLimitSeconds: number; // Positive integer minutes * 60, locked once started
  rubricTemplateId: string;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExamCandidate {
  id: string;
  examId: string;
  studentId: string;
  status: CandidateStatus;
  queueOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionSet {
  id: string;
  examId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  questionSetId: string;
  questionText: string;
  category: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: 2;
}

export interface RubricTemplate {
  id: string;
  title: string;
  criteria: RubricCriterion[];
  createdAt: string;
  updatedAt: string;
}

export interface RubricSnapshot {
  templateId: string;
  title: string;
  criteria: RubricCriterion[];
}

export interface Assessment {
  id: string;
  examId: string;
  examCandidateId: string;
  rubricSnapshot: RubricSnapshot;
  scores: Record<string, RubricScoreValue>;
  totalScore: number;
  result: AssessmentResult;
  status: AssessmentStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionAttempt {
  id: string;
  examCandidateId: string;
  questionId: string;
  questionOrder: number;
  status: QuestionAttemptStatus;
  startedAt: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  entityType: 'examCandidate' | 'assessment' | 'exam' | 'backup';
  entityId: string;
  action: string;
  reason: string;
  previousValue: unknown;
  newValue: unknown;
  createdAt: string;
}

export interface AppSettingsData {
  seeded: boolean;
  soundEnabled: boolean;
  lastBackupAt: string | null;
  activeExamId: string | null;
  activeCandidateId: string | null;
}

export interface AppSettingsRecord {
  id: 'main';
  settings: AppSettingsData;
  updatedAt: string;
}

export interface BackupPayload {
  schemaVersion: string;
  exportedAt: string;
  stores: {
    students: Student[];
    exams: Exam[];
    examCandidates: ExamCandidate[];
    questionSets: QuestionSet[];
    questions: Question[];
    rubricTemplates: RubricTemplate[];
    assessments: Assessment[];
    questionAttempts: QuestionAttempt[];
    auditLogs: AuditLog[];
    appSettings: AppSettingsRecord[];
  };
}

export type AppSection = 'dashboard' | 'exams' | 'live' | 'master' | 'results';
