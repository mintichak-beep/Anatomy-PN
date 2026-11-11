import React, { useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  HelpCircle,
  ClipboardCheck,
  X,
  Upload,
} from 'lucide-react';
import {
  FullAppState,
  deleteQuestion,
  deleteStudent,
  saveQuestion,
  saveQuestionSet,
  saveRubricTemplate,
  saveStudent,
} from '../services/oralExamService';
import { Question, RubricTemplate, Student } from '../types/blueprint';

interface MasterDataViewProps {
  state: FullAppState;
  onRefreshState: () => Promise<void>;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  state,
  onRefreshState,
}) => {
  const [tab, setTab] = useState<'students' | 'questions' | 'rubrics'>('students');
  const [errorMsg, setErrorMsg] = useState('');

  // Students state
  const [studentQuery, setStudentQuery] = useState('');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [stuCode, setStuCode] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuActive, setStuActive] = useState(true);
  const [bulkStudentText, setBulkStudentText] = useState('');
  const [showBulkStudentModal, setShowBulkStudentModal] = useState(false);

  // Questions state
  const [selectedExamId, setSelectedExamId] = useState(state.exams[0]?.id || '');
  const [questionQuery, setQuestionQuery] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [qSetId, setQSetId] = useState('');
  const [qText, setQText] = useState('');
  const [qCat, setQCat] = useState('');
  const [qActive, setQActive] = useState(true);
  const [newSetTitle, setNewSetTitle] = useState('');

  // Rubric state
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [editingRubric, setEditingRubric] = useState<RubricTemplate | null>(null);
  const [rubricTitle, setRubricTitle] = useState('');
  const [rubricCriteria, setRubricCriteria] = useState<
    Array<{ id?: string; name: string; description: string }>
  >([]);

  // ---- Students handlers ----
  const openStudentModal = (stu?: Student) => {
    setErrorMsg('');
    setEditingStudent(stu || null);
    setStuCode(stu?.studentCode || '');
    setStuName(stu?.fullName || '');
    setStuActive(stu?.active ?? true);
    setShowStudentModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await saveStudent({
        id: editingStudent?.id,
        studentCode: stuCode,
        fullName: stuName,
        active: stuActive,
      });
      setShowStudentModal(false);
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลนักศึกษาได้');
    }
  };

  const handleBulkImportStudents = async () => {
    setErrorMsg('');
    const lines = bulkStudentText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    let added = 0;
    const errors: string[] = [];

    for (const line of lines) {
      const parts = line.includes('\t')
        ? line.split('\t').map((s) => s.trim())
        : line.split(',').map((s) => s.trim());
      if (parts.length < 2) continue;
      const [code, name] = parts;
      try {
        await saveStudent({ studentCode: code, fullName: name, active: true });
        added++;
      } catch (err) {
        errors.push(`${code}: ${err instanceof Error ? err.message : 'ซ้ำ'}`);
      }
    }

    await onRefreshState();
    setShowBulkStudentModal(false);
    setBulkStudentText('');
    if (errors.length > 0) {
      setErrorMsg(`นำเข้าสำเร็จ ${added} คน · ข้าม ${errors.length} รายการ (${errors[0]})`);
    }
  };

  // ---- Questions handlers ----
  const currentExamId = selectedExamId || state.exams[0]?.id || '';
  const examQuestionSets = state.questionSets.filter((qs) => qs.examId === currentExamId);
  const examSetIds = new Set(examQuestionSets.map((qs) => qs.id));
  const filteredQuestions = state.questions.filter((q) => {
    if (!examSetIds.has(q.questionSetId)) return false;
    const search = questionQuery.trim().toLowerCase();
    if (!search) return true;
    return (
      q.questionText.toLowerCase().includes(search) ||
      q.category.toLowerCase().includes(search)
    );
  });

  const openQuestionModal = (q?: Question) => {
    setErrorMsg('');
    setEditingQuestion(q || null);
    setQSetId(q?.questionSetId || examQuestionSets[0]?.id || '');
    setQText(q?.questionText || '');
    setQCat(q?.category || '');
    setQActive(q?.active ?? true);
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      let targetSetId = qSetId || examQuestionSets[0]?.id;
      if (!targetSetId && currentExamId) {
        const createdSet = await saveQuestionSet(currentExamId, 'ชุดคำถามหลัก');
        targetSetId = createdSet.id;
      }
      if (!targetSetId) throw new Error('กรุณาสร้างรอบสอบก่อนเพิ่มคำถาม');

      await saveQuestion({
        id: editingQuestion?.id,
        questionSetId: targetSetId,
        questionText: qText,
        category: qCat,
        active: qActive,
      });
      setShowQuestionModal(false);
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถบันทึกคำถามได้');
    }
  };

  const handleCreateSet = async () => {
    if (!currentExamId || !newSetTitle.trim()) return;
    setErrorMsg('');
    try {
      await saveQuestionSet(currentExamId, newSetTitle);
      setNewSetTitle('');
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถสร้างชุดคำถามได้');
    }
  };

  // ---- Rubric handlers ----
  const openRubricModal = (rt?: RubricTemplate) => {
    setErrorMsg('');
    setEditingRubric(rt || null);
    setRubricTitle(rt?.title || '');
    setRubricCriteria(
      rt
        ? rt.criteria.map((c) => ({ id: c.id, name: c.name, description: c.description }))
        : [{ name: '', description: '' }]
    );
    setShowRubricModal(true);
  };

  const handleSaveRubric = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await saveRubricTemplate({
        id: editingRubric?.id,
        title: rubricTitle,
        criteria: rubricCriteria,
      });
      setShowRubricModal(false);
      await onRefreshState();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'ไม่สามารถบันทึก Rubric ได้');
    }
  };

  const filteredStudents = state.students.filter((s) => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.studentCode.toLowerCase().includes(q) || s.fullName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-[1260px] mx-auto px-4 md:px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            จัดการนักศึกษา คลังคำถาม และเกณฑ์ประเมิน Rubric
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            ฐานข้อมูลหลักในเครื่องสำหรับการสอบปากเปล่าทุกเกณฑ์ใน Rubric ให้คะแนน 0, 1 หรือ 2 คะแนน
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => setTab('students')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'students' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>นักศึกษา ({state.students.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('questions')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'questions' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>คลังคำถาม ({state.questions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('rubrics')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'rubrics' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Rubric ({state.rubricTemplates.length})</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium px-4 py-3 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* TAB 1: STUDENTS */}
      {tab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder="ค้นหารหัสหรือชื่อนักศึกษา..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBulkStudentModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้าหลายคน (Excel/CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => openStudentModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มนักศึกษา</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 w-16">ลำดับ</th>
                    <th className="py-3 px-4">รหัสนักศึกษา</th>
                    <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-xs text-slate-500">
                        ไม่พบข้อมูลนักศึกษา
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((stu, idx) => (
                      <tr key={stu.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-xs font-bold text-slate-900">
                          {stu.studentCode}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">{stu.fullName}</td>
                        <td className="py-3 px-4 text-xs">
                          <span
                            className={
                              stu.active
                                ? 'text-emerald-700 font-semibold'
                                : 'text-slate-400 font-medium'
                            }
                          >
                            {stu.active ? 'ใช้งานอยู่ (Active)' : 'ปิดใช้งาน'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openStudentModal(stu)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg cursor-pointer"
                            title="แก้ไข"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              setErrorMsg('');
                              try {
                                await deleteStudent(stu.id);
                                await onRefreshState();
                              } catch (err) {
                                setErrorMsg(
                                  err instanceof Error ? err.message : 'ไม่สามารถลบได้'
                                );
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONS & QUESTION SETS */}
      {tab === 'questions' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <select
                value={currentExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {state.exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    รอบสอบ: {ex.title}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={questionQuery}
                  onChange={(e) => setQuestionQuery(e.target.value)}
                  placeholder="ค้นหาคำถามหรือหมวดหมู่..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newSetTitle}
                  onChange={(e) => setNewSetTitle(e.target.value)}
                  placeholder="ชื่อชุดคำถามใหม่..."
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 w-40"
                />
                <button
                  type="button"
                  onClick={handleCreateSet}
                  disabled={!newSetTitle.trim() || !currentExamId}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-xl whitespace-nowrap cursor-pointer"
                >
                  + สร้างชุด
                </button>
              </div>
              <button
                type="button"
                disabled={!currentExamId}
                onClick={() => openQuestionModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มคำถามใหม่</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 w-14">ข้อ</th>
                    <th className="py-3 px-4">คำถามปากเปล่า</th>
                    <th className="py-3 px-4">หมวดหมู่ / ชุดคำถาม</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-xs text-slate-500">
                        ยังไม่มีคำถามในรอบสอบนี้ กดปุ่ม &ldquo;เพิ่มคำถามใหม่&rdquo; เพื่อสร้างคลังคำถาม
                      </td>
                    </tr>
                  ) : (
                    filteredQuestions.map((q, idx) => {
                      const qs = examQuestionSets.find((s) => s.id === q.questionSetId);
                      return (
                        <tr key={q.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 text-xs md:text-sm font-medium text-slate-900">
                            {q.questionText}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            <span className="font-semibold text-teal-800 block">{q.category}</span>
                            <span className="text-[11px] text-slate-400">{qs?.title}</span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span className={q.active ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                              {q.active ? 'พร้อมใช้งาน' : 'ปิดใช้งาน'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openQuestionModal(q)}
                              className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                setErrorMsg('');
                                try {
                                  await deleteQuestion(q.id);
                                  await onRefreshState();
                                } catch (err) {
                                  setErrorMsg(
                                    err instanceof Error ? err.message : 'ไม่สามารถลบคำถามได้'
                                  );
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      {/* TAB 3: RUBRIC TEMPLATES */}
      {tab === 'rubrics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              คะแนนเต็มของแต่ละ Rubric = จำนวนเกณฑ์ &times; 2 คะแนน (แต่ละเกณฑ์ให้ได้ 0, 1 หรือ 2 เท่านั้น)
            </p>
            <button
              type="button"
              onClick={() => openRubricModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างเกณฑ์ Rubric ใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.rubricTemplates.map((rt) => (
              <div
                key={rt.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{rt.title}</h3>
                      <p className="text-xs font-mono tabular-nums text-teal-800 mt-0.5">
                        {rt.criteria.length} เกณฑ์ · คะแนนเต็ม {rt.criteria.length * 2} คะแนน
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openRubricModal(rt)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {rt.criteria.map((c, idx) => (
                      <div key={c.id} className="text-xs">
                        <span className="font-semibold text-slate-800">
                          {idx + 1}. {c.name}
                        </span>{' '}
                        <span className="font-mono text-[11px] text-slate-400">(0–2)</span>
                        {c.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{c.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editingStudent ? 'แก้ไขข้อมูลนักศึกษา' : 'เพิ่มนักศึกษาใหม่'}
              </h2>
              <button
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  รหัสนักศึกษา *
                </label>
                <input
                  required
                  type="text"
                  value={stuCode}
                  onChange={(e) => setStuCode(e.target.value)}
                  placeholder="เช่น 6701004"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  required
                  type="text"
                  value={stuName}
                  onChange={(e) => setStuName(e.target.value)}
                  placeholder="เช่น นศ.พ. สมชาย ใจดี"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stuActive}
                  onChange={(e) => setStuActive(e.target.checked)}
                  className="rounded border-slate-300 text-teal-700"
                />
                <span>สถานะใช้งานอยู่ (Active)</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl cursor-pointer"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Student Modal */}
      {showBulkStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-900">นำเข้าข้อมูลนักศึกษาหลายคน</h2>
            <p className="text-xs text-slate-500 mt-1">
              วางข้อมูลจาก Excel หรือคั่นด้วยเครื่องหมายจุลภาค (รหัส, ชื่อ-นามสกุล) 1 บรรทัดต่อ 1 คน
            </p>
            <textarea
              rows={5}
              value={bulkStudentText}
              onChange={(e) => setBulkStudentText(e.target.value)}
              placeholder={`6701011, กมลชนก รักเรียน\n6701012, ธนากร วงศ์สุวรรณ`}
              className="w-full mt-3 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowBulkStudentModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleBulkImportStudents}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl cursor-pointer"
              >
                นำเข้ารายชื่อ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editingQuestion ? 'แก้ไขคำถาม' : 'เพิ่มคำถามปากเปล่า'}
              </h2>
              <button
                type="button"
                onClick={() => setShowQuestionModal(false)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveQuestion} className="space-y-3.5 mt-4">
              {examQuestionSets.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ชุดคำถาม</label>
                  <select
                    value={qSetId}
                    onChange={(e) => setQSetId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    {examQuestionSets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  หมวดหมู่ / ระบบอวัยวะ
                </label>
                <input
                  type="text"
                  value={qCat}
                  onChange={(e) => setQCat(e.target.value)}
                  placeholder="เช่น ระบบหายใจ"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  คำถามสำหรับถามนักศึกษา *
                </label>
                <textarea
                  required
                  rows={3}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="พิมพ์คำถามที่กรรมการจะใช้ถามนักศึกษา..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={qActive}
                  onChange={(e) => setQActive(e.target.checked)}
                  className="rounded border-slate-300 text-teal-700"
                />
                <span>เปิดใช้งานคำถามนี้ในการสอบ</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl cursor-pointer"
                >
                  บันทึกคำถาม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rubric Modal */}
      {showRubricModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 my-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editingRubric ? 'แก้ไขเกณฑ์ Rubric' : 'สร้างเกณฑ์ Rubric ใหม่'}
              </h2>
              <button
                type="button"
                onClick={() => setShowRubricModal(false)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveRubric} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อแม่แบบเกณฑ์ Rubric *
                </label>
                <input
                  required
                  type="text"
                  value={rubricTitle}
                  onChange={(e) => setRubricTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>รายการเกณฑ์ประเมิน (เกณฑ์ละ 0, 1, 2 คะแนน)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setRubricCriteria((prev) => [...prev, { name: '', description: '' }])
                    }
                    className="text-teal-700 hover:underline cursor-pointer"
                  >
                    + เพิ่มเกณฑ์
                  </button>
                </div>

                {rubricCriteria.map((c, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        required
                        type="text"
                        value={c.name}
                        onChange={(e) =>
                          setRubricCriteria((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, name: e.target.value } : item
                            )
                          )
                        }
                        placeholder={`ชื่อเกณฑ์ข้อที่ ${idx + 1}`}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                      {rubricCriteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setRubricCriteria((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={c.description}
                      onChange={(e) =>
                        setRubricCriteria((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, description: e.target.value } : item
                          )
                        )
                      }
                      placeholder="คำอธิบายเกณฑ์ (ไม่บังคับ)"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                <span>
                  คะแนนเต็ม: <strong className="font-mono">{rubricCriteria.length * 2} คะแนน</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRubricModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl cursor-pointer"
                  >
                    บันทึก Rubric
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
