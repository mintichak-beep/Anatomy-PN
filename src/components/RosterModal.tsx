import React, { useState } from 'react';
import { X, Plus, Trash2, Upload, Users, Download } from 'lucide-react';
import { StudentRosterEntry } from '../types/anatomy';

interface RosterModalProps {
  roster: StudentRosterEntry[];
  onAddEntry: (entry: StudentRosterEntry) => void;
  onAddBatch: (entries: StudentRosterEntry[]) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onSelectStudent: (entry: StudentRosterEntry) => void;
  onClose: () => void;
}

function parseRosterText(raw: string): StudentRosterEntry[] {
  const lines = raw
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed: StudentRosterEntry[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Split by tab (Excel copy-paste), comma, semicolon, or pipe
    const parts = line
      .split(/\t|,|;|\|/)
      .map((p) => p.replace(/^"|"$/g, '').trim());

    if (parts.length === 0) continue;

    // Skip header row if detected
    const joined = parts.join(' ').toLowerCase();
    if (
      i === 0 &&
      (joined.includes('ชื่อ') || joined.includes('รหัส') || joined.includes('เลขที่') || joined.includes('name'))
    ) {
      continue;
    }

    let seatNumber = '';
    let studentId = '';
    let studentName = '';

    if (parts.length >= 3) {
      seatNumber = parts[0];
      studentId = parts[1];
      studentName = parts.slice(2).join(' ');
    } else if (parts.length === 2) {
      // Could be (studentId, name) or (seat, name)
      if (parts[0].length <= 3 && /^\d+$/.test(parts[0])) {
        seatNumber = parts[0];
        studentName = parts[1];
      } else {
        studentId = parts[0];
        studentName = parts[1];
      }
    } else {
      studentName = parts[0];
    }

    if (!studentName && !studentId) continue;

    parsed.push({
      id: `stu-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      seatNumber: seatNumber || String(parsed.length + 1),
      studentId,
      studentName,
    });
  }
  return parsed;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  roster,
  onAddEntry,
  onAddBatch,
  onDeleteEntry,
  onClearAll,
  onSelectStudent,
  onClose,
}) => {
  const [seatNumber, setSeatNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [tab, setTab] = useState<'list' | 'import'>('list');

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() && !studentId.trim()) return;
    const entry: StudentRosterEntry = {
      id: `stu-${Date.now()}`,
      seatNumber: seatNumber.trim() || String(roster.length + 1),
      studentId: studentId.trim(),
      studentName: studentName.trim(),
    };
    onAddEntry(entry);
    setSeatNumber('');
    setStudentId('');
    setStudentName('');
  };

  const handleImportPaste = () => {
    const entries = parseRosterText(pasteText);
    if (entries.length === 0) return;
    onAddBatch(entries);
    setPasteText('');
    setTab('list');
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const entries = parseRosterText(reader.result);
        if (entries.length > 0) {
          onAddBatch(entries);
          setTab('list');
        }
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDelete = (id: string) => {
    onDeleteEntry(id);
  };

  const handleGenerateSeats = (count: number) => {
    const generated: StudentRosterEntry[] = Array.from({ length: count }, (_, idx) => ({
      id: `stu-auto-${Date.now()}-${idx + 1}`,
      seatNumber: String(idx + 1),
      studentId: '',
      studentName: `นักศึกษา เลขที่ ${idx + 1}`,
    }));
    onAddBatch(generated);
  };

  const handleDownloadSampleCsv = () => {
    const headers = ['เลขที่', 'รหัสประจำตัว', 'ชื่อ-นามสกุล'];
    const rows = Array.from({ length: 30 }, (_, idx) => {
      const num = idx + 1;
      const padded = String(num).padStart(2, '0');
      return [String(num), `67010${padded}`, `นศ. ตัวอย่างที่ ${num}`];
    });
    const escapeCsv = (cell: string) => `"${String(cell).replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + [headers, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anatomy-roster-template-30.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 my-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              จัดการรายชื่อนักศึกษา (เลขที่ · รหัสประจำตัว · ชื่อ)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เพิ่มรายชื่อหรือวางข้อมูลจาก Excel / CSV เพื่อให้เลือกตัวนักศึกษาเข้าสอบได้ทันที
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setTab('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                tab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              รายชื่อทั้งหมด ({roster.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('import')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                tab === 'import' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              นำเข้าจาก Excel / CSV
            </button>
          </div>

          {roster.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
            >
              ล้างรายชื่อทั้งหมด
            </button>
          )}
        </div>

        {tab === 'list' ? (
          <div className="mt-4 space-y-4">
            {/* Quick Add Single Student */}
            <form onSubmit={handleAddSingle} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value)}
                placeholder="เลขที่"
                className="sm:col-span-2 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="รหัสประจำตัว"
                className="sm:col-span-3 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="ชื่อ-นามสกุล นักศึกษา"
                className="sm:col-span-5 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
              <button
                type="submit"
                disabled={!studentName.trim() && !studentId.trim()}
                className="sm:col-span-2 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่ม</span>
              </button>
            </form>

            {/* Roster Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {roster.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-3">
                  <Users className="w-8 h-8 text-sky-300 mx-auto" />
                  <p>
                    ยังไม่มีรายชื่อนักศึกษา สามารถเพิ่มรายคนด้านบน นำเข้าจาก Excel / CSV
                    หรือสร้างคิวสอบเลขที่ 1–30 อัตโนมัติได้ทันที
                  </p>
                  <button
                    type="button"
                    onClick={() => handleGenerateSeats(30)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>สร้างคิวเลขที่ 1–30 อัตโนมัติ</span>
                  </button>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3 w-16">เลขที่</th>
                        <th className="py-2.5 px-3 w-36">รหัสประจำตัว</th>
                        <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                        <th className="py-2.5 px-3 text-right w-32">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {roster.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono tabular-nums text-slate-700">
                            {item.seatNumber || '-'}
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums text-slate-600">
                            {item.studentId || '-'}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {item.studentName}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectStudent(item);
                                onClose();
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded mr-1 cursor-pointer"
                            >
                              เลือกสอบ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer align-middle"
                              aria-label="ลบรายชื่อ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
              <div className="text-emerald-900">
                <span className="font-semibold">รูปแบบไฟล์ที่รองรับ:</span>{' '}
                <span>3 คอลัมน์ (เลขที่, รหัสประจำตัว, ชื่อ-นามสกุล) เปิดแก้ใน Excel แล้วนำเข้าได้ทันที</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดไฟล์ตัวอย่าง 30 คน (.CSV)</span>
              </button>
            </div>

            <label className="flex items-center justify-center gap-2 w-full px-4 py-3 text-xs font-semibold text-sky-700 bg-sky-50 border border-dashed border-sky-300 rounded-xl hover:bg-sky-100 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>อัปโหลดไฟล์ .CSV รายชื่อนักศึกษา (คอลัมน์: เลขที่, รหัสประจำตัว, ชื่อ-นามสกุล)</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </label>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                หรือคัดลอกจาก Excel / Google Sheets มาวางที่นี่โดยตรง
              </label>
              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={'1\t6701001\tนศ.พ. กิตติพงศ์ ใจดี\n2\t6701002\tนศ.พ. ณัฐณิชา สุขสม\n3, 6701003, นศ.พ. ธนกร รักเรียน'}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleImportPaste}
                disabled={!pasteText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-lg cursor-pointer"
              >
                นำเข้ารายชื่อที่วาง
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
