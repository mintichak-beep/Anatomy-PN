import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Flag,
} from 'lucide-react';
import {
  AnatomySystem,
  AnatomyTerm,
  ExamAnswerRecord,
  ExamConfig,
  ExamGrade,
} from '../types/anatomy';
import { AnatomyStageCanvas } from './AnatomyStageCanvas';
import { playScoreSound, playTickSound, playTimeUpSound } from '../utils/sound';

interface LiveExamViewProps {
  terms: AnatomyTerm[];
  systems: AnatomySystem[];
  config: ExamConfig;
  onCompleteExam: (answers: ExamAnswerRecord[], startedAt: string) => void;
  onCancelExam: () => void;
}

export const LiveExamView: React.FC<LiveExamViewProps> = ({
  terms,
  systems,
  config,
  onCompleteExam,
  onCancelExam,
}) => {
  const [startedAt] = useState(() => new Date().toISOString());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(config.secondsPerQuestion * 1000);
  const [isRunning, setIsRunning] = useState(config.autoStartTimer);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, ExamAnswerRecord>>({});
  const [targetOverrides, setTargetOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const [draftNote, setDraftNote] = useState('');
  const [confirmEnd, setConfirmEnd] = useState(false);

  const lastSecondRef = useRef<number>(config.secondsPerQuestion);
  const timeUpPlayedRef = useRef<boolean>(false);

  const currentTerm = terms[currentIndex] || terms[0];
  const currentSystem = currentTerm
    ? systems.find((s) => s.id === currentTerm.systemId) || systems[0]
    : systems[0];
  const currentAnswer = currentTerm ? answers[currentTerm.id] : undefined;

  const totalMs = config.secondsPerQuestion * 1000;
  const remainingSec = Math.max(0, timeLeftMs / 1000);
  const progressFraction = Math.max(0, Math.min(1, timeLeftMs / totalMs));
  const isTimedOut = timeLeftMs <= 0;
  const isWarning = !isTimedOut && remainingSec <= 10;

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= 0) return 0;
        return Math.max(0, prev - 100);
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    const wholeSec = Math.ceil(timeLeftMs / 1000);

    if (wholeSec !== lastSecondRef.current) {
      lastSecondRef.current = wholeSec;
      if (wholeSec > 0 && wholeSec <= 5) {
        playTickSound(isMuted);
      }
    }

    if (timeLeftMs === 0 && !timeUpPlayedRef.current) {
      timeUpPlayedRef.current = true;
      setIsRunning(false);
      playTimeUpSound(isMuted);
    }
  }, [isRunning, timeLeftMs, isMuted]);

  const loadQuestion = useCallback(
    (index: number) => {
      const target = terms[index];
      if (!target) return;
      setCurrentIndex(index);
      const existing = answers[target.id];
      setDraftNote(existing?.note || '');

      if (existing) {
        setIsRunning(false);
        const spentMs = existing.timeSpentSec * 1000;
        setTimeLeftMs(Math.max(0, totalMs - spentMs));
        lastSecondRef.current = Math.ceil(Math.max(0, totalMs - spentMs) / 1000);
        timeUpPlayedRef.current = existing.timedOut;
      } else {
        setTimeLeftMs(totalMs);
        lastSecondRef.current = config.secondsPerQuestion;
        timeUpPlayedRef.current = false;
        setIsRunning(config.autoStartTimer);
      }
    },
    [answers, config.autoStartTimer, config.secondsPerQuestion, totalMs, terms]
  );

  const handleResetTimer = useCallback(() => {
    setTimeLeftMs(totalMs);
    lastSecondRef.current = config.secondsPerQuestion;
    timeUpPlayedRef.current = false;
    setIsRunning(true);
  }, [config.secondsPerQuestion, totalMs]);

  const handleAddFiveSeconds = () => {
    setTimeLeftMs((prev) => prev + 5000);
    timeUpPlayedRef.current = false;
  };

  const handleGrade = useCallback(
    (score: ExamGrade) => {
      if (!currentTerm) return;
      const elapsedSec = Number(
        Math.min(config.secondsPerQuestion, Math.max(0, (totalMs - timeLeftMs) / 1000)).toFixed(1)
      );
      const override = targetOverrides[currentTerm.id];
      const record: ExamAnswerRecord = {
        termId: currentTerm.id,
        systemId: currentTerm.systemId,
        termEn: currentTerm.termEn,
        termTh: currentTerm.termTh,
        score,
        timeSpentSec: elapsedSec,
        timedOut: timeLeftMs <= 0,
        note: draftNote.trim(),
        gradedAt: new Date().toISOString(),
        targetX: override?.x ?? currentTerm.targetX,
        targetY: override?.y ?? currentTerm.targetY,
      };

      setAnswers((prev) => ({ ...prev, [currentTerm.id]: record }));
      setIsRunning(false);
      playScoreSound(score, isMuted);

      if (autoAdvance && currentIndex < terms.length - 1) {
        window.setTimeout(() => {
          loadQuestion(currentIndex + 1);
        }, 260);
      }
    },
    [autoAdvance, config.secondsPerQuestion, currentIndex, currentTerm, draftNote, isMuted, loadQuestion, targetOverrides, terms.length, timeLeftMs, totalMs]
  );

  const handleNoteChange = (val: string) => {
    setDraftNote(val);
    if (currentTerm && currentAnswer) {
      setAnswers((prev) => ({
        ...prev,
        [currentTerm.id]: { ...currentAnswer, note: val },
      }));
    }
  };

  const handleFinish = useCallback(() => {
    const orderedRecords: ExamAnswerRecord[] = terms.map((term) => {
      const existing = answers[term.id];
      if (existing) return existing;
      const override = targetOverrides[term.id];
      return {
        termId: term.id,
        systemId: term.systemId,
        termEn: term.termEn,
        termTh: term.termTh,
        score: 0,
        timeSpentSec: 0,
        timedOut: false,
        note: 'ไม่ได้บันทึกคะแนน',
        gradedAt: new Date().toISOString(),
        targetX: override?.x ?? term.targetX,
        targetY: override?.y ?? term.targetY,
      };
    });
    onCompleteExam(orderedRecords, startedAt);
  }, [answers, onCompleteExam, startedAt, targetOverrides, terms]);

  const handleNext = useCallback(() => {
    if (currentIndex < terms.length - 1) {
      loadQuestion(currentIndex + 1);
    } else {
      handleFinish();
    }
  }, [currentIndex, handleFinish, loadQuestion, terms.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      loadQuestion(currentIndex - 1);
    }
  }, [currentIndex, loadQuestion]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isTimedOut) setIsRunning((r) => !r);
      } else if (e.key === '0') {
        e.preventDefault();
        handleGrade(0);
      } else if (e.key === '1') {
        e.preventDefault();
        handleGrade(1);
      } else if (e.key === '2') {
        e.preventDefault();
        handleGrade(2);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (currentAnswer || currentIndex < terms.length - 1) {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentAnswer, currentIndex, handleGrade, handleNext, handlePrev, isTimedOut, terms.length]);

  const gradedCount = Object.keys(answers).length;
  const currentTotalScore = Object.values(answers).reduce((acc, r) => acc + r.score, 0);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressFraction);

  if (!currentTerm) return null;

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-6 py-5">
      {/* Top Session Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs md:text-sm text-slate-600">
          {config.seatNumber.trim() && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono tabular-nums font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                #{config.seatNumber.trim()}
              </span>
            </div>
          )}
          <span className="font-bold text-slate-900 truncate max-w-[100px] sm:max-w-none">
            {config.studentName.trim() || 'นักศึกษา'}
          </span>
          <span aria-hidden="true" className="text-slate-300">|</span>
          <span className="font-mono tabular-nums font-bold text-sky-700">
            ข้อ {currentIndex + 1}/{terms.length}
          </span>
          <span aria-hidden="true" className="text-slate-300 hidden sm:inline">|</span>
          <span className="font-mono tabular-nums font-medium hidden sm:inline">
            {currentTotalScore} / {terms.length * 2} คะแนน
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="p-1.5 sm:px-3 sm:py-1.5 text-[10px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-sky-600" />}
            <span className="hidden sm:inline ml-1.5">{isMuted ? 'ปิดเสียง' : 'เปิดเสียง'}</span>
          </button>

          {confirmEnd ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleFinish}
                className="px-2 py-1.5 text-[10px] font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer"
              >
                จบ ({gradedCount}/{terms.length})
              </button>
              <button
                type="button"
                onClick={() => setConfirmEnd(false)}
                className="p-1.5 text-slate-500 bg-slate-100 rounded-lg"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmEnd(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden xs:inline">สรุปผล</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Zone Clinical Examination Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5 items-start">
        {/* Left Zone: Instructor Image + Question Term */}
        <div className="lg:col-span-7">
          <AnatomyStageCanvas
            key={currentTerm.id}
            system={currentSystem}
            term={currentTerm}
            questionIndex={currentIndex + 1}
            totalQuestions={terms.length}
            onTargetChange={(x, y) =>
              setTargetOverrides((prev) => ({ ...prev, [currentTerm.id]: { x, y } }))
            }
          />
        </div>

        {/* Right Zone: Clinical Stopwatch + 0-2 Grading Pad (No Answer Key) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. 30-Second Clinical Stopwatch Instrument */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-22 h-22 shrink-0 flex items-center justify-center">
                  <svg className="w-22 h-22 -rotate-90" viewBox="0 0 88 88">
                    {/* 12 dial tick marks */}
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const angle = (idx * 30 * Math.PI) / 180;
                      const x1 = 44 + 41 * Math.cos(angle);
                      const y1 = 44 + 41 * Math.sin(angle);
                      const x2 = 44 + 38.5 * Math.cos(angle);
                      const y2 = 44 + 38.5 * Math.sin(angle);
                      return (
                        <line
                          key={idx}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#CBD5E1"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      );
                    })}
                    <circle
                      cx="44"
                      cy="44"
                      r={radius}
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="5.5"
                    />
                    <circle
                      cx="44"
                      cy="44"
                      r={radius}
                      fill="none"
                      stroke={
                        isTimedOut ? '#E11D48' : isWarning ? '#F59E0B' : '#0284C7'
                      }
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-[stroke-dashoffset] duration-100 linear"
                    />
                  </svg>
                  <span
                    className={`absolute font-mono tabular-nums text-lg font-bold ${
                      isTimedOut
                        ? 'text-rose-600'
                        : isWarning
                        ? 'text-amber-600'
                        : 'text-sky-700'
                    }`}
                  >
                    {remainingSec.toFixed(1)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {isTimedOut ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="text-rose-700">หมดเวลา {config.secondsPerQuestion} วินาที</span>
                      </>
                    ) : isWarning ? (
                      <>
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-amber-700">ใกล้หมดเวลา (เหลือ &le; 10 วิ)</span>
                      </>
                    ) : isRunning ? (
                      <>
                        <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="text-sky-700">กำลังจับเวลาตอบปากเปล่า</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-slate-600">หยุดจับเวลาชั่วคราว</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    กำหนดตอบคำละไม่เกิน {config.secondsPerQuestion} วินาที
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-end gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={isTimedOut}
                  onClick={() => setIsRunning((r) => !r)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isRunning
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'bg-sky-600 text-white hover:bg-sky-700'
                  }`}
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isRunning ? 'หยุด' : 'เริ่มจับเวลา'}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleAddFiveSeconds}
                    className="inline-flex items-center gap-0.5 px-2.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                    title="เพิ่มเวลา 5 วินาที"
                  >
                    <Plus className="w-3 h-3" />
                    <span>5s</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    title="รีเซ็ตเวลา"
                    aria-label="รีเซ็ตเวลา"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-[width] duration-100 linear ${
                  isTimedOut ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-sky-500'
                }`}
                style={{ width: `${progressFraction * 100}%` }}
              />
            </div>
          </div>

          {/* 2. Instructor 0-2 Scoring Pad */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                อาจารย์ให้คะแนนข้อนี้ (0–2 คะแนน)
              </h3>
              {currentAnswer && (
                <span className="text-xs font-mono tabular-nums font-semibold text-sky-700">
                  บันทึกแล้ว: {currentAnswer.score} คะแนน ({currentAnswer.timeSpentSec}s)
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleGrade(0)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  currentAnswer?.score === 0
                    ? 'bg-rose-50 border-rose-600 ring-1 ring-rose-600 text-rose-900'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <XCircle
                    className={`w-4 h-4 ${
                      currentAnswer?.score === 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="font-mono tabular-nums text-xl font-bold">0</span>
                </div>
                <span className="text-xs font-medium mt-1">ไม่ถูก / ไม่ตอบ</span>
              </button>

              <button
                type="button"
                onClick={() => handleGrade(1)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  currentAnswer?.score === 1
                    ? 'bg-amber-50 border-amber-600 ring-1 ring-amber-600 text-amber-900'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <AlertCircle
                    className={`w-4 h-4 ${
                      currentAnswer?.score === 1 ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="font-mono tabular-nums text-xl font-bold">1</span>
                </div>
                <span className="text-xs font-medium mt-1">ถูกบางส่วน</span>
              </button>

              <button
                type="button"
                onClick={() => handleGrade(2)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  currentAnswer?.score === 2
                    ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600 text-emerald-900'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      currentAnswer?.score === 2 ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="font-mono tabular-nums text-xl font-bold">2</span>
                </div>
                <span className="text-xs font-medium mt-1">ถูกต้องครบถ้วน</span>
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={draftNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="บันทึกข้อสังเกตของอาจารย์เพิ่มเติม (ถ้ามี)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
              <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <span>ไปข้อถัดไปอัตโนมัติทันทีหลังกดให้คะแนน</span>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ข้อก่อนหน้า</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>
                  {currentIndex < terms.length - 1 ? 'ไปข้อถัดไป' : 'สรุปผลคะแนนทั้งหมด'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Item Progress Strip */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
              <span className="font-medium text-slate-700">ความคืบหน้าข้อสอบ</span>
              <span className="font-mono tabular-nums">
                ตรวจแล้ว {gradedCount} / {terms.length} ข้อ
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {terms.map((t, idx) => {
                const ans = answers[t.id];
                const itemSys = systems.find((s) => s.id === t.systemId);
                const isCurrent = idx === currentIndex;
                let styleClass = 'bg-slate-100 text-slate-600 border-slate-200';
                if (ans) {
                  if (ans.score === 2) styleClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                  else if (ans.score === 1) styleClass = 'bg-amber-50 text-amber-800 border-amber-300';
                  else styleClass = 'bg-rose-50 text-rose-800 border-rose-300';
                }

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => loadQuestion(idx)}
                    className={`px-2.5 h-8 rounded-lg text-xs font-mono tabular-nums font-semibold border transition-all cursor-pointer inline-flex items-center gap-1 ${styleClass} ${
                      isCurrent ? 'ring-2 ring-sky-600 ring-offset-1' : 'hover:opacity-80'
                    }`}
                    title={`ข้อที่ ${idx + 1} (${itemSys?.nameTh || ''})`}
                  >
                    <span>{idx + 1}</span>
                    {itemSys && (
                      <span className="text-[10px] opacity-75">{itemSys.shortCode}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5">
              คีย์ลัด: Space จับเวลา/หยุด · กด 0, 1, 2 ให้คะแนน · Enter ข้อถัดไป
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
