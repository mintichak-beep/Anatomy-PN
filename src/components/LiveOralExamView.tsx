import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  SkipForward,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Pencil,
  Volume2,
  VolumeX,
  ArrowLeft,
  Send,
} from 'lucide-react';
import {
  FullAppState,
  amendLockedAssessment,
  calculateAssessmentResult,
  getOrCreateDraftAssessment,
  markAttemptAnsweredReadyNext,
  markAttemptTimeUp,
  prepareQuestionAttempt,
  skipQuestionAttempt,
  startQuestionTimer,
  submitAndLockAssessment,
  updateDraftAssessmentScore,
} from '../services/oralExamService';
import {
  Assessment,
  Question,
  QuestionAttempt,
  RubricScoreValue,
} from '../types/blueprint';
import { playScoreSound, playTickSound, playTimeUpSound } from '../utils/sound';

interface LiveOralExamViewProps {
  state: FullAppState;
  examId: string;
  candidateId: string;
  onRefreshState: () => Promise<void>;
  onBackToQueue: () => void;
}

function formatMMSS(totalSec: number): string {
  const clamped = Math.max(0, Math.ceil(totalSec));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const LiveOralExamView: React.FC<LiveOralExamViewProps> = ({
  state,
  examId,
  candidateId,
  onRefreshState,
  onBackToQueue,
}) => {
  const exam = state.exams.find((e) => e.id === examId);
  const candidate = state.examCandidates.find((c) => c.id === candidateId);
  const student = candidate
    ? state.students.find((s) => s.id === candidate.studentId)
    : undefined;

  const examQuestionSets = state.questionSets.filter((qs) => qs.examId === examId);
  const examQuestionSetIds = new Set(examQuestionSets.map((qs) => qs.id));
  const examQuestions = state.questions.filter(
    (q) => examQuestionSetIds.has(q.questionSetId) && q.active
  );

  const candidateAttempts = state.questionAttempts
    .filter((qa) => qa.examCandidateId === candidateId)
    .sort((a, b) => a.questionOrder - b.questionOrder);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(() => {
    // Auto-focus any currently Running or Time Up attempt on load/refresh for seamless recovery!
    const activeAtt = candidateAttempts.find(
      (a) => a.status === 'Running' || a.status === 'Time Up'
    );
    return activeAtt?.questionId || candidateAttempts[0]?.questionId || null;
  });

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [errorMsg, setErrorMsg] = useState('');

  // Locked amendment modal
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendScores, setAmendScores] = useState<Record<string, RubricScoreValue>>({});
  const [amendReason, setAmendReason] = useState('');

  const lastWholeSecRef = useRef<number | null>(null);
  const timeUpChimeRef = useRef<Record<string, boolean>>({});

  // Ensure Draft Assessment with Rubric Snapshot exists
  useEffect(() => {
    if (!exam || !candidate) return;
    const existing = state.assessments.find((a) => a.examCandidateId === candidate.id);
    if (existing) {
      setAssessment(existing);
      return;
    }
    const template =
      state.rubricTemplates.find((r) => r.id === exam.rubricTemplateId) ||
      state.rubricTemplates[0];
    if (!template) return;

    getOrCreateDraftAssessment(exam, candidate, template)
      .then((created) => {
        setAssessment(created);
        onRefreshState();
      })
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถสร้างแบบประเมินได้'));
  }, [exam, candidate, state.assessments, state.rubricTemplates, onRefreshState]);

  const activeAttempt: QuestionAttempt | undefined = selectedQuestionId
    ? candidateAttempts.find((a) => a.questionId === selectedQuestionId)
    : undefined;

  const selectedQuestion: Question | undefined = selectedQuestionId
    ? examQuestions.find((q) => q.id === selectedQuestionId) ||
      state.questions.find((q) => q.id === selectedQuestionId)
    : undefined;

  // Timestamp-driven countdown ticker (recomputes strictly from expiresAt)
  useEffect(() => {
    if (!activeAttempt || activeAttempt.status !== 'Running' || !activeAttempt.expiresAt) {
      return;
    }

    const expMs = new Date(activeAttempt.expiresAt).getTime();

    const tick = () => {
      const current = Date.now();
      setNowMs(current);
      const remSec = Math.ceil((expMs - current) / 1000);

      if (remSec !== lastWholeSecRef.current) {
        lastWholeSecRef.current = remSec;
        if (remSec > 0 && remSec <= 5) {
          playTickSound(isMuted);
        }
      }

      if (current >= expMs) {
        if (!timeUpChimeRef.current[activeAttempt.id]) {
          timeUpChimeRef.current[activeAttempt.id] = true;
          playTimeUpSound(isMuted);
        }
        markAttemptTimeUp(activeAttempt.id).then(() => onRefreshState());
      }
    };

    tick();
    const id = window.setInterval(tick, 150);
    return () => window.clearInterval(id);
  }, [activeAttempt, isMuted, onRefreshState]);

  if (!exam || !candidate) {
    return (
      <div className="max-w-[960px] mx-auto px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800">
            ไม่พบข้อมูลรอบสอบหรือผู้เข้าสอบที่เลือก
          </p>
          <button
            type="button"
            onClick={onBackToQueue}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl cursor-pointer"
          >
            กลับไปหน้ารอบสอบและคิวสอบ
          </button>
        </div>
      </div>
    );
  }

  const handleSelectQuestion = async (questionId: string) => {
    setErrorMsg('');
    setSelectedQuestionId(questionId);
    lastWholeSecRef.current = null;
    try {
      await prepareQuestionAttempt(candidate.id, questionId);
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถเปิดคำถามได้');
    }
  };

  const handleStartTimer = async () => {
    if (!activeAttempt) return;
    setErrorMsg('');
    try {
      await startQuestionTimer(activeAttempt.id, exam.questionTimeLimitSeconds);
      setNowMs(Date.now());
      lastWholeSecRef.current = exam.questionTimeLimitSeconds;
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถเริ่มจับเวลาได้');
    }
  };

  const handleReadyNext = async () => {
    if (!activeAttempt) return;
    setErrorMsg('');
    try {
      await markAttemptAnsweredReadyNext(activeAttempt.id);
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถบันทึกสถานะคำถามได้');
    }
  };

  const handleSkipQuestion = async () => {
    if (!activeAttempt) return;
    setErrorMsg('');
    try {
      await skipQuestionAttempt(activeAttempt.id);
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถข้ามข้อคำถามได้');
    }
  };

  const handleScoreChange = async (criterionId: string, val: RubricScoreValue) => {
    if (!assessment) return;
    setErrorMsg('');
    try {
      const updated = await updateDraftAssessmentScore(
        assessment.id,
        criterionId,
        val,
        exam.passingScore
      );
      setAssessment(updated);
      playScoreSound(val, isMuted);
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถบันทึกคะแนนได้');
    }
  };

  const handleSubmitLock = async () => {
    if (!assessment) return;
    setErrorMsg('');
    try {
      const locked = await submitAndLockAssessment(assessment.id, exam.passingScore);
      setAssessment(locked);
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถยืนยันส่งผลสอบได้');
    }
  };

  const openAmendModal = () => {
    if (!assessment) return;
    setAmendScores({ ...assessment.scores });
    setAmendReason('');
    setErrorMsg('');
    setShowAmendModal(true);
  };

  const handleSaveAmend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment) return;
    setErrorMsg('');
    try {
      const updated = await amendLockedAssessment(
        assessment.id,
        amendScores,
        exam.passingScore,
        amendReason
      );
      setAssessment(updated);
      setShowAmendModal(false);
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถแก้ไขผลสอบได้');
    }
  };

  // Compute Timer Display purely from timestamp & limit
  const totalSec = exam.questionTimeLimitSeconds;
  let remainingSec = totalSec;
  if (activeAttempt?.status === 'Running' && activeAttempt.expiresAt) {
    remainingSec = Math.max(0, (new Date(activeAttempt.expiresAt).getTime() - nowMs) / 1000);
  } else if (activeAttempt?.status === 'Time Up') {
    remainingSec = 0;
  } else if (
    activeAttempt?.status === 'Answered / Ready for Next' &&
    activeAttempt.expiresAt &&
    activeAttempt.completedAt
  ) {
    remainingSec = Math.max(
      0,
      (new Date(activeAttempt.expiresAt).getTime() -
        new Date(activeAttempt.completedAt).getTime()) /
        1000
    );
  }

  const progressFraction = Math.max(0, Math.min(1, remainingSec / totalSec));
  const isTimeUp = activeAttempt?.status === 'Time Up' || (activeAttempt?.status === 'Running' && remainingSec <= 0);
  const isWarning = activeAttempt?.status === 'Running' && !isTimeUp && remainingSec <= Math.min(15, totalSec * 0.25);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressFraction);

  const maxRubricScore = assessment ? assessment.rubricSnapshot.criteria.length * 2 : 0;
  const isLocked = assessment?.status === 'submitted';

  const amendPreview = assessment
    ? calculateAssessmentResult(amendScores, assessment.rubricSnapshot.criteria, exam.passingScore)
    : { totalScore: 0, result: 'FAIL' as const };

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-6 py-5 space-y-5">
      {/* Top Session Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 md:px-5 py-3 flex flex-wrap items-center justify-between gap-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-600">
          <button
            type="button"
            onClick={onBackToQueue}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer mr-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับคิวสอบ</span>
          </button>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="font-mono tabular-nums font-bold text-slate-900">
            {student?.studentCode || '—'}
          </span>
          <span className="font-bold text-slate-900">
            {student?.fullName || 'ไม่พบชื่อนักศึกษา'}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="text-slate-500">{exam.title}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="font-mono tabular-nums font-semibold text-teal-800">
            ข้อละ {Math.round(exam.questionTimeLimitSeconds / 60)} นาที
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-teal-700" />
            )}
            <span>{isMuted ? 'ปิดเสียง' : 'เปิดเสียง'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium px-4 py-3 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Main 2-Zone Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone (7 cols): Question Picker + Game-Based Timer Stage */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Question Stage & Timer */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-900">เวทีถามคำถามปากเปล่า (Manual Control)</span>
                {activeAttempt && (
                  <>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span
                      className={`font-semibold ${
                        activeAttempt.status === 'Running'
                          ? 'text-teal-700'
                          : activeAttempt.status === 'Time Up'
                          ? 'text-rose-700'
                          : activeAttempt.status === 'Answered / Ready for Next'
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {activeAttempt.status}
                    </span>
                  </>
                )}
              </div>

              <span className="font-mono tabular-nums text-xs text-slate-500">
                กติกาเวลาเท่ากันทุกข้อ: {formatMMSS(totalSec)}
              </span>
            </div>

            {selectedQuestion && activeAttempt ? (
              <div className="p-6 space-y-6">
                {/* Question Content */}
                <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-5">
                  <div className="flex items-center justify-between gap-2 text-xs text-teal-800 font-medium mb-2">
                    <span>
                      คำถามข้อที่ {activeAttempt.questionOrder} · หมวด: {selectedQuestion.category}
                    </span>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-slate-900 leading-relaxed">
                    {selectedQuestion.questionText}
                  </p>
                </div>

                {/* Timestamp-Recovered Countdown Clock */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-4 border border-slate-200 rounded-2xl bg-slate-50/40">
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                        <circle
                          cx="48"
                          cy="48"
                          r={radius}
                          fill="none"
                          stroke="#E2E8F0"
                          strokeWidth="6"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r={radius}
                          fill="none"
                          stroke={isTimeUp ? '#DC2626' : isWarning ? '#D97706' : '#0F766E'}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-[stroke-dashoffset] duration-150 linear"
                        />
                      </svg>
                      <span
                        className={`absolute font-mono tabular-nums text-lg font-bold ${
                          isTimeUp
                            ? 'text-rose-600'
                            : isWarning
                            ? 'text-amber-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {formatMMSS(remainingSec)}
                      </span>
                    </div>

                    <div>
                      {activeAttempt.status === 'Not Started' && (
                        <>
                          <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span>ยังไม่เริ่มจับเวลา (Not Started)</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            การเปิดคำถามยังไม่เริ่มนับเวลา กรุณากดปุ่ม &ldquo;เริ่มจับเวลาคำถาม&rdquo; เมื่อพร้อม
                          </p>
                        </>
                      )}

                      {activeAttempt.status === 'Running' && !isTimeUp && (
                        <>
                          <p className="text-sm font-bold text-teal-800 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-teal-700" />
                            <span>กำลังจับเวลาตอบปากเปล่า</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            อ้างอิงเวลาจาก Timestamp จริง (รีเฟรชหน้าจอเวลาไม่รีเซ็ต)
                          </p>
                        </>
                      )}

                      {isTimeUp && activeAttempt.status !== 'Answered / Ready for Next' && (
                        <>
                          <p className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>หมดเวลา (Time Up)</span>
                          </p>
                          <p className="text-xs text-rose-700 mt-1">
                            หยุดนับเวลาแล้ว ระบบไม่ข้ามข้อและไม่ตัดสินตกอัตโนมัติ รอกรรมการกดไปต่อ
                          </p>
                        </>
                      )}

                      {activeAttempt.status === 'Answered / Ready for Next' && (
                        <>
                          <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>บันทึกเสร็จสิ้น · พร้อมเลือกคำถามข้อถัดไป</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            เลือกคำถามถัดไปจากรายการด้านล่าง หรือประเมิน Rubric ทางด้านขวา
                          </p>
                        </>
                      )}

                      {activeAttempt.status === 'Skipped' && (
                        <>
                          <p className="text-sm font-bold text-slate-700">
                            ข้ามคำถามข้อนี้แล้ว (Skipped)
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            สามารถเลือกคำถามข้ออื่นด้านล่างได้ทันที
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Operator Explicit Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {activeAttempt.status === 'Not Started' && (
                      <>
                        <button
                          type="button"
                          onClick={handleStartTimer}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>เริ่มจับเวลาคำถาม</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSkipQuestion}
                          className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                          <span>ข้ามข้อนี้</span>
                        </button>
                      </>
                    )}

                    {(activeAttempt.status === 'Running' || activeAttempt.status === 'Time Up') && (
                      <button
                        type="button"
                        onClick={handleReadyNext}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ตอบแล้ว / พร้อมข้อถัดไป</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-xs text-slate-500">
                กรุณาเลือกคำถามที่ต้องการถามนักศึกษาจากชุดคำถามด้านล่าง (ระบบไม่สุ่มคำถามอัตโนมัติ)
              </div>
            )}
          </div>

          {/* Operator Manual Question Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                เลือกคำถามสำหรับถามนักศึกษา ({examQuestions.length} ข้อ)
              </h2>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                ถามแล้ว {candidateAttempts.filter((a) => a.status === 'Answered / Ready for Next').length} ข้อ
              </span>
            </div>

            {examQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                ยังไม่มีคำถามในรอบสอบนี้ สามารถเพิ่มได้ที่เมนู &ldquo;นักศึกษา &amp; คลังข้อสอบ&rdquo;
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {examQuestions.map((q) => {
                  const att = candidateAttempts.find((a) => a.questionId === q.id);
                  const isSelected = selectedQuestionId === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSelectQuestion(q.id)}
                      className={`w-full text-left px-5 py-3.5 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                        isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium text-teal-800 block">
                          {q.category}
                        </span>
                        <p className="text-xs md:text-sm font-semibold text-slate-900 mt-0.5 leading-snug">
                          {q.questionText}
                        </p>
                      </div>

                      <span className="text-xs font-mono shrink-0 mt-0.5">
                        {!att ? (
                          <span className="text-slate-400">ยังไม่เลือก</span>
                        ) : att.status === 'Running' ? (
                          <span className="font-bold text-teal-700">Running</span>
                        ) : att.status === 'Time Up' ? (
                          <span className="font-bold text-rose-600">Time Up</span>
                        ) : att.status === 'Answered / Ready for Next' ? (
                          <span className="font-semibold text-emerald-700">เสร็จสิ้น</span>
                        ) : att.status === 'Skipped' ? (
                          <span className="text-slate-500">Skipped</span>
                        ) : (
                          <span className="text-slate-600">Not Started</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Zone (5 cols): Overall Rubric Assessment (0, 1, 2 per criterion) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 sticky top-20 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                แบบประเมิน Rubric ภาพรวมการสอบ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {assessment?.rubricSnapshot.title || 'กำลังโหลดเกณฑ์ประเมิน...'}
              </p>
            </div>
            {isLocked && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 shrink-0">
                <Lock className="w-3.5 h-3.5" />
                <span>ล็อกผลแล้ว</span>
              </span>
            )}
          </div>

          {assessment ? (
            <>
              <div className="space-y-3">
                {assessment.rubricSnapshot.criteria.map((crit, idx) => {
                  const currentVal = assessment.scores[crit.id] ?? 0;
                  return (
                    <div
                      key={crit.id}
                      className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/40 space-y-2.5"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {idx + 1}. {crit.name}
                        </p>
                        {crit.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {crit.description}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {([0, 1, 2] as RubricScoreValue[]).map((val) => {
                          const active = currentVal === val;
                          const activeStyle =
                            val === 2
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : val === 1
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-rose-600 text-white border-rose-600';
                          return (
                            <button
                              key={val}
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleScoreChange(crit.id, val)}
                              className={`py-1.5 text-xs font-mono tabular-nums font-bold rounded-lg border transition-colors cursor-pointer disabled:cursor-not-allowed ${
                                active
                                  ? activeStyle
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-60'
                              }`}
                            >
                              {val} คะแนน
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Score Calculation */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">
                      คะแนนรวม (เกณฑ์ผ่าน &ge; {exam.passingScore})
                    </span>
                    <span className="font-mono tabular-nums text-2xl font-bold text-slate-900">
                      {assessment.totalScore}{' '}
                      <span className="text-sm font-normal text-slate-500">/ {maxRubricScore}</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">ผลการประเมิน</span>
                    <span
                      className={`font-mono text-lg font-bold ${
                        assessment.result === 'PASS' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {assessment.result === 'PASS' ? 'ผ่าน (PASS)' : 'ไม่ผ่าน (FAIL)'}
                    </span>
                  </div>
                </div>

                {!isLocked ? (
                  <button
                    type="button"
                    onClick={handleSubmitLock}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>ยืนยันและส่งผลสอบ (ล็อกคะแนน)</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                      ส่งผลสอบเรียบร้อยแล้วเมื่อ{' '}
                      <span className="font-mono tabular-nums">
                        {assessment.submittedAt
                          ? new Date(assessment.submittedAt).toLocaleString('th-TH')
                          : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={openAmendModal}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>แก้ไขผลสอบที่ล็อกแล้ว (ต้องระบุเหตุผล)</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">กำลังเตรียมแบบประเมิน Rubric...</p>
          )}
        </div>
      </div>

      {/* Amend Locked Assessment Modal */}
      {showAmendModal && assessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 my-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-900">
              แก้ไขผลสอบที่ยืนยันแล้ว (บันทึก Audit Log)
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              กรุณาปรับคะแนน (0, 1, 2) และระบุเหตุผลในการแก้ไขอย่างชัดเจน
            </p>

            <form onSubmit={handleSaveAmend} className="space-y-3.5 mt-4">
              {assessment.rubricSnapshot.criteria.map((crit) => (
                <div
                  key={crit.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-slate-100"
                >
                  <span className="text-xs font-semibold text-slate-800">{crit.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {([0, 1, 2] as RubricScoreValue[]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmendScores((prev) => ({ ...prev, [crit.id]: val }))}
                        className={`w-8 h-8 rounded-lg font-mono text-xs font-bold border cursor-pointer ${
                          (amendScores[crit.id] ?? 0) === val
                            ? 'bg-teal-700 border-teal-700 text-white'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between text-xs font-bold text-slate-900 pt-1">
                <span>คะแนนใหม่: {amendPreview.totalScore} / {maxRubricScore}</span>
                <span className={amendPreview.result === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}>
                  {amendPreview.result}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เหตุผลการแก้ไขคะแนน *
                </label>
                <textarea
                  required
                  rows={2}
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  placeholder="ระบุเหตุผลที่แก้ไขผลสอบ..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAmendModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl cursor-pointer"
                >
                  บันทึกการแก้ไขผลสอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
