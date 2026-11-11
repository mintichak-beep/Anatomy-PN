export type NavPageId =
  | 'dashboard'
  | 'examinations'
  | 'students'
  | 'question-bank'
  | 'rubrics'
  | 'results'
  | 'backup';

/**
 * Confirmed scoring rule for future examination milestones:
 * Each rubric criterion accepts only 0, 1, or 2 points.
 */
export type RubricCriterionScore = 0 | 1 | 2;

export const ALLOWED_RUBRIC_SCORES: readonly RubricCriterionScore[] = [0, 1, 2] as const;

export interface DashboardSummary {
  totalStudents: number;
  totalExaminations: number;
  waitingCandidates: number;
  completedCandidates: number;
}

export interface StudentRecord {
  id: string;
  studentCode: string;
  normalizedStudentCode: string;
  fullName: string;
  department: string;
  program: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFormInput {
  studentCode: string;
  fullName: string;
  department: string;
  program: string;
  active: boolean;
}

export type ExaminationStatus = 'draft' | 'published' | 'closed';

export interface ExaminationRecord {
  id: string;
  title: string;
  subject: string;
  description: string;
  examDate: string; // YYYY-MM-DD
  questionSetId: string | null;
  rubricTemplateId: string | null;
  passingScore: number;
  status: ExaminationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExaminationFormInput {
  title: string;
  subject: string;
  description: string;
  examDate: string;
  passingScore: string;
  status: ExaminationStatus;
}

export interface AppSettingRecord {
  id: string;
  value: unknown;
  updatedAt: string;
}

export interface QuestionSetRecord {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface QuestionItemRecord {
  id: string;
  questionSetId: string;
  prompt: string;
  createdAt: string;
}

export interface RubricCriterionRecord {
  id: string;
  label: string;
  allowedScores: readonly RubricCriterionScore[];
}

export interface RubricTemplateRecord {
  id: string;
  name: string;
  description?: string;
  criteria: RubricCriterionRecord[];
  maxTotalScore: number;
  createdAt: string;
}

export interface ExaminationResultRecord {
  id: string;
  examinationId: string;
  studentId: string;
  totalScore: number;
  maxScore: number;
  evaluatedAt: string;
}
