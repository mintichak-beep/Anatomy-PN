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
  Eye,
} from 'lucide-react';
import {
  AnatomySystem,
  AnatomyTerm,
  CustomPlate,
  ExamConfig,
  ExamMode,
  ExamSessionRecord,
  ExamSourceType,
  StudentRosterEntry,
  SystemId,
} from '../types/anatomy';
import { BrainSvgPlate } from './BrainSvgPlate';

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
  onOpenCustomPlateBuilder: (plate?: CustomPlate) => void;
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
  onOpenCustomPlateBuilder,
  onDeleteCustomPlate,
  onOpenRosterModal,
}) => {
  const toggleSystem = (id: SystemId) => {
    const exists = config.selectedSystems.includes(id);
    const next = exists
      ? config.selectedSystems.filter((s) => s !== id)
      : [...config.selectedSystems, id];
    onChangeConfig({ ...config, selectedSystems: next });
  };

  const selectAllSystems = () => {
    onChangeConfig({ ...config, selectedSystems: systems.map((s) => s.id) });
  };

  const clearSystems = () => {
    onChangeConfig({ ...config, selectedSystems: [] });
  };

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

  const switchSourceType = (sourceType: ExamSourceType) => {
    if (sourceType === 'custom_plates') {
      onChangeConfig({
        ...config,
        sourceType,
        examMode: 'term',
        selectedCustomPlateIds:
          config.selectedCustomPlateIds.length > 0
            ? config.selectedCustomPlateIds
            : customPlates.map((p) => p.id),
      });
    } else {
      onChangeConfig({
        ...config,
        sourceType,
      });
    }
  };

  const matchingTermsCount =
    config.sourceType === 'custom_plates'
      ? customPlates
          .filter((p) => config.selectedCustomPlateIds.includes(p.id))
          .reduce((acc, p) => acc + p.terms.length, 0)
      : allTerms.filter((t) => config.selectedSystems.includes(t.systemId)).length;

  const effectiveQuestionCount =
    config.questionCount === 0
      ? matchingTermsCount
      : Math.min(config.questionCount, matchingTermsCount);
  const maxPossibleScore = effectiveQuestionCount * 2;
  const canStart = effectiveQuestionCount > 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Editorial Intro Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-sky-700 mb-1.5">
            Anatomy Oral Examination Studio · เกณฑ์คะแนน 0–2 ต่อภาพ
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            จัดชุดสอบปากเปล่าวิชา กายวิภาคศาสตร์
          </h1>
          <p className="text-sm md:text-base text-slate-600 mt-1.5 leading-relaxed">
            เลือกใช้คลังภาพมาตรฐานตามระบบอวัยวะ หรืออัปโหลดภาพของคุณเองเพื่อให้ระบบสุ่มถามคำศัพท์
            จับเวลาคำละไม่เกิน {config.secondsPerQuestion} วินาที และให้คะแนน 0–2 คะแนน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => onOpenCustomPlateBuilder()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            <span>กำหนดภาพเอง</span>
          </button>

          <button
            type="button"
            onClick={onOpenLibrary}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>คลังคำศัพท์</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
        {/* Left Column: Source Switcher + Cards */}
        <div className="lg:col-span-8 space-y-5">
          {/* Source Type Segmented Tabs */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => switchSourceType('builtin')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                config.sourceType === 'builtin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              คลังภาพมาตรฐาน ({systems.length} ระบบ)
            </button>
            <button
              type="button"
              onClick={() => switchSourceType('custom_plates')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                config.sourceType === 'custom_plates'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ภาพที่อาจารย์กำหนดเอง ({customPlates.length})
            </button>
          </div>

          {config.sourceType === 'builtin' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    1. เลือกระบบอวัยวะสำหรับออกข้อสอบ
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เลือกแล้ว {config.selectedSystems.length} จาก {systems.length} ระบบ · มีคำศัพท์พร้อมสอบ{' '}
                    <span className="font-mono tabular-nums font-medium text-slate-700">
                      {matchingTermsCount}
                    </span>{' '}
                    คำ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllSystems}
                    className="px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    เลือกทุกระบบ
                  </button>
                  <button
                    type="button"
                    onClick={clearSystems}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    ล้างการเลือก
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {systems.map((sys) => {
                  const isSelected = config.selectedSystems.includes(sys.id);
                  const count = allTerms.filter((t) => t.systemId === sys.id).length;

                  return (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() => toggleSystem(sys.id)}
                      className={`group text-left bg-white rounded-xl border transition-all overflow-hidden flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                        isSelected
                          ? 'border-sky-600 ring-1 ring-sky-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="relative w-full aspect-[4/3] bg-[#F5F2EA] overflow-hidden border-b border-slate-100">
                        {sys.plateImage === 'svg-brain' ? (
                          <BrainSvgPlate className="w-full h-full" />
                        ) : (
                          <img
                            src={sys.plateImage}
                            alt={sys.nameEn}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          />
                        )}
                        <div
                          className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-sky-600 border-sky-600 text-white'
                              : 'bg-white/90 border-slate-300 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                            <span>{sys.nameEn}</span>
                            <span className="font-mono tabular-nums">{count} คำ</span>
                          </div>
                          <h3 className="text-base font-semibold text-slate-900 leading-snug">
                            {sys.nameTh}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {sys.descriptionTh}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Custom Plates Mode: Teacher uploads own images, system asks which terms to answer */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    1. เลือกชุดภาพของอาจารย์ (ระบบจะสุ่มถามคำศัพท์บนภาพ)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เลือกแล้ว {config.selectedCustomPlateIds.length} ชุดภาพ · รวมคำศัพท์พร้อมสุ่มถาม{' '}
                    <span className="font-mono tabular-nums font-medium text-slate-700">
                      {matchingTermsCount}
                    </span>{' '}
                    คำ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {customPlates.length > 0 && (
                    <button
                      type="button"
                      onClick={selectAllCustomPlates}
                      className="px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      เลือกทุกภาพ
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenCustomPlateBuilder()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>อัปโหลดภาพใหม่</span>
                  </button>
                </div>
              </div>

              {customPlates.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
                  <ImagePlus className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-900">
                    ยังไม่มีภาพที่อาจารย์กำหนดเอง
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                    อัปโหลดภาพกายวิภาคหรือภาพหุ่นจำลองของคุณ แล้วเลือกคำศัพท์ที่ต้องการให้ระบบสุ่มถาม
                    นักศึกษาจะเห็นภาพของคุณพร้อมคำถามทีละคำภายใน 30 วินาที
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenCustomPlateBuilder()}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg cursor-pointer"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span>อัปโหลดภาพแรกของคุณ</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customPlates.map((plate) => {
                    const isSelected = config.selectedCustomPlateIds.includes(plate.id);
                    const sys = systems.find((s) => s.id === plate.systemId);
                    return (
                      <div
                        key={plate.id}
                        onClick={() => toggleCustomPlate(plate.id)}
                        className={`bg-white rounded-xl border transition-all overflow-hidden flex flex-col cursor-pointer ${
                          isSelected
                            ? 'border-sky-600 ring-1 ring-sky-600'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="relative w-full aspect-[4/3] bg-[#F5F2EA] border-b border-slate-100 overflow-hidden">
                          <img
                            src={plate.imageUrl}
                            alt={plate.title}
                            className="w-full h-full object-contain"
                          />
                          <div
                            className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                              isSelected
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'bg-white/90 border-slate-300 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                              <span>{sys?.nameTh || plate.systemId}</span>
                              <span className="font-mono tabular-nums font-medium text-sky-800">
                                {plate.terms.length} คำศัพท์
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                              {plate.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {plate.terms.map((t) => t.termEn).join(' · ')}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenCustomPlateBuilder(plate);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
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
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                              aria-label="ลบชุดภาพ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Student & Exam Configuration */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-slate-900 pb-3 border-b border-slate-100">
            2. ข้อมูลผู้เข้าสอบและตั้งค่าเวลา
          </h2>

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
                  className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer whitespace-nowrap"
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
                    className="w-full px-3 py-2 text-xs bg-sky-50 border border-sky-200 rounded-lg text-sky-950 font-medium focus:outline-none focus:ring-2 focus:ring-sky-600 cursor-pointer"
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
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
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
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
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
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Exam Mode Segmented Control */}
            <div>
              <span className="block text-xs font-medium text-slate-700 mb-1.5">
                รูปแบบการถาม
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'term', label: 'ระบบถามคำศัพท์' },
                    { id: 'spotter', label: 'ชี้หมุดถามชื่อ' },
                  ] as { id: ExamMode; label: string }[]
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, examMode: mode.id })}
                    className={`px-2.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      config.examMode === mode.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {config.examMode === 'term'
                  ? 'ระบบสุ่มคำศัพท์ขึ้นบนภาพให้นักศึกษาชี้ตำแหน่งและอธิบายคำศัพท์นั้น'
                  : 'ระบบปักหมุดสีแดงบนภาพและซ่อนชื่อ ให้นักศึกษาตอบชื่อโครงสร้าง (ถ้าคำใดไม่ปักหมุดจะแสดงคำถามให้แทน)'}
              </p>
            </div>

            {/* Show Thai toggle when in Term prompt mode */}
            {config.examMode === 'term' && (
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({ ...config, showThaiInPrompt: !config.showThaiInPrompt })
                }
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <Eye className="w-4 h-4 text-slate-500" />
                  แสดงคำแปลภาษาไทยในคำถาม
                </span>
                <span
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                    config.showThaiInPrompt ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </span>
              </button>
            )}

            {/* Question Count */}
            <div>
              <span className="block text-xs font-medium text-slate-700 mb-1.5">
                จำนวนข้อที่จะสุ่มถามในรอบนี้
              </span>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
                {[5, 10, 15, 0].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, questionCount: num })}
                    className={`py-1.5 text-xs font-medium font-mono tabular-nums rounded-md transition-colors cursor-pointer ${
                      config.questionCount === num
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {num === 0 ? 'ทั้งหมด' : `${num} ข้อ`}
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
                <span className="text-xs text-sky-700 font-medium">มาตรฐาน 30 วินาที</span>
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                {[20, 30, 45].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onChangeConfig({ ...config, secondsPerQuestion: sec })}
                    className={`py-1.5 text-xs font-medium font-mono tabular-nums rounded-md transition-colors cursor-pointer ${
                      config.secondsPerQuestion === sec
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sec} วินาที
                  </button>
                ))}
              </div>
            </div>

            {/* Shuffle Toggle */}
            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, shuffle: !config.shuffle })}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <Shuffle className="w-4 h-4 text-slate-500" />
                สุ่มลำดับคำศัพท์ที่ถาม
              </span>
              <span
                className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                  config.shuffle ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </span>
            </button>

            {/* Auto-start Timer Toggle */}
            <button
              type="button"
              onClick={() => onChangeConfig({ ...config, autoStartTimer: !config.autoStartTimer })}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
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
                <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </span>
            </button>

            {/* Summary Metrics Strip */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>จำนวนข้อที่สอบจริง</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {effectiveQuestionCount} ข้อ · เต็ม {maxPossibleScore} คะแนน
              </span>
            </div>

            <button
              type="button"
              disabled={!canStart}
              onClick={onStartExam}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>เริ่มการสอบ Oral Test</span>
            </button>

            {!canStart && (
              <p className="text-xs text-rose-600 text-center">
                {config.sourceType === 'custom_plates'
                  ? 'กรุณาอัปโหลดและเลือกชุดภาพอย่างน้อย 1 ภาพ'
                  : 'กรุณาเลือกระบบอวัยวะอย่างน้อย 1 ระบบก่อนเริ่มสอบ'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
