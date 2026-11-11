export type SystemId =
  | 'skeletal'
  | 'muscular'
  | 'cardiovascular'
  | 'nervous'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'reproductive';

export type ExamMode = 'spotter' | 'term';

export type ExamSourceType = 'builtin' | 'custom_plates';

export type ExamGrade = 0 | 1 | 2;

export type AppView = 'setup' | 'exam' | 'summary' | 'library' | 'history';

export interface AnatomySystem {
  id: SystemId;
  nameTh: string;
  nameEn: string;
  shortCode: string;
  plateImage: string | 'svg-brain';
  descriptionTh: string;
}

export interface AnatomyTerm {
  id: string;
  systemId: SystemId;
  termEn: string;
  termLatin?: string;
  termTh: string;
  regionTh: string;
  pinX?: number; // Percentage 0-100 across 4:3 plate (optional for custom prompt-only plates)
  pinY?: number; // Percentage 0-100 down 4:3 plate
  svgPartId?: string; // Optional highlight ID for BrainSvgPlate
  clinicalHintTh: string;
  rubric2Pt: string;
  rubric1Pt: string;
  customImageUrl?: string;
  customPlateTitle?: string;
  isCustom?: boolean;
}

export interface CustomPlateTerm {
  id: string;
  systemId: SystemId;
  termEn: string;
  termTh: string;
  clinicalHintTh: string;
  rubric2Pt: string;
  rubric1Pt: string;
  pinX?: number;
  pinY?: number;
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
  sourceType: ExamSourceType;
  selectedSystems: SystemId[];
  selectedCustomPlateIds: string[];
  questionCount: number; // 0 means all available
  secondsPerQuestion: number; // Default 30
  examMode: ExamMode;
  showThaiInPrompt: boolean;
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
  examMode: ExamMode;
  systemIds: SystemId[];
  totalQuestions: number;
  totalScore: number;
  maxScore: number;
  secondsPerQuestion: number;
  startedAt: string;
  completedAt: string;
  answers: ExamAnswerRecord[];
}
