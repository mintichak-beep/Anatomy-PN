import React, { useState } from 'react';
import {
  Download,
  Search,
  Trash2,
  Eye,
  FileSpreadsheet,
  Users,
  Award,
  TrendingUp,
} from 'lucide-react';
import { AnatomySystem, ExamSessionRecord } from '../types/anatomy';

interface HistoryViewProps {
  sessions: ExamSessionRecord[];
  systems: AnatomySystem[];
  onViewSession: (session: ExamSessionRecord) => void;
  onDeleteSession: (id: string) => void;
  onClearAllHistory: () => void;
  onStartNewExam: () => void;
}

function downloadCsvFile(filename: string, headers: string[], rows: string[][]) {
  const escapeCsv = (cell: string) => `"${String(cell).replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + [headers, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  systems,
  onViewSession,
  onDeleteSession,
  onClearAllHistory,
  onStartNewExam,
}) => {
  const [query, setQuery] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filtered = sessions.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      s.studentName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      (s.seatNumber || '').toLowerCase().includes(q)
    );
  });

  // Class overview metrics
  const totalStudents = filtered.length;
  const percentages = filtered.map((s) =>
    s.maxScore > 0 ? (s.totalScore / s.maxScore) * 100 : 0
  );
  const avgPct =
    totalStudents > 0
      ? Math.round(percentages.reduce((a, b) => a + b, 0) / totalStudents)
      : 0;
  const maxPct = totalStudents > 0 ? Math.round(Math.max(...percentages)) : 0;
  const minPct = totalStudents > 0 ? Math.round(Math.min(...percentages)) : 0;
  const passCount = percentages.filter((p) => p >= 60).length;

  const exportOverviewCsv = () => {
    const sysCols = systems.map((sys) => `${sys.nameTh} (${sys.shortCode})`);
    const headers = [
      'ลำดับ',
      'วันที่-เวลาที่สอบ',
      'เลขที่',
      'รหัสประจำตัว',
      'ชื่อ-นามสกุลนักศึกษา',
      'จำนวนข้อที่สอบ',
      'คะแนนที่ได้',
      'คะแนนเต็ม',
      'ร้อยละ (%)',
      'ผลการประเมิน',
      'เวลาเฉลี่ยต่อคำ (วินาที)',
      ...sysCols,
    ];

    const rows = filtered.map((s, idx) => {
      const pct = s.maxScore > 0 ? Math.round((s.totalScore / s.maxScore) * 100) : 0;
      const evalLabel =
        pct >= 80 ? 'ผ่านเกณฑ์ดีเยี่ยม' : pct >= 60 ? 'ผ่านเกณฑ์มาตรฐาน' : 'ควรทบทวนเพิ่มเติม';
      const avgSec =
        s.answers.length > 0
          ? (
              s.answers.reduce((acc, a) => acc + a.timeSpentSec, 0) / s.answers.length
            ).toFixed(1)
          : '0.0';

      const sysScores = systems.map((sys) => {
        const items = s.answers.filter((a) => a.systemId === sys.id);
        if (items.length === 0) return '-';
        const earned = items.reduce((acc, a) => acc + a.score, 0);
        return `${earned}/${items.length * 2}`;
      });

      return [
        String(idx + 1),
        new Date(s.completedAt).toLocaleString('th-TH'),
        s.seatNumber || '-',
        s.studentId || '-',
        s.studentName || 'ไม่ระบุชื่อ',
        String(s.totalQuestions),
        String(s.totalScore),
        String(s.maxScore),
        `${pct}%`,
        evalLabel,
        avgSec,
        ...sysScores,
      ];
    });

    downloadCsvFile(
      `anatomy-oral-overview-${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  const exportDetailedAllCsv = () => {
    const sysMap = Object.fromEntries(systems.map((s) => [s.id, s.nameTh]));
    const headers = [
      'วันที่-เวลาที่สอบ',
      'เลขที่',
      'รหัสประจำตัว',
      'ชื่อ-นามสกุลนักศึกษา',
      'ข้อที่',
      'ระบบอวัยวะ',
      'คำศัพท์ (EN)',
      'คำศัพท์ (TH)',
      'เวลาที่ใช้ (วินาที)',
      'หมดเวลา',
      'คะแนน (0-2)',
      'หมายเหตุอาจารย์',
    ];

    const rows: string[][] = [];
    for (const s of filtered) {
      s.answers.forEach((ans, idx) => {
        rows.push([
          new Date(s.completedAt).toLocaleString('th-TH'),
          s.seatNumber || '-',
          s.studentId || '-',
          s.studentName || 'ไม่ระบุชื่อ',
          String(idx + 1),
          sysMap[ans.systemId] || ans.systemId,
          ans.termEn,
          ans.termTh,
          ans.timeSpentSec.toFixed(1),
          ans.timedOut ? 'ใช่' : 'ไม่',
          String(ans.score),
          ans.note || '',
        ]);
      });
    }

    downloadCsvFile(
      `anatomy-oral-detailed-all-${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            คะแนนภาพรวมและประวัติการสอบนักศึกษา
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            รวมคะแนนการสอบปากเปล่าที่อาจารย์บันทึกไว้ทั้งหมด พร้อมส่งออกเป็นรายงานภาพรวมและรายละเอียดรายข้อ (CSV)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {filtered.length > 0 && (
            <>
              <button
                type="button"
                onClick={exportOverviewCsv}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดคะแนนภาพรวมทั้งหมด (CSV)</span>
              </button>
              <button
                type="button"
                onClick={exportDetailedAllCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>ดาวน์โหลดรายข้อทุกคน (CSV)</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onStartNewExam}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>จัดชุดสอบใหม่</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Strip when sessions exist */}
      {totalStudents > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>จำนวนนักศึกษาที่สอบแล้ว</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1.5">
              {totalStudents} <span className="text-xs font-sans font-normal text-slate-500">คน</span>
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>คะแนนเฉลี่ยภาพรวม</span>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <p className="font-mono tabular-nums text-2xl font-bold text-teal-800 mt-1.5">
              {avgPct}%
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>คะแนนสูงสุด / ต่ำสุด</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1.5">
              {maxPct}% <span className="text-sm font-normal text-slate-400">/ {minPct}%</span>
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>ผ่านเกณฑ์ (&ge; 60%)</span>
              <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                {Math.round((passCount / totalStudents) * 100)}%
              </span>
            </div>
            <p className="font-mono tabular-nums text-2xl font-bold text-emerald-700 mt-1.5">
              {passCount} <span className="text-xs font-sans font-normal text-slate-500">/ {totalStudents} คน</span>
            </p>
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาเลขที่ รหัสประจำตัว หรือชื่อนักศึกษา..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>

          {confirmClearAll ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-rose-700 font-medium">ยืนยันลบประวัติทั้งหมด?</span>
              <button
                type="button"
                onClick={() => {
                  onClearAllHistory();
                  setConfirmClearAll(false);
                }}
                className="px-3 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                ลบทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-3 py-1.5 font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 cursor-pointer"
            >
              ล้างประวัติทั้งหมด
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-800">ยังไม่มีประวัติการสอบที่บันทึกไว้</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            เมื่ออาจารย์ดำเนินการสอบและกดสรุปผลคะแนน ระบบจะบันทึกประวัตินักศึกษาแต่ละคนไว้ที่นี่โดยอัตโนมัติ
          </p>
          <button
            type="button"
            onClick={onStartNewExam}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg cursor-pointer"
          >
            <span>เริ่มสอบนักศึกษาคนแรก</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">วัน-เวลา</th>
                  <th className="py-3 px-4 w-20">เลขที่</th>
                  <th className="py-3 px-4">นักศึกษา</th>
                  <th className="py-3 px-4">ระบบที่สอบ</th>
                  <th className="py-3 px-4 text-right">คะแนน</th>
                  <th className="py-3 px-4 text-right">ร้อยละ</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const pct = s.maxScore > 0 ? Math.round((s.totalScore / s.maxScore) * 100) : 0;
                  const sysNames = s.systemIds
                    .map((id) => systems.find((sys) => sys.id === id)?.nameTh || id)
                    .join(', ');
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {new Date(s.completedAt).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-700">
                        {s.seatNumber || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">
                          {s.studentName || 'นักศึกษา (ไม่ระบุชื่อ)'}
                        </p>
                        {s.studentId && (
                          <p className="text-xs font-mono text-slate-500">{s.studentId}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {sysNames}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {s.totalScore} / {s.maxScore}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span
                          className={`font-semibold ${
                            pct >= 80
                              ? 'text-emerald-700'
                              : pct >= 60
                              ? 'text-sky-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewSession(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 rounded-lg cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูผล</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSession(s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                            aria-label="ลบประวัติ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
