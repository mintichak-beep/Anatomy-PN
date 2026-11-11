import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BookOpen,
  ListChecks,
  BarChart3,
  HardDriveDownload,
  LucideIcon,
} from 'lucide-react';
import { NavPageId } from '../types/oralExam';

export interface NavItem {
  id: NavPageId;
  labelTh: string;
  descriptionTh: string;
  icon: LucideIcon;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    labelTh: 'หน้าหลัก',
    descriptionTh: 'ภาพรวมระบบการสอบปากเปล่า',
    icon: LayoutDashboard,
  },
  {
    id: 'examinations',
    labelTh: 'การสอบ',
    descriptionTh: 'จัดการรอบการสอบปากเปล่า',
    icon: ClipboardList,
  },
  {
    id: 'students',
    labelTh: 'รายชื่อผู้เข้าสอบ',
    descriptionTh: 'ทะเบียนนักศึกษาผู้เข้าสอบ',
    icon: Users,
  },
  {
    id: 'question-bank',
    labelTh: 'คลังคำถาม',
    descriptionTh: 'ชุดคำถามและรายการคำถาม',
    icon: BookOpen,
  },
  {
    id: 'rubrics',
    labelTh: 'เกณฑ์การให้คะแนน',
    descriptionTh: 'โครงสร้างเกณฑ์ประเมิน (0 / 1 / 2 คะแนน)',
    icon: ListChecks,
  },
  {
    id: 'results',
    labelTh: 'ผลการสอบ',
    descriptionTh: 'สรุปผลการประเมินผู้เข้าสอบ',
    icon: BarChart3,
  },
  {
    id: 'backup',
    labelTh: 'สำรองและกู้คืนข้อมูล',
    descriptionTh: 'การจัดเก็บข้อมูลภายในเครื่อง (Local-First)',
    icon: HardDriveDownload,
  },
];
