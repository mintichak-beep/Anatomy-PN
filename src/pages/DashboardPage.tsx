import React from 'react';
import {
  Users,
  ClipboardList,
  Clock,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  ListChecks,
  Loader2,
} from 'lucide-react';
import {
  ExaminationRecord,
  NavPageId,
  StudentRecord,
} from '../types/oralExam';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { FeedbackBanner } from '../components/ui/FeedbackBanner';
import { renderStatusLabel } from './ExaminationsPage';

interface DashboardPageProps {
  students: StudentRecord[];
  exams: ExaminationRecord[];
  isLoading: boolean;
  dbError: string | null;
  onNavigate: (page: NavPageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  students,
  exams,
  isLoading,
  dbError,
  onNavigate,
}) => {
  const activeStudentsCount = students.filter((s) => s.active).length;

  const summaryCards = [
    {
      label: 'นักศึกษาทั้งหมด',
      value: students.length,
      unit: 'คน',
      subtext:
        students.length > 0
          ? `ใช้งาน ${activeStudentsCount} คน`
          : 'จากข้อมูลใน IndexedDB',
      icon: Users,
    },
    {
      label: 'การสอบทั้งหมด',
      value: exams.length,
      unit: 'รายการ',
      subtext: 'จากข้อมูลใน IndexedDB',
      icon: ClipboardList,
    },
    {
      label: 'ผู้เข้าสอบที่รอสอบ',
      value: 0,
      unit: 'คน',
      subtext: 'ระบบคิวสอบจะพัฒนาในระยะถัดไป',
      icon: Clock,
    },
    {
      label: 'ผู้เข้าสอบที่สอบเสร็จแล้ว',
      value: 0,
      unit: 'คน',
      subtext: 'ระบบประเมินผลจะพัฒนาในระยะถัดไป',
      icon: CheckCircle2,
    },
  ];

  const quickActions: {
    label: string;
    description: string;
    target: NavPageId;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      label: 'สร้างการสอบ',
      description: 'ไปยังหน้าจัดการรอบการสอบปากเปล่า',
      target: 'examinations',
      icon: ClipboardList,
    },
    {
      label: 'เพิ่มรายชื่อผู้เข้าสอบ',
      description: 'ไปยังหน้าทะเบียนรายชื่อนักศึกษา',
      target: 'students',
      icon: Users,
    },
    {
      label: 'จัดการคลังคำถาม',
      description: 'ไปยังหน้าชุดคำถามและรายการคำถาม',
      target: 'question-bank',
      icon: BookOpen,
    },
    {
      label: 'จัดการเกณฑ์การให้คะแนน',
      description: 'ไปยังหน้าแม่แบบเกณฑ์คะแนน (0 / 1 / 2)',
      target: 'rubrics',
      icon: ListChecks,
    },
  ];

  const recentExams = exams.slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title="หน้าหลัก"
        description="ภาพรวมการจัดการสอบปากเปล่าสำหรับอาจารย์ผู้ประเมิน ข้อมูลนักศึกษาและการสอบเชื่อมต่อกับ IndexedDB ภายในเครื่อง"
      />

      {dbError && <FeedbackBanner variant="error" message={dbError} />}

      {/* Summary Cards */}
      <section aria-label="สรุปข้อมูลภาพรวม">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white border border-slate-200 rounded-xl p-5"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
                  <span>{card.label}</span>
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono tabular-nums text-3xl font-semibold text-slate-900">
                    {isLoading ? '—' : card.value}
                  </span>
                  <span className="text-xs text-slate-500">{card.unit}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">{card.subtext}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Examination Overview & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 space-y-3" aria-label="ภาพรวมการสอบ">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              ภาพรวมการสอบล่าสุดและที่กำลังจะมาถึง
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('examinations')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap cursor-pointer"
            >
              ดูทั้งหมด &rarr;
            </button>
          </div>

          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>กำลังโหลดข้อมูล...</span>
            </div>
          ) : recentExams.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="ยังไม่มีข้อมูล"
              description="ยังไม่มีรายการสอบปากเปล่าในฐานข้อมูล คุณสามารถเริ่มสร้างรายการสอบได้จากหน้าการสอบ"
              action={
                <button
                  type="button"
                  onClick={() => onNavigate('examinations')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>ไปยังหน้าการสอบ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              {recentExams.map((exam) => {
                const statusInfo = renderStatusLabel(exam.status);
                const StatusIcon = statusInfo.Icon;
                return (
                  <div
                    key={exam.id}
                    className="px-4 py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {exam.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        {exam.subject && (
                          <>
                            <span className="truncate">{exam.subject}</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span className="font-mono tabular-nums">{exam.examDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          เกณฑ์ผ่าน {exam.passingScore}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 ${statusInfo.colorClass}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 space-y-3" aria-label="ทางลัดการทำงาน">
          <h2 className="text-base font-semibold text-slate-900">
            ทางลัดการทำงาน
          </h2>

          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.target}
                  type="button"
                  onClick={() => onNavigate(action.target)}
                  className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors first:rounded-t-xl last:rounded-b-xl cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {action.label}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
