import React from 'react';
import {
  Play,
  Check,
  Shuffle,
  Clock,
  UserCheck,
  BookOpen,
  ImagePlus,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AnatomySystem,
  AnatomyTerm,
  CustomPlate,
  ExamConfig,
  ExamSessionRecord,
  StudentRosterEntry,
  SystemId,
} from '../types/anatomy';
import { AnatomicalSystemIcon } from './AnatomicalSystemIcon';

interface SetupLobbyProps {
  systems: AnatomySystem[];
  allTerms: AnatomyTerm[];
  customPlates: CustomPlate[];
  roster: StudentRosterEntry[];
  history: ExamSessionRecord[];
  config: ExamConfig;
  onChangeConfig: (next: ExamConfig) => void;
  onStartExam: () => void;
  onOpenLibrary: () => void;
  onQuickUploadForSystem: (systemId: SystemId, imageUrl: string) => void;
  onOpenCustomPlateBuilder: (plate?: CustomPlate, systemId?: SystemId) => void;
  onDeleteCustomPlate: (id: string) => void;
  onOpenRosterModal: () => void;
}

export const SetupLobby: React.FC<SetupLobbyProps> = ({
  systems,
  allTerms,
  customPlates,
  roster,
  history,
  config,
  onChangeConfig,
  onStartExam,
  onOpenLibrary,
  onQuickUploadForSystem,
  onOpenCustomPlateBuilder,
  onDeleteCustomPlate,
  onOpenRosterModal,
}) => {
  const toggleCustomPlate = (id: string) => {
    const exists = config.selectedCustomPlateIds.includes(id);
    const next = exists
      ? config.selectedCustomPlateIds.filter((p) => p !== id)
      : [...config.selectedCustomPlateIds, id];
    onChangeConfig({ ...config, selectedCustomPlateIds: next });
  };

  const selectAllCustomPlates = () => {
    onChangeConfig({
      ...config,
      selectedCustomPlateIds: customPlates.map((p) => p.id),
    });
  };

  const clearCustomPlatesSelection = () => {
    onChangeConfig({
      ...config,
      selectedCustomPlateIds: [],
    });
  };

  const handleQuickFileChange = (systemId: SystemId, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1080;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          onQuickUploadForSystem(systemId, canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const selectedPlates = customPlates.filter((p) =>
    config.selectedCustomPlateIds.includes(p.id)
  );

  const selectedSystemsCovered = new Set(
    selectedPlates.filter((p) => p.terms.length > 0).map((p) => p.systemId)
  );

  const uploadedSystemsCount = new Set(customPlates.map((p) => p.systemId)).size;

  const effectiveQuestionCount = systems.reduce((total, sys) => {
    const sysTermCount = selectedPlates
      .filter((p) => p.systemId === sys.id)
      .reduce((acc, p) => acc + p.terms.length, 0);
    if (sysTermCount === 0) return total;
    if (config.termsPerSystem === 0) return total + sysTermCount;
    return total + Math.min(config.termsPerSystem, sysTermCount);
  }, 0);

  const matchingTermsCount = selectedPlates.reduce((acc, p) => acc + p.terms.length, 0);
  const maxPossibleScore = effectiveQuestionCount * 2;
  const canStart = effectiveQuestionCount > 0;

  return (
    <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-8">
      {/* Editorial Clinical Atlas Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-teal-800 mb-2">
              <span>Anatomy Oral Examination Studio</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="font-mono tabular-nums">8 Anatomical Systems</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>ระบบละ 1 คำ · 0–2 คะแนน</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              จัดชุดสอบปากเปล่าวิชา กายวิภาคศาสตร์
            </h1>
            <p className="text-sm md:text-[15px] text-slate-600 mt-2 leading-relaxed">
              อัปโหลดภาพสื่อการสอนของอาจารย์ในแต่ละระบบ ระบบจะสุ่มถามนักศึกษาคนละ 1 คำต่อระบบโดยไม่แสดงคำเฉลย
              จับเวลาข้อละไม่เกิน {config.secondsPerQuestion} วินาที และอาจารย์ควบคุมการให้คะแนน 0–2 คะแนนได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenCustomPlateBuilder()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>เพิ่มชุดภาพเอง</span>
            </button>

            <button
              type="button"
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>คลังคำศัพท์ 8 ระบบ</span>
            </button>
          </div>
        </div>

        {/* Clean Unboxed Workflow Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-3">
            <span className="font-mono tabular-nums font-bold text-teal-700 mt-0.5">01.</span>
            <div>
              <p className="font-semibold text-slate-900">อัปโหลดภาพทั้ง 8 ระบบ</p>
              <p className="text-slate-500 mt-0.5">ใช้ภาพหุ่นจำลองหรือภาพกายวิภาคของอาจารย์เอง ไม่มีคลังภาพมาตรฐาน</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono tabular-nums font-bold text-teal-700 mt-0.5">02.</span>
            <div>
              <p className="font-semibold text-slate-900">เลือกเลขที่ · รหัส · ชื่อผู้เข้าสอบ</p>
              <p className="text-slate-500 mt-0.5">นำเข้ารายชื่อจาก Excel หรือเลือกจากบัญชีรายชื่อได้ทันที</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono tabular-nums font-bold text-teal-700 mt-0.5">03.</span>
            <div>
              <p className="font-semibold text-slate-900">สุ่มถามและประเมิน 0–2 คะแนน</p>
              <p className="text-slate-500 mt-0.5">จับเวลา {config.secondsPerQuestion} วินาทีต่อคำ ไม่มีคำเฉลยขึ้นหน้าจอ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
        {/* Left Column: Uploaded Plates & 8 Systems Quick Upload */}
        <div className="lg:col-span-8 space-y-8">
          {/* Uploaded Custom Plates Section */}
          {customPlates.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    ชุดภาพของอาจารย์ที่พร้อมใช้สอบ ({customPlates.length} ภาพ)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เลือกใช้สอบ {config.selectedCustomPlateIds.length} ภาพ · คำศัพท์พร้อมสุ่มถาม{' '}
                    <span className="font-mono tabular-nums font-semibold text-teal-800">
                      {matchingTermsCount}
                    </span>{' '}
                    คำ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllCustomPlates}
                    className="px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    เลือกทุกภาพ
                  </button>
                  <button
                    type="button"
                    onClick={clearCustomPlatesSelection}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    ล้างการเลือก
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customPlates.map((plate) => {
                  const isSelected = config.selectedCustomPlateIds.includes(plate.id);
                  const sys = systems.find((s) => s.id === plate.systemId);
                  return (
                    <div
                      key={plate.id}
                      onClick={() => toggleCustomPlate(plate.id)}
                      className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 ring-1 ring-teal-600 shadow-[0_2px_10px_rgba(15,118,110,0.08)]'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="relative w-full aspect-[4/3] bg-specimen-stage border-b border-slate-200 overflow-hidden">
                        <img
                          src={plate.imageUrl}
                          alt={plate.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                        <div
                          className={`absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-teal-600 border-teal-500 text-white'
                              : 'bg-slate-900/70 border-white/30 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5 font-medium text-teal-800">
                              <AnatomicalSystemIcon
                                systemId={plate.systemId}
                                className="w-3.5 h-3.5"
                              />
                              <span>{sys?.nameTh || plate.systemId}</span>
                            </span>
                            <span className="font-mono tabular-nums font-medium text-slate-600">
                              {plate.terms.length} คำศัพท์
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">
                            {plate.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {plate.terms.map((t) => t.termEn).join(' · ')}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCustomPlateBuilder(plate);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>แก้ไขคำศัพท์</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCustomPlate(plate.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            aria-label="ลบชุดภาพ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8 Anatomical Systems Atlas Grid */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {customPlates.length > 0
                    ? 'อัปโหลดภาพเพิ่มตามระบบ (8 ระบบกายวิภาคศาสตร์)'
                    : '1. เลือกและอัปโหลดภาพตามระบบ (8 ระบบกายวิภาคศาสตร์)'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  อัปโหลดภาพเข้าระบบที่ต้องการสอบ ระบบจะสุ่มคำศัพท์ของระบบนั้นคนละ 1 คำเมื่อเริ่มสอบจริง
                </p>
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-teal-800">
                พร้อมใช้งาน {uploadedSystemsCount} / {systems.length} ระบบ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {systems.map((sys, idx) => {
                const sysTermCount = allTerms.filter((t) => t.systemId === sys.id).length;
                const sysPlatesCount = customPlates.filter((p) => p.systemId === sys.id).length;
                const hasPlate = sysPlatesCount > 0;

                return (
                  <div
                    key={sys.id}
                    className={`bg-white border rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-colors ${
                      hasPlate ? 'border-teal-200' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                          hasPlate
                            ? 'bg-teal-700 border-teal-700 text-white'
                            : 'bg-teal-50/70 border-teal-100 text-teal-800'
                        }`}
                      >
                        <AnatomicalSystemIcon systemId={sys.id} className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="truncate font-mono">
                            0{idx + 1} · {sys.nameEn}
                          </span>
                          <span className="font-mono tabular-nums shrink-0 text-slate-500">
                            {sysTermCount} คำ
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">
                          {sys.nameTh}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {sys.descriptionTh}
                        </p>
                        {hasPlate && (
                          <p className="text-xs font-medium text-teal-700 mt-1.5 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>อัปโหลดแล้ว {sysPlatesCount} ภาพ</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-50/90 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap">
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        <span>อัปโหลดภาพระบบนี้</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleQuickFileChange(sys.id, e)}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => onOpenCustomPlateBuilder(undefined, sys.id)}
                        className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        เลือกคำศัพท์
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Student & Exam Configuration */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 sticky top-20 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">
              2. ข้อมูลผู้เข้าสอบและตั้งค่าเวลา
            </h2>
            <span className="font-mono tabular-nums text-xs text-teal-700 font-semibold">
              {effectiveQuestionCount} ข้อ
            </span>
          </div>

          <div className="space-y-5 mt-4">
            {/* Student Details + Roster Picker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  ข้อมูลนักศึกษาผู้เข้าสอบ
                </span>
                <button
                  type="button"
                  onClick={onOpenRosterModal}
                  className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  {roster.length > 0
                    ? `จัดการรายชื่อ (${roster.length} คน)`
                    : '+ นำเข้ารายชื่อจาก Excel / CSV'}
                </button>
              </div>

              {roster.length > 0 && (
                <div>
                  <select
                    value=""
                    onChange={(e) => {
                      const picked = roster.find((r) => r.id === e.target.value);
                      if (picked) {
                        onChangeConfig({
                          ...config,
                          seatNumber: picked.seatNumber,
                          studentId: picked.studentId,
                          studentName: picked.studentName,
                        });
                      }
                    }}
                    className="w-full px-3 py-2.5 text-xs bg-teal-50/70 border border-teal-200 rounded-xl text-teal-950 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                  >
                    <option value="">
                      — เลือกนักศึกษาจากบัญชีรายชื่อ ({roster.length} คน) —
                    </option>
                    {roster.map((stu) => {
                      const tested = history.some(
                        (h) =>
                          (stu.studentId && h.studentId === stu.studentId) ||
                          (stu.studentName && h.studentName === stu.studentName)
                      );
                      return (
                        <option key={stu.id} value={stu.id}>
                          เลขที่ {stu.seatNumber || '-'} · {stu.studentId || 'ไม่มีรหัส'} ·{' '}
                          {stu.studentName} {tested ? '(สอบแล้ว)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-12 gap-2.5">
                <div className="col-span-4">
                  <label
                    htmlFor="seat-number"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    เลขที่
                  </label>
                  <input
                    id="seat-number"
                    type="text"
                    value={config.seatNumber}
                    onChange={(e) => onChangeConfig({ ...config, seatNumber: e.target.value })}
                    placeholder="เช่น 12"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>

                <div className="col-span-8">
                  <label
                    htmlFor="student-id"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    รหัสประจำตัว
                  </label>
                  <input
                    id="student-id"
                    type="text"
                    value={config.studentId}
                    onChange={(e) => onChangeConfig({ ...config, studentId: e.target.value })}
                    placeholder="เช่น 6701042"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="student-name"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  ชื่อ-นามสกุล นักศึกษา
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="student-name"
                    type="text"
                    value={config.studentName}
                    onChange={(e) => onChangeConfig({ ...config, studentName: e.target.value })}
                    placeholder="เช่น นศ.พ. กิตติพงศ์ ใจดี"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Terms Per System */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-700">
                  จำนวนคำศัพท์ที่ถามต่อระบบ
                </span>
                <span className="text-xs text-teal-700 font-medium">สอบจริง: ระบบละ 1 คำ</span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                {[
                  { val: 1, label: 'ระบบละ 1 คำ' },
                  { val: 2, label: 'ระบบละ 2 คำ' },
                  { val: 0, label: 'ทั้งหมด' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, termsPerSystem: opt.val })}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      config.termsPerSystem === opt.val
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Seconds Per Question */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  เวลาจำกัดต่อคำศัพท์
                </span>
                <span className="text-xs text-teal-700 font-medium">มาตรฐาน 30 วินาที</span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                {[20, 30, 45].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, secondsPerQuestion: sec })}
                    className={`py-1.5 text-xs font-medium font-mono tabular-nums rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      config.secondsPerQuestion === sec
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sec} วินาที
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, shuffle: !config.shuffle })}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <Shuffle className="w-4 h-4 text-slate-500" />
                  สุ่มลำดับระบบที่ถาม
                </span>
                <span
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                    config.shuffle ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, autoStartTimer: !config.autoStartTimer })}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <Clock className="w-4 h-4 text-slate-500" />
                  เริ่มจับเวลาทันทีเมื่อขึ้นข้อใหม่
                </span>
                <span
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                    config.autoStartTimer ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </span>
              </button>
            </div>

            {/* Summary Metrics Strip */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>จำนวนข้อที่สอบ ({selectedSystemsCovered.size} ระบบ)</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {effectiveQuestionCount} ข้อ · เต็ม {maxPossibleScore} คะแนน
              </span>
            </div>

            <button
              type="button"
              disabled={!canStart}
              onClick={onStartExam}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>เริ่มการสอบ Oral Test</span>
            </button>

            {!canStart && (
              <p className="text-xs text-rose-600 text-center">
                กรุณาอัปโหลดและเลือกภาพอย่างน้อย 1 ภาพจาก 8 ระบบด้านซ้าย
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
