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
import { getSystemTheme } from '../data/systemThemes';

interface SetupLobbyProps {
  systems: AnatomySystem[];
  allTerms: AnatomyTerm[];
  customPlates: CustomPlate[];
  roster: StudentRosterEntry[];
  history: ExamSessionRecord[];
  config: ExamConfig;
  examDescription: string;
  onChangeExamDescription: (next: string) => void;
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
  examDescription,
  onChangeExamDescription,
  onChangeConfig,
  onStartExam,
  onOpenLibrary,
  onQuickUploadForSystem,
  onOpenCustomPlateBuilder,
  onDeleteCustomPlate,
  onOpenRosterModal,
}) => {
  const [isEditingDesc, setIsEditingDesc] = React.useState(false);
  const [draftDesc, setDraftDesc] = React.useState(examDescription);
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
    systems
      .filter((sys) => {
        const hasPlateTerms = selectedPlates.some(
          (p) => p.systemId === sys.id && p.terms.length > 0
        );
        if (hasPlateTerms) return true;
        return (
          config.examScope === 'all8' &&
          allTerms.some((t) => t.systemId === sys.id)
        );
      })
      .map((s) => s.id)
  );

  const uploadedSystemsCount = new Set(customPlates.map((p) => p.systemId)).size;

  const effectiveQuestionCount = systems.reduce((total, sys) => {
    const plateTermCount = selectedPlates
      .filter((p) => p.systemId === sys.id)
      .reduce((acc, p) => acc + p.terms.length, 0);
    const sysTermCount =
      plateTermCount > 0
        ? plateTermCount
        : config.examScope === 'all8'
        ? allTerms.filter((t) => t.systemId === sys.id).length
        : 0;
    if (sysTermCount === 0) return total;
    if (config.termsPerSystem === 0) return total + sysTermCount;
    return total + Math.min(config.termsPerSystem, sysTermCount);
  }, 0);

  const matchingTermsCount = selectedPlates.reduce((acc, p) => acc + p.terms.length, 0);
  const maxPossibleScore = effectiveQuestionCount * 2;
  const canStart = effectiveQuestionCount > 0;

  return (
    <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-8">
      {/* Luminous Medical Atlas Header */}
      <div className="bg-gradient-to-br from-sky-50/95 via-white to-emerald-50/75 border border-sky-200/80 rounded-2xl p-6 md:p-7 shadow-[0_2px_12px_rgba(2,132,199,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-600 mb-2">
              <span>Anatomy Oral Examination Studio</span>
              <span aria-hidden="true" className="text-sky-300">·</span>
              <span className="font-mono tabular-nums">8 Anatomical Systems</span>
              <span aria-hidden="true" className="text-sky-300">·</span>
              <span>ระบบละ 1 คำ · 0–2 คะแนน</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              การสอบปากเปล่าวิชา กายวิภาคศาสตร์
            </h1>

            {isEditingDesc ? (
              <div className="mt-3 space-y-2.5 max-w-2xl">
                <textarea
                  rows={3}
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                  placeholder="พิมพ์รายละเอียดคำอธิบายการสอบด้วยตนเอง เช่น รหัสวิชา ชื่ออาจารย์ผู้สอน หรือคำชี้แจงสำหรับนักศึกษา..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-sky-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeExamDescription(draftDesc.trim());
                      setIsEditingDesc(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>บันทึกคำอธิบาย</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftDesc(examDescription);
                      setIsEditingDesc(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  {examDescription && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftDesc('');
                        onChangeExamDescription('');
                        setIsEditingDesc(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      ลบข้อความ
                    </button>
                  )}
                </div>
              </div>
            ) : examDescription.trim() ? (
              <div className="mt-2 space-y-1.5">
                <p className="text-sm md:text-[15px] text-slate-600 leading-relaxed whitespace-pre-line">
                  {examDescription}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDraftDesc(examDescription);
                    setIsEditingDesc(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  <span>แก้ไขคำอธิบาย</span>
                </button>
              </div>
            ) : (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDraftDesc('');
                    setIsEditingDesc(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-700 bg-white/90 hover:bg-sky-50 border border-sky-200 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>+ ใส่รายละเอียดคำอธิบายการสอบเอง</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenCustomPlateBuilder()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>เพิ่มชุดภาพเอง</span>
            </button>

            <button
              type="button"
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-sky-50/60 hover:border-sky-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>คลังคำศัพท์ 8 ระบบ</span>
            </button>
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
                    <span className="font-mono tabular-nums font-semibold text-sky-700">
                      {matchingTermsCount}
                    </span>{' '}
                    คำ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllCustomPlates}
                    className="px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                  const theme = getSystemTheme(plate.systemId);
                  return (
                    <div
                      key={plate.id}
                      onClick={() => toggleCustomPlate(plate.id)}
                      className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 ring-1 ring-sky-500 shadow-[0_2px_12px_rgba(2,132,199,0.12)]'
                          : 'border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      <div className="relative w-full aspect-[4/3] bg-specimen-stage border-b border-slate-200 overflow-hidden">
                        <img
                          src={plate.imageUrl}
                          alt={plate.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                        {plate.terms.map((t) =>
                          t.targetX !== undefined && t.targetY !== undefined ? (
                            <div
                              key={t.id}
                              style={{
                                left: `${t.targetX}%`,
                                top: `${t.targetY}%`,
                                transform: 'translate(-50%, -50%)',
                              }}
                              className="absolute w-2.5 h-2.5 rounded-full bg-rose-500 ring-1 ring-white shadow-xs pointer-events-none"
                            />
                          ) : null
                        )}
                        <div
                          className={`absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-sky-600 border-sky-500 text-white'
                              : 'bg-slate-900/70 border-white/30 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span className={`inline-flex items-center gap-1.5 font-semibold ${theme.accentText}`}>
                              <AnatomicalSystemIcon
                                systemId={plate.systemId}
                                className={`w-3.5 h-3.5 ${theme.iconText}`}
                              />
                              <span>{sys?.nameTh || plate.systemId}</span>
                            </span>
                            <span className="font-mono tabular-nums font-medium text-slate-600">
                              {(() => {
                                const pinned = plate.terms.filter(
                                  (t) => t.targetX !== undefined && t.targetY !== undefined
                                ).length;
                                return pinned > 0
                                  ? `จุดเลเซอร์ ${pinned} จุด`
                                  : `${plate.terms.length} คำศัพท์`;
                              })()}
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
                            <span>ชี้จุดเลเซอร์ / แก้ไข</span>
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
              <span className="font-mono tabular-nums text-xs font-semibold text-sky-700">
                พร้อมใช้งาน {uploadedSystemsCount} / {systems.length} ระบบ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {systems.map((sys, idx) => {
                const sysTermCount = allTerms.filter((t) => t.systemId === sys.id).length;
                const sysPlatesCount = customPlates.filter((p) => p.systemId === sys.id).length;
                const hasPlate = sysPlatesCount > 0;
                const theme = getSystemTheme(sys.id);

                return (
                  <div
                    key={sys.id}
                    className={`bg-white border rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all hover:shadow-[0_4px_16px_rgba(15,23,42,0.05)] ${
                      hasPlate ? `${theme.softBorder} shadow-xs` : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                          hasPlate
                            ? `${theme.iconBgFilled} border-transparent text-white shadow-xs`
                            : `${theme.iconBg} ${theme.iconBorder} ${theme.iconText}`
                        }`}
                      >
                        <AnatomicalSystemIcon systemId={sys.id} className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className={`truncate font-mono font-semibold ${theme.iconText}`}>
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
                        {hasPlate ? (
                          <p className={`text-xs font-semibold ${theme.accentText} mt-1.5 flex items-center gap-1`}>
                            <Check className="w-3.5 h-3.5" />
                            <span>อัปโหลดแล้ว {sysPlatesCount} ภาพ · ใช้ภาพและเลเซอร์สอบ</span>
                          </p>
                        ) : config.examScope === 'all8' ? (
                          <p className="text-xs text-slate-500 mt-1.5">
                            รวมอยู่ในคิวสอบทั้ง 8 ระบบ (หุ่นจำลองจริง / รออัปโหลดภาพ)
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <label className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-xl transition-colors cursor-pointer whitespace-nowrap ${theme.buttonBg}`}>
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
        <div className="lg:col-span-4 bg-white border border-sky-200/80 rounded-2xl p-5 sticky top-20 shadow-[0_2px_12px_rgba(2,132,199,0.06)]">
          <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">
              2. ข้อมูลผู้เข้าสอบและตั้งค่าเวลา
            </h2>
            <span className="font-mono tabular-nums text-xs text-sky-700 font-semibold">
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
                  className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  {roster.length > 0
                    ? `จัดการรายชื่อ (${roster.length} คน)`
                    : '+ นำเข้ารายชื่อจาก Excel / CSV'}
                </button>
              </div>

              {roster.length > 0 && (() => {
                const isStuTested = (stu: StudentRosterEntry) =>
                  history.some(
                    (h) =>
                      (stu.studentId && h.studentId === stu.studentId) ||
                      (stu.studentName && h.studentName === stu.studentName) ||
                      (stu.seatNumber && h.seatNumber === stu.seatNumber)
                  );
                const testedInRoster = roster.filter(isStuTested).length;
                const nextUntested = roster.find((stu) => !isStuTested(stu));

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono tabular-nums">
                        สอบแล้ว {testedInRoster} / {roster.length} คน
                      </span>
                      {nextUntested && (
                        <button
                          type="button"
                          onClick={() =>
                            onChangeConfig({
                              ...config,
                              seatNumber: nextUntested.seatNumber,
                              studentId: nextUntested.studentId,
                              studentName: nextUntested.studentName,
                            })
                          }
                          className="font-semibold text-sky-600 hover:underline cursor-pointer"
                        >
                          เลือกคนถัดไป (เลขที่ {nextUntested.seatNumber || '-'})
                        </button>
                      )}
                    </div>
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
                      className="w-full px-3 py-2.5 text-xs bg-sky-50/70 border border-sky-200 rounded-xl text-sky-950 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      <option value="">
                        — เลือกนักศึกษาจากบัญชีรายชื่อ ({roster.length} คน) —
                      </option>
                      {roster.map((stu) => {
                        const tested = isStuTested(stu);
                        return (
                          <option key={stu.id} value={stu.id}>
                            เลขที่ {stu.seatNumber || '-'} · {stu.studentId || 'ไม่มีรหัส'} ·{' '}
                            {stu.studentName} {tested ? '(สอบแล้ว)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })()}

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
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Exam Scope: All 8 Systems vs Uploaded Only */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-700">
                  ขอบเขตระบบที่สอบ
                </span>
                <span className="text-xs text-sky-700 font-medium">ค่าเริ่มต้น: ครบ 8 ระบบ</span>
              </div>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
                {[
                  { val: 'all8' as const, label: 'สอบทั้งหมด 8 ระบบ' },
                  { val: 'uploadedOnly' as const, label: 'เฉพาะระบบที่เลือกภาพ' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, examScope: opt.val })}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      config.examScope === opt.val
                        ? 'bg-white text-sky-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Terms Per System */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-700">
                  จำนวนคำศัพท์ที่ถามต่อระบบ
                </span>
                <span className="text-xs text-sky-700 font-medium">สอบจริง: ระบบละ 1 คำ</span>
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
                        ? 'bg-white text-sky-700 font-semibold shadow-xs'
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
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  เวลาจำกัดต่อคำศัพท์
                </span>
                <span className="text-xs text-sky-700 font-medium">มาตรฐาน 30 วินาที</span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                {[20, 30, 45].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, secondsPerQuestion: sec })}
                    className={`py-1.5 text-xs font-medium font-mono tabular-nums rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      config.secondsPerQuestion === sec
                        ? 'bg-white text-sky-700 font-semibold shadow-xs'
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
                <span className="flex items-center gap-2 text-xs font-medium text-slate-700 text-left">
                  <Shuffle className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    {config.shuffle
                      ? 'สุ่มสลับลำดับระบบ (เปิด)'
                      : 'รันทีละระบบตามลำดับ 1–8'}
                  </span>
                </span>
                <span
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
                    config.shuffle ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
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
                    config.autoStartTimer ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
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
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer"
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
