import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Download,
  RotateCcw,
  Users,
  Clock,
  Award,
} from 'lucide-react';
import { AnatomySystem, ExamGrade, ExamSessionRecord, StudentRosterEntry } from '../types/anatomy';
import { AnatomicalSystemIcon } from './AnatomicalSystemIcon';
import { getSystemTheme } from '../data/systemThemes';

interface ExamSummaryViewProps {
  session: ExamSessionRecord;
  systems: AnatomySystem[];
  nextUntestedStudent?: StudentRosterEntry | null;
  testedCount?: number;
  totalRosterCount?: number;
  onStartNextStudent: () => void;
  onImmediateNextExam: () => void;
  onRetakeSameConfig: () => void;
  onOpenHistory: () => void;
  onUpdateItemScore: (sessionId: string, termId: string, newScore: ExamGrade) => void;
}

export function exportSessionCsv(session: ExamSessionRecord, systems: AnatomySystem[]) {
  const sysMap = Object.fromEntries(systems.map((s) => [s.id, s.nameTh]));
  const headers = [
    'ข้อที่',
    'เลขที่',
    'รหัสประจำตัว',
    'ชื่อนักศึกษา',
    'ระบบอวัยวะ',
    'คำศัพท์ (EN)',
    'คำศัพท์ (TH)',
    'เวลาที่ใช้ (วินาที)',
    'หมดเวลา',
    'คะแนน (0-2)',
    'หมายเหตุอาจารย์',
  ];

  const rows = session.answers.map((ans, idx) => [
    String(idx + 1),
    session.seatNumber || '-',
    session.studentId || '-',
    session.studentName || 'ไม่ระบุชื่อ',
    sysMap[ans.systemId] || ans.systemId,
    ans.termEn,
    ans.termTh,
    ans.timeSpentSec.toFixed(1),
    ans.timedOut ? 'ใช่' : 'ไม่',
    String(ans.score),
    ans.note || '',
  ]);

  const escapeCsv = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  const csvContent =
    '\uFEFF' +
    [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (session.studentId || session.studentName || 'student')
    .replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
  link.href = url;
  link.download = `anatomy-oral-${safeName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const ExamSummaryView: React.FC<ExamSummaryViewProps> = ({
  session,
  systems,
  nextUntestedStudent,
  testedCount = 0,
  totalRosterCount = 0,
  onStartNextStudent,
  onImmediateNextExam,
  onRetakeSameConfig,
  onOpenHistory,
  onUpdateItemScore,
}) => {
  const pct = session.maxScore > 0 ? Math.round((session.totalScore / session.maxScore) * 100) : 0;
  const avgTime =
    session.answers.length > 0
      ? session.answers.reduce((acc, a) => acc + a.timeSpentSec, 0) / session.answers.length
      : 0;

  const count2 = session.answers.filter((a) => a.score === 2).length;
  const count1 = session.answers.filter((a) => a.score === 1).length;
  const count0 = session.answers.filter((a) => a.score === 0).length;

  const assessment =
    pct >= 80
      ? {
          label: 'ผ่านเกณฑ์ดีเยี่ยม (Pass)',
          color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
          icon: <Award className="w-5 h-5 text-emerald-600" />,
        }
      : pct >= 60
      ? {
          label: 'ผ่านเกณฑ์มาตรฐาน (Pass)',
          color: 'text-sky-800 bg-sky-50 border-sky-200',
          icon: <CheckCircle2 className="w-5 h-5 text-sky-600" />,
        }
      : {
          label: 'ไม่ผ่านเกณฑ์ (Fail)',
          color: 'text-rose-800 bg-rose-50 border-rose-200',
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
        };

  // System breakdown
  const systemBreakdown = session.systemIds
    .map((sysId) => {
      const sys = systems.find((s) => s.id === sysId);
      const items = session.answers.filter((a) => a.systemId === sysId);
      if (items.length === 0) return null;
      const earned = items.reduce((acc, a) => acc + a.score, 0);
      const max = items.length * 2;
      return {
        id: sysId,
        nameTh: sys?.nameTh || sysId,
        nameEn: sys?.nameEn || sysId,
        count: items.length,
        earned,
        max,
        pct: Math.round((earned / max) * 100),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="max-w-[1160px] mx-auto px-6 py-8 space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
            <span>สรุปผลการสอบ Oral Test</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {new Date(session.completedAt).toLocaleString('th-TH')}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {session.seatNumber && (
              <span className="mr-3 text-lg font-mono font-semibold text-teal-800">
                เลขที่ {session.seatNumber}
              </span>
            )}
            {session.studentName || 'นักศึกษา (ไม่ระบุชื่อ)'}
            {session.studentId && (
              <span className="ml-3 text-lg font-mono font-medium text-slate-500">
                {session.studentId}
              </span>
            )}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportSessionCsv(session, systems)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            type="button"
            onClick={onRetakeSameConfig}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>สอบชุดเดิมอีกครั้ง</span>
          </button>

          {totalRosterCount > 0 && (
            <span className="text-xs font-mono tabular-nums text-slate-500 mr-1">
              สอบแล้ว {testedCount}/{totalRosterCount} คน
            </span>
          )}

          <button
            type="button"
            onClick={onStartNextStudent}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>ไปหน้าเลือกคนถัดไป</span>
          </button>

          <button
            type="button"
            onClick={nextUntestedStudent ? onImmediateNextExam : onStartNextStudent}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>
              {nextUntestedStudent
                ? `เริ่มสอบคนถัดไปทันที (เลขที่ ${nextUntestedStudent.seatNumber || '-'})`
                : 'สอบนักศึกษาคนถัดไป'}
            </span>
          </button>
        </div>
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">คะแนนรวมที่ได้</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="font-mono tabular-nums text-3xl font-bold text-slate-900">
              {session.totalScore}
            </span>
            <span className="font-mono tabular-nums text-sm text-slate-500">
              / {session.maxScore} คะแนน ({pct}%)
            </span>
          </div>
        </div>

        <div className={`border rounded-xl p-4 flex flex-col justify-between ${assessment.color}`}>
          <p className="text-xs opacity-80">ผลการประเมินภาพรวม</p>
          <div className="flex items-center gap-2 mt-1.5">
            {assessment.icon}
            <span className="text-base font-bold">{assessment.label}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">การกระจายคะแนน (0 / 1 / 2)</p>
          <div className="flex items-center gap-4 mt-2 font-mono tabular-nums text-sm">
            <span className="text-emerald-700 font-semibold">2 คะแนน: {count2}</span>
            <span className="text-amber-700 font-semibold">1 คะแนน: {count1}</span>
            <span className="text-rose-700 font-semibold">0 คะแนน: {count0}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">เวลาตอบเฉลี่ยต่อคำศัพท์</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className="font-mono tabular-nums text-2xl font-bold text-slate-900">
              {avgTime.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">/ {session.secondsPerQuestion} วินาที</span>
          </div>
        </div>
      </div>

      {/* Breakdown by System */}
      {systemBreakdown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            คะแนนแยกตามระบบอวัยวะ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {systemBreakdown.map((sb) => {
              const st = getSystemTheme(sb.id);
              return (
                <div key={sb.id} className={`border ${st.softBorder} rounded-xl p-3.5 ${st.softBg}`}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 truncate">
                      <AnatomicalSystemIcon systemId={sb.id} className={`w-4 h-4 ${st.iconText} shrink-0`} />
                      <span className="truncate">{sb.nameTh}</span>
                    </span>
                    <span className={`font-mono tabular-nums font-bold ${st.accentText} shrink-0`}>
                      {sb.earned}/{sb.max}
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 w-full bg-white/90 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${st.barFill} rounded-full`}
                      style={{ width: `${sb.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 font-mono tabular-nums">
                    {sb.count} ข้อ · {sb.pct}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Item-by-Item Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            รายละเอียดคะแนนรายภาพ ({session.answers.length} ข้อ)
          </h2>
          <button
            type="button"
            onClick={onOpenHistory}
            className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer whitespace-nowrap shrink-0"
          >
            ดูและดาวน์โหลดคะแนนภาพรวมทุกคน &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-14">ข้อ</th>
                <th className="py-3 px-4">คำศัพท์กายวิภาค</th>
                <th className="py-3 px-4">ระบบอวัยวะ</th>
                <th className="py-3 px-4 text-right">เวลาที่ใช้</th>
                <th className="py-3 px-4 text-center">คะแนน (0–2)</th>
                <th className="py-3 px-4">หมายเหตุอาจารย์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {session.answers.map((ans, idx) => {
                const sys = systems.find((s) => s.id === ans.systemId);
                return (
                  <tr key={`${ans.termId}-${idx}`} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{ans.termEn}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {sys?.nameTh || ans.systemId}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs">
                      <span className={ans.timedOut ? 'text-rose-600 font-semibold' : 'text-slate-700'}>
                        {ans.timeSpentSec.toFixed(1)}s
                      </span>
                      {ans.timedOut && (
                        <span className="block text-[11px] text-rose-500">หมดเวลา</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                        {([0, 1, 2] as ExamGrade[]).map((val) => {
                          const active = ans.score === val;
                          const activeCls =
                            val === 2
                              ? 'bg-emerald-600 text-white'
                              : val === 1
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-600 text-white';
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => onUpdateItemScore(session.id, ans.termId, val)}
                              className={`w-7 h-7 rounded-md font-mono tabular-nums text-xs font-bold transition-colors cursor-pointer ${
                                active ? activeCls : 'text-slate-600 hover:bg-white'
                              }`}
                              title={`แก้ไขเป็น ${val} คะแนน`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {ans.note || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
