import React from 'react';
import {
  Play,
  Users,
  ClipboardList,
  CheckCircle2,
  BookOpen,
  Download,
  AlertTriangle,
  History,
  ArrowRight,
} from 'lucide-react';
import { FullAppState } from '../services/oralExamService';
import { AppSection } from '../types/blueprint';

interface DashboardViewProps {
  state: FullAppState;
  onNavigate: (section: AppSection) => void;
  onResumeCandidate: (examId: string, candidateId: string) => void;
  onQuickBackup: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onNavigate,
  onResumeCandidate,
  onQuickBackup,
}) => {
  const activeStudentsCount = state.students.filter((s) => s.active).length;
  const completedCandidatesCount = state.examCandidates.filter(
    (c) => c.status === 'Completed'
  ).length;
  const activeQuestionsCount = state.questions.filter((q) => q.active).length;

  const inProgressCandidates = state.examCandidates.filter((c) => c.status === 'In Progress');
  const lastBackupText = state.settings.lastBackupAt
    ? new Date(state.settings.lastBackupAt).toLocaleString('th-TH')
    : 'ยังไม่เคยสำรองข้อมูล';

  return (
    <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-teal-800 mb-2">
              <span>General Oral Examination Management System</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Local-First IndexedDB</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Single Operator</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              ระบบบริหารจัดการการสอบปากเปล่า (Game-Based Oral Test)
            </h1>
            <p className="text-sm md:text-[15px] text-slate-600 mt-2 leading-relaxed">
              จัดการรอบสอบ คิวนักศึกษา คลังคำถาม เกณฑ์ Rubric (0–2 คะแนน) และควบคุมเวลาการสอบแยกทีละคำถามแบบตัวต่อตัว
              ข้อมูลทั้งหมดถูกจัดเก็บบนเบราว์เซอร์เครื่องนี้
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onQuickBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-700" />
              <span>สำรองข้อมูล JSON</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('exams')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>จัดการรอบสอบ &amp; คิวสอบ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recovery Banner if any Candidate is currently In Progress */}
      {inProgressCandidates.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-amber-950">
                พบการสอบที่กำลังดำเนินการอยู่ ({inProgressCandidates.length} คน) — กู้คืนเวลาจากระบบจริงอัตโนมัติ
              </h2>
              <div className="mt-1 space-y-1">
                {inProgressCandidates.map((cand) => {
                  const stu = state.students.find((s) => s.id === cand.studentId);
                  const exam = state.exams.find((e) => e.id === cand.examId);
                  return (
                    <p key={cand.id} className="text-xs text-amber-900">
                      <span className="font-mono font-semibold">{stu?.studentCode}</span>{' '}
                      <span className="font-semibold">{stu?.fullName}</span> · รอบสอบ{' '}
                      {exam?.title || cand.examId}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                onResumeCandidate(inProgressCandidates[0].examId, inProgressCandidates[0].id)
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>เข้าห้องสอบต่อทันที</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>รอบสอบทั้งหมด</span>
            <ClipboardList className="w-4 h-4 text-teal-700" />
          </div>
          <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1.5">
            {state.exams.length}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">รอบ</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>นักศึกษาที่ใช้งานอยู่</span>
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1.5">
            {activeStudentsCount}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">
              / {state.students.length} คน
            </span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>ประเมินและส่งผลสอบแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-mono tabular-nums text-2xl font-bold text-emerald-700 mt-1.5">
            {completedCandidatesCount}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">
              / {state.examCandidates.length} คิว
            </span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>คลังคำถาม / Rubric</span>
            <BookOpen className="w-4 h-4 text-teal-700" />
          </div>
          <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1.5">
            {activeQuestionsCount}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">
              ข้อ · {state.rubricTemplates.length} Rubric
            </span>
          </p>
        </div>
      </div>

      {/* Main 2-Column Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Exam Rounds List */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">รอบสอบล่าสุด</h2>
            <button
              type="button"
              onClick={() => onNavigate('exams')}
              className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer whitespace-nowrap"
            >
              จัดการรอบสอบทั้งหมด &rarr;
            </button>
          </div>

          {state.exams.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              ยังไม่มีรอบสอบ กรุณาสร้างรอบสอบแรกเพื่อเริ่มจัดคิวนักศึกษา
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {state.exams.slice(0, 6).map((exam) => {
                const cands = state.examCandidates.filter((c) => c.examId === exam.id);
                const done = cands.filter((c) => c.status === 'Completed').length;
                const waiting = cands.filter((c) => c.status === 'Waiting').length;
                const mins = Math.round(exam.questionTimeLimitSeconds / 60);

                return (
                  <div
                    key={exam.id}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono tabular-nums">{exam.examDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{exam.subject}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-teal-800 font-medium">
                          ข้อละ {mins} นาที
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        คิวทั้งหมด {cands.length} คน · รอสอบ {waiting} · เสร็จแล้ว {done} · ผ่าน{' '}
                        {exam.passingScore} คะแนน
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('exams')}
                      className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
                    >
                      เปิดจัดการคิว
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Backup Safety Notice & Audit Trail */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-bold text-slate-900">ความปลอดภัยข้อมูล (Local-first)</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              ระบบจัดเก็บข้อมูลทั้งหมดใน IndexedDB บนเบราว์เซอร์เครื่องนี้ ไม่มีการส่งขึ้นคลาวด์
              หากล้างข้อมูลเบราว์เซอร์หรือเปลี่ยนอุปกรณ์ข้อมูลอาจสูญหาย กรุณาส่งออกไฟล์สำรอง JSON เป็นประจำ
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">สำรองข้อมูลล่าสุด:</span>
              <span className="font-mono tabular-nums font-medium text-slate-800">
                {lastBackupText}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="w-full py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer"
            >
              ไปที่หน้าสำรอง / กู้คืนข้อมูล JSON
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-700" />
                <span>ประวัติการแก้ไขและเหตุการณ์ล่าสุด</span>
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('results')}
                className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
              >
                ดูทั้งหมด
              </button>
            </div>
            {state.auditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                ยังไม่มีประวัติการเปลี่ยนแปลงใน Audit Log
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {state.auditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="px-4 py-3 text-xs space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <span className="font-mono tabular-nums text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600">{log.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
