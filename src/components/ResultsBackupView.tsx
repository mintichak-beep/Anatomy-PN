import React, { useState } from 'react';
import {
  Download,
  Upload,
  Search,
  History,
  FileSpreadsheet,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import {
  FullAppState,
  createBackupPayload,
  restoreFromBackupPayload,
} from '../services/oralExamService';

interface ResultsBackupViewProps {
  state: FullAppState;
  onRefreshState: () => Promise<void>;
  onOpenCandidateAssessment: (examId: string, candidateId: string) => void;
}

export const ResultsBackupView: React.FC<ResultsBackupViewProps> = ({
  state,
  onRefreshState,
  onOpenCandidateAssessment,
}) => {
  const [filterExamId, setFilterExamId] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const submittedAssessments = state.assessments
    .filter((a) => {
      if (filterExamId !== 'all' && a.examId !== filterExamId) return false;
      const cand = state.examCandidates.find((c) => c.id === a.examCandidateId);
      const stu = cand ? state.students.find((s) => s.id === cand.studentId) : undefined;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        (stu?.studentCode || '').toLowerCase().includes(q) ||
        (stu?.fullName || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (b.submittedAt || b.updatedAt).localeCompare(a.submittedAt || a.updatedAt));

  const handleExportJson = async () => {
    setErrorMsg('');
    setStatusMsg('');
    try {
      const payload = await createBackupPayload();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oral-exam-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await onRefreshState();
      setStatusMsg('ส่งออกไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถส่งออกข้อมูล JSON ได้');
    }
  };

  const handleRestoreJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setStatusMsg('');

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const summary = await restoreFromBackupPayload(parsed);
      await onRefreshState();
      setStatusMsg(
        `กู้คืนข้อมูลสำเร็จ: นักศึกษา ${summary.studentsCount} คน, รอบสอบ ${summary.examsCount} รอบ, ผลสอบ ${summary.assessmentsCount} รายการ`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไฟล์สำรอง JSON ไม่ถูกต้อง');
    } finally {
      e.target.value = '';
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'รอบสอบ',
      'รหัสนักศึกษา',
      'ชื่อ-นามสกุล',
      'คะแนนรวม',
      'คะแนนเต็ม',
      'ผลสอบ',
      'สถานะ',
      'เวลาที่ส่งผล',
    ];
    const rows = submittedAssessments.map((a) => {
      const exam = state.exams.find((e) => e.id === a.examId);
      const cand = state.examCandidates.find((c) => c.id === a.examCandidateId);
      const stu = cand ? state.students.find((s) => s.id === cand.studentId) : undefined;
      const maxScore = a.rubricSnapshot.criteria.length * 2;
      return [
        exam?.title || a.examId,
        stu?.studentCode || '-',
        stu?.fullName || '-',
        String(a.totalScore),
        String(maxScore),
        a.result,
        a.status,
        a.submittedAt ? new Date(a.submittedAt).toLocaleString('th-TH') : '-',
      ];
    });
    const escapeCsv = (cell: string) => `"${String(cell).replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + [headers, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oral-exam-results-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ผลการสอบย้อนหลัง Audit Log และการสำรองข้อมูล
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            ตรวจสอบผลสอบที่บันทึกจาก Rubric Snapshot ดูประวัติการแก้ไขผลสอบ และสำรอง/กู้คืนฐานข้อมูล IndexedDB ด้วยไฟล์ JSON
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={submittedAssessments.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออกตารางผลสอบ (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Backup JSON ทั้งระบบ</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl whitespace-nowrap shrink-0 cursor-pointer">
            <Upload className="w-4 h-4 text-teal-700" />
            <span>Restore จาก JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreJsonFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium px-4 py-3 rounded-xl">
          {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium px-4 py-3 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Backup Warning */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5 text-slate-600">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            การ Restore จากไฟล์ JSON จะแทนที่ข้อมูลใน IndexedDB ทั้งหมดด้วยข้อมูลจากไฟล์สำรอง
            แนะนำให้กด &ldquo;Backup JSON ทั้งระบบ&rdquo; เก็บไว้ก่อนดำเนินการกู้คืน
          </span>
        </div>
        <span className="font-mono tabular-nums text-slate-500 shrink-0">
          Backup ล่าสุด:{' '}
          {state.settings.lastBackupAt
            ? new Date(state.settings.lastBackupAt).toLocaleString('th-TH')
            : 'ยังไม่เคยสำรอง'}
        </span>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">
            บันทึกผลการประเมิน ({submittedAssessments.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">ทุกรอบสอบ</option>
              {state.exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>

            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหารหัส / ชื่อ..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">รอบสอบ</th>
                <th className="py-3 px-4">รหัสนักศึกษา</th>
                <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                <th className="py-3 px-4 text-right">คะแนน (Snapshot)</th>
                <th className="py-3 px-4 text-center">ผลสอบ</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">ตรวจสอบ / แก้ไข</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submittedAssessments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-xs text-slate-500">
                    ยังไม่มีบันทึกผลการประเมิน
                  </td>
                </tr>
              ) : (
                submittedAssessments.map((a) => {
                  const exam = state.exams.find((e) => e.id === a.examId);
                  const cand = state.examCandidates.find((c) => c.id === a.examCandidateId);
                  const stu = cand ? state.students.find((s) => s.id === cand.studentId) : undefined;
                  const maxScore = a.rubricSnapshot.criteria.length * 2;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {exam?.title || a.examId}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs font-semibold text-slate-900">
                        {stu?.studentCode || '—'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {stu?.fullName || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {a.totalScore} / {maxScore}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs font-bold">
                        <span
                          className={
                            a.result === 'PASS' ? 'text-emerald-700' : 'text-rose-700'
                          }
                        >
                          {a.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {a.status === 'submitted' ? 'ล็อกผลแล้ว' : 'ฉบับร่าง (Draft)'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenCandidateAssessment(a.examId, a.examCandidateId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-50 rounded-lg cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>เปิดดู / แก้ไข</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <History className="w-4 h-4 text-teal-700" />
          <h2 className="text-base font-bold text-slate-900">
            Audit Log — ประวัติการแก้ไขและเปลี่ยนสถานะ ({state.auditLogs.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <th className="py-3 px-4">วัน-เวลา</th>
                <th className="py-3 px-4">ประเภท / Action</th>
                <th className="py-3 px-4">เหตุผล</th>
                <th className="py-3 px-4">รายละเอียดการเปลี่ยนแปลง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    ยังไม่มีบันทึก Audit Log
                  </td>
                </tr>
              ) : (
                state.auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('th-TH')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-slate-900 block">
                        {log.action}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {log.entityType} · {log.entityId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{log.reason}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-md truncate">
                      {log.previousValue ? JSON.stringify(log.previousValue) : '—'} &rarr;{' '}
                      {log.newValue ? JSON.stringify(log.newValue) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
