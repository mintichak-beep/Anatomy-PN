export type SystemId =
  | 'respiratory'
  | 'digestive'
  | 'nervous'
  | 'female_reproductive'
  | 'male_reproductive'
  | 'urinary'
  | 'cardiovascular'
  | 'endocrine';

export type ExamGrade = 0 | 1 | 2;

export type AppView = 'setup' | 'exam' | 'summary' | 'library' | 'history';

export interface AnatomySystem {
  id: SystemId;
  nameTh: string;
  nameEn: string;
  shortCode: string;
  descriptionTh: string;
}

export interface AnatomyTerm {
  id: string;
  systemId: SystemId;
  termEn: string;
  termLatin?: string;
  termTh: string;
  customImageUrl?: string;
  customPlateTitle?: string;
  isCustom?: boolean;
}

export interface CustomPlateTerm {
  id: string;
  systemId: SystemId;
  termEn: string;
  termTh: string;
}

export interface CustomPlate {
  id: string;
  title: string;
  systemId: SystemId;
  imageUrl: string;
  terms: CustomPlateTerm[];
  createdAt: string;
}

export interface StudentRosterEntry {
  id: string;
  seatNumber: string;
  studentId: string;
  studentName: string;
}

export interface ExamConfig {
  studentName: string;
  studentId: string;
  seatNumber: string;
  selectedCustomPlateIds: string[];
  termsPerSystem: number; // 1 = 1 term per system (actual exam), 2 = 2 per system, 0 = all
  secondsPerQuestion: number; // Default 30
  shuffle: boolean;
  autoStartTimer: boolean;
}

export interface ExamAnswerRecord {
  termId: string;
  systemId: SystemId;
  termEn: string;
  termTh: string;
  score: ExamGrade;
  timeSpentSec: number;
  timedOut: boolean;
  note: string;
  gradedAt: string;
}

export interface ExamSessionRecord {
  id: string;
  studentName: string;
  studentId: string;
  seatNumber?: string;
  systemIds: SystemId[];
  totalQuestions: number;
  totalScore: number;
  maxScore: number;
  secondsPerQuestion: number;
  startedAt: string;
  completedAt: string;
  answers: ExamAnswerRecord[];
}
