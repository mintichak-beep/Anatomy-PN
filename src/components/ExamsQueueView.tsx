import React, { useState } from 'react';
import {
  Plus,
  Play,
  ArrowUp,
  ArrowDown,
  UserPlus,
  Lock,
  RotateCcw,
  UserX,
  Trash2,
  Pencil,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  FullAppState,
  enrollStudentInExam,
  hasExamStarted,
  removeCandidateFromExam,
  reorderCandidateQueue,
  saveExam,
  transitionCandidateStatus,
} from '../services/oralExamService';
import { Exam, ExamCandidate } from '../types/blueprint';

interface ExamsQueueViewProps {
  state: FullAppState;
  selectedExamId: string | null;
  onSelectExam: (examId: string) => void;
  onRefreshState: () => Promise<void>;
  onStartLiveExam: (examId: string, candidateId: string) => void;
}

export const ExamsQueueView: React.FC<ExamsQueueViewProps> = ({
  state,
  selectedExamId,
  onSelectExam,
  onRefreshState,
  onStartLiveExam,
}) => {
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [passingScore, setPassingScore] = useState(5);
  const [minutesPerQuestion, setMinutesPerQuestion] = useState(2);
  const [rubricTemplateId, setRubricTemplateId] = useState(
    state.rubricTemplates[0]?.id || ''
  );

  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Recovery Modal state (In Progress -> Waiting with mandatory reason)
  const [recoverTarget, setRecoverTarget] = useState<ExamCandidate | null>(null);
  const [recoverReason, setRecoverReason] = useState('');

  const activeExam =
    state.exams.find((e) => e.id === selectedExamId) || state.exams[0] || null;

  const openCreateModal = () => {
    setEditingExam(null);
    setTitle('');
    setSubject('');
    setDescription('');
    setExamDate(new Date().toISOString().slice(0, 10));
    const defaultRubric = state.rubricTemplates[0];
    setRubricTemplateId(defaultRubric?.id || '');
    setPassingScore(defaultRubric ? Math.ceil(defaultRubric.criteria.length) : 4);
    setMinutesPerQuestion(2);
    setErrorMsg('');
    setShowExamModal(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setTitle(exam.title);
    setSubject(exam.subject);
    setDescription(exam.description);
    setExamDate(exam.examDate);
    setPassingScore(exam.passingScore);
    setMinutesPerQuestion(Math.max(1, Math.round(exam.questionTimeLimitSeconds / 60)));
    setRubricTemplateId(exam.rubricTemplateId);
    setErrorMsg('');
    setShowExamModal(true);
  };

  const editingExamLocked = editingExam
    ? hasExamStarted(
        editingExam,
        state.examCandidates,
        state.assessments,
        state.questionAttempts
      )
    : false;

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const saved = await saveExam({
        id: editingExam?.id,
        title,
        subject,
        description,
        examDate,
        passingScore,
        minutesPerQuestion,
        rubricTemplateId: rubricTemplateId || state.rubricTemplates[0]?.id || '',
      });
      await onRefreshState();
      onSelectExam(saved.id);
      setShowExamModal(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถบันทึกรอบสอบได้');
    }
  };

  const handleEnroll = async () => {
    if (!activeExam || !enrollStudentId) return;
    setErrorMsg('');
    try {
      await enrollStudentInExam(activeExam.id, enrollStudentId);
      setEnrollStudentId('');
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ลงทะเบียนไม่สำเร็จ');
    }
  };

  const handleStartCandidate = async (candidate: ExamCandidate) => {
    if (!activeExam) return;
    setErrorMsg('');
    try {
      if (candidate.status === 'Waiting') {
        await transitionCandidateStatus(candidate.id, 'In Progress');
        await onRefreshState();
      }
      onStartLiveExam(activeExam.id, candidate.id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถเริ่มสอบได้');
    }
  };

  const handleMarkAbsent = async (candidate: ExamCandidate) => {
    setErrorMsg('');
    try {
      await transitionCandidateStatus(candidate.id, 'Absent', 'กรรมการบันทึกสถานะขาดสอบ');
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const handleConfirmRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverTarget) return;
    setErrorMsg('');
    try {
      await transitionCandidateStatus(recoverTarget.id, 'Waiting', recoverReason);
      setRecoverTarget(null);
      setRecoverReason('');
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถกู้คืนสถานะได้');
    }
  };

  const activeExamStarted = activeExam
    ? hasExamStarted(
        activeExam,
        state.examCandidates,
        state.assessments,
        state.questionAttempts
      )
    : false;

  const examCandidates = activeExam
    ? state.examCandidates
        .filter((c) => c.examId === activeExam.id)
        .sort((a, b) => a.queueOrder - b.queueOrder)
    : [];

  const enrolledIds = new Set(examCandidates.map((c) => c.studentId));
  const availableStudents = state.students.filter(
    (s) => s.active && !enrolledIds.has(s.id)
  );

  const selectedRubric = state.rubricTemplates.find(
    (r) => r.id === (activeExam?.rubricTemplateId || '')
  );

  const examQuestionsCount = activeExam
    ? state.questions.filter((q) => {
        const set = state.questionSets.find((qs) => qs.id === q.questionSetId);
        return set?.examId === activeExam.id && q.active;
      }).length
    : 0;

  return (
    <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            จัดการรอบสอบและคิวนักศึกษาเข้าสอบ
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            กำหนดเวลาต่อคำถาม (นาที/ข้อ) คะแนนผ่าน และจัดลำดับคิวเข้าสอบปากเปล่าแบบตัวต่อตัว
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างรอบสอบใหม่</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium px-4 py-3 rounded-xl">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Exam Rounds List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-sm font-bold text-slate-800">
            เลือกรอบสอบ ({state.exams.length})
          </h2>

          {state.exams.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
              ยังไม่มีรอบสอบ กดปุ่ม &ldquo;สร้างรอบสอบใหม่&rdquo; เพื่อเริ่มต้น
            </div>
          ) : (
            <div className="space-y-2.5">
              {state.exams.map((exam) => {
                const isSelected = activeExam?.id === exam.id;
                const mins = Math.round(exam.questionTimeLimitSeconds / 60);
                const cands = state.examCandidates.filter((c) => c.examId === exam.id);
                const started = hasExamStarted(
                  exam,
                  state.examCandidates,
                  state.assessments,
                  state.questionAttempts
                );
                return (
                  <div
                    key={exam.id}
                    onClick={() => onSelectExam(exam.id)}
                    className={`bg-white border rounded-2xl p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-600 ring-1 ring-teal-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-mono tabular-nums">{exam.examDate}</span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums text-teal-800 font-semibold">
                        {started && <Lock className="w-3 h-3" />}
                        <span>{mins} นาที/ข้อ</span>
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{exam.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{exam.subject}</p>
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono tabular-nums">ผู้เข้าสอบ {cands.length} คน</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(exam);
                        }}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-teal-700 font-medium cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>แก้ไข</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Exam Details & Queue */}
        <div className="lg:col-span-8 space-y-5">
          {activeExam ? (
            <>
              {/* Exam Rules Summary */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono tabular-nums">{activeExam.examDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeExam.subject}</span>
                      {activeExamStarted && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-amber-800 font-semibold">
                            <Lock className="w-3 h-3" />
                            <span>ล็อกค่าเวลาต่อคำถามแล้ว (เริ่มสอบแล้ว)</span>
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">{activeExam.title}</h2>
                    {activeExam.description && (
                      <p className="text-xs text-slate-600 mt-1">{activeExam.description}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditModal(activeExam)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer self-start"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>ตั้งค่ารอบสอบ</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block">เวลาต่อคำถาม</span>
                    <span className="font-mono tabular-nums text-sm font-bold text-teal-800 mt-0.5 block">
                      {Math.round(activeExam.questionTimeLimitSeconds / 60)} นาที (
                      {activeExam.questionTimeLimitSeconds}s)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">เกณฑ์ผ่าน</span>
                    <span className="font-mono tabular-nums text-sm font-bold text-slate-900 mt-0.5 block">
                      {activeExam.passingScore} /{' '}
                      {selectedRubric ? selectedRubric.criteria.length * 2 : '—'} คะแนน
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">คำถามในรอบนี้</span>
                    <span className="font-mono tabular-nums text-sm font-bold text-slate-900 mt-0.5 block">
                      {examQuestionsCount} ข้อพร้อมถาม
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">เกณฑ์ประเมิน Rubric</span>
                    <span className="text-sm font-semibold text-slate-900 mt-0.5 block truncate">
                      {selectedRubric?.title || 'ยังไม่ได้เลือก'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enroll Student Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <select
                  value={enrollStudentId}
                  onChange={(e) => setEnrollStudentId(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="">
                    — เลือกนักศึกษาเพื่อเพิ่มเข้าคิว ({availableStudents.length} คนที่ยังไม่ได้ลงทะเบียน) —
                  </option>
                  {availableStudents.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.studentCode} · {stu.fullName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!enrollStudentId}
                  onClick={handleEnroll}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>เพิ่มเข้าคิวสอบ</span>
                </button>
              </div>

              {/* Candidate Queue Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    คิวนักศึกษาเข้าสอบ ({examCandidates.length} คน)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    Waiting: {examCandidates.filter((c) => c.status === 'Waiting').length} · In
                    Progress: {examCandidates.filter((c) => c.status === 'In Progress').length} ·
                    Completed: {examCandidates.filter((c) => c.status === 'Completed').length}
                  </span>
                </div>

                {examCandidates.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500">
                    ยังไม่มีนักศึกษาในคิวของรอบสอบนี้ กรุณาเลือกนักศึกษาจากรายการด้านบน
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                          <th className="py-3 px-4 w-20">คิว</th>
                          <th className="py-3 px-4">รหัสนักศึกษา</th>
                          <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                          <th className="py-3 px-4">สถานะ</th>
                          <th className="py-3 px-4 text-right">การดำเนินการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {examCandidates.map((cand, idx) => {
                          const stu = state.students.find((s) => s.id === cand.studentId);
                          const assess = state.assessments.find(
                            (a) => a.examCandidateId === cand.id
                          );

                          return (
                            <tr key={cand.id} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1">
                                  <span className="font-mono tabular-nums font-bold text-slate-700 w-6">
                                    #{idx + 1}
                                  </span>
                                  {cand.status === 'Waiting' && (
                                    <div className="flex flex-col">
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={async () => {
                                          await reorderCandidateQueue(activeExam.id, cand.id, 'up');
                                          await onRefreshState();
                                        }}
                                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                        aria-label="เลื่อนขึ้น"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === examCandidates.length - 1}
                                        onClick={async () => {
                                          await reorderCandidateQueue(
                                            activeExam.id,
                                            cand.id,
                                            'down'
                                          );
                                          await onRefreshState();
                                        }}
                                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                        aria-label="เลื่อนลง"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono tabular-nums text-xs font-semibold text-slate-800">
                                {stu?.studentCode || '—'}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-900">
                                {stu?.fullName || 'ไม่พบข้อมูลนักศึกษา'}
                              </td>
                              <td className="py-3 px-4 text-xs">
                                {cand.status === 'Waiting' && (
                                  <span className="font-medium text-slate-600">รอสอบ (Waiting)</span>
                                )}
                                {cand.status === 'In Progress' && (
                                  <span className="font-semibold text-amber-700">
                                    กำลังสอบ (In Progress)
                                  </span>
                                )}
                                {cand.status === 'Completed' && (
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>
                                      สอบเสร็จ ({assess ? `${assess.totalScore} · ${assess.result}` : 'Completed'})
                                    </span>
                                  </span>
                                )}
                                {cand.status === 'Absent' && (
                                  <span className="font-medium text-rose-700">ขาดสอบ (Absent)</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  {cand.status === 'Waiting' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleStartCandidate(cand)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                                      >
                                        <Play className="w-3 h-3 fill-current" />
                                        <span>เริ่มสอบคนนี้</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMarkAbsent(cand)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                                        title="บันทึกขาดสอบ"
                                      >
                                        <UserX className="w-3.5 h-3.5" />
                                        <span>ขาดสอบ</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          await removeCandidateFromExam(cand.id);
                                          await onRefreshState();
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                        title="ถอนชื่อจากคิว"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}

                                  {cand.status === 'In Progress' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleStartCandidate(cand)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                                      >
                                        <Play className="w-3 h-3 fill-current" />
                                        <span>เข้าห้องสอบต่อ</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRecoverTarget(cand);
                                          setRecoverReason('');
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                                        title="กู้คืนสถานะกลับเป็น Waiting (ต้องระบุเหตุผล)"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>กู้คืนคิว</span>
                                      </button>
                                    </>
                                  )}

                                  {cand.status === 'Completed' && (
                                    <button
                                      type="button"
                                      onClick={() => onStartLiveExam(activeExam.id, cand.id)}
                                      className="px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg cursor-pointer"
                                    >
                                      ดู / แก้ไขผลสอบ
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
              กรุณาสร้างรอบสอบทางด้านซ้ายหรือกด &ldquo;สร้างรอบสอบใหม่&rdquo;
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editingExam ? 'แก้ไขข้อมูลรอบสอบ' : 'สร้างรอบสอบปากเปล่าใหม่'}
              </h2>
              <button
                type="button"
                onClick={() => setShowExamModal(false)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อรอบสอบ *
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น สอบปากเปล่าปลายภาค 1/2569"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รายวิชา *
                  </label>
                  <input
                    required
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="เช่น Human Anatomy"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    วันที่สอบ
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เวลาต่อคำถาม (นาที/ข้อ) *
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    step={1}
                    disabled={editingExamLocked}
                    value={minutesPerQuestion}
                    onChange={(e) =>
                      setMinutesPerQuestion(Math.max(1, parseInt(e.target.value || '1', 10)))
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  {editingExamLocked && (
                    <p className="text-[11px] text-amber-700 mt-1">
                      ล็อกค่าเวลาแล้ว เนื่องจากรอบสอบเริ่มดำเนินการสอบแล้ว
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    คะแนนผ่านเกณฑ์ (Passing Score)
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    step={1}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Math.max(0, parseInt(e.target.value || '0', 10)))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เกณฑ์ประเมิน Rubric ที่ใช้ในรอบนี้
                </label>
                <select
                  value={rubricTemplateId}
                  onChange={(e) => setRubricTemplateId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  {state.rubricTemplates.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.title} (เต็ม {rt.criteria.length * 2} คะแนน)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  คำอธิบายเพิ่มเติม (ไม่บังคับ)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl cursor-pointer"
                >
                  บันทึกรอบสอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recover Candidate Modal (Requires Reason -> AuditLog) */}
      {recoverTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-900">
              กู้คืนสถานะผู้เข้าสอบกลับเป็น Waiting
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              การเปลี่ยนสถานะจาก In Progress กลับเป็น Waiting ต้องระบุเหตุผลเพื่อบันทึกใน Audit Log
            </p>
            <form onSubmit={handleConfirmRecover} className="space-y-3 mt-4">
              <textarea
                required
                rows={3}
                value={recoverReason}
                onChange={(e) => setRecoverReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น กดเริ่มสอบผิดคน / นักศึกษาขอพักเหตุฉุกเฉิน..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRecoverTarget(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer"
                >
                  ยืนยันกู้คืนคิว
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
