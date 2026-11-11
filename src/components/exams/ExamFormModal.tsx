import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  ExaminationFormInput,
  ExaminationRecord,
  ExaminationStatus,
} from '../../types/oralExam';
import {
  ExamValidationErrors,
  validateExamInput,
} from '../../services/exams/examService';

interface ExamFormModalProps {
  initialExam?: ExaminationRecord | null;
  onSubmit: (input: ExaminationFormInput) => Promise<void>;
  onClose: () => void;
}

export const ExamFormModal: React.FC<ExamFormModalProps> = ({
  initialExam,
  onSubmit,
  onClose,
}) => {
  const isEdit = Boolean(initialExam);

  const [formState, setFormState] = useState<ExaminationFormInput>({
    title: initialExam?.title ?? '',
    subject: initialExam?.subject ?? '',
    description: initialExam?.description ?? '',
    examDate: initialExam?.examDate ?? '',
    passingScore:
      initialExam !== undefined && initialExam !== null
        ? String(initialExam.passingScore)
        : '0',
    status: initialExam?.status ?? 'draft',
  });

  const [fieldErrors, setFieldErrors] = useState<ExamValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validateExamInput(formState);
    if (errors.title || errors.examDate || errors.passingScore || errors.status) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSaving(true);
    try {
      await onSubmit(formState);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'ไม่สามารถบันทึกข้อมูลการสอบได้ กรุณาลองใหม่อีกครั้ง';
      setSubmitError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-form-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-lg my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 id="exam-form-title" className="text-base font-semibold text-slate-900">
            {isEdit ? 'แก้ไขข้อมูลการสอบ' : 'สร้างการสอบใหม่'}
          </h2>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-40"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-5">
          {submitError && (
            <div
              role="alert"
              className="px-3.5 py-2.5 text-xs sm:text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg"
            >
              {submitError}
            </div>
          )}

          <div>
            <label
              htmlFor="exam-title-input"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              ชื่อการสอบ <span className="text-rose-600">*</span>
            </label>
            <input
              id="exam-title-input"
              type="text"
              value={formState.title}
              onChange={(e) => {
                setFormState((prev) => ({ ...prev, title: e.target.value }));
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              placeholder="เช่น สอบปากเปล่ากลางภาค ภาคเรียนที่ 1/2569"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.title
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-200 focus:ring-slate-900'
              }`}
            />
            {fieldErrors.title && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="exam-subject-input"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              รายวิชา (ไม่บังคับ)
            </label>
            <input
              id="exam-subject-input"
              type="text"
              value={formState.subject}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="เช่น กายวิภาคศาสตร์พื้นฐาน (ANAT 201)"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="exam-date-input"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                วันที่สอบ (YYYY-MM-DD) <span className="text-rose-600">*</span>
              </label>
              <input
                id="exam-date-input"
                type="date"
                value={formState.examDate}
                onChange={(e) => {
                  setFormState((prev) => ({ ...prev, examDate: e.target.value }));
                  if (fieldErrors.examDate) {
                    setFieldErrors((prev) => ({ ...prev, examDate: undefined }));
                  }
                }}
                className={`w-full px-3 py-2 text-sm font-mono bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 ${
                  fieldErrors.examDate
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-slate-900'
                }`}
              />
              {fieldErrors.examDate && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.examDate}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="exam-passing-score-input"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                เกณฑ์คะแนนผ่าน (จำนวนเต็ม &ge; 0)
              </label>
              <input
                id="exam-passing-score-input"
                type="text"
                inputMode="numeric"
                value={formState.passingScore}
                onChange={(e) => {
                  setFormState((prev) => ({ ...prev, passingScore: e.target.value }));
                  if (fieldErrors.passingScore) {
                    setFieldErrors((prev) => ({ ...prev, passingScore: undefined }));
                  }
                }}
                placeholder="0"
                className={`w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  fieldErrors.passingScore
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-slate-900'
                }`}
              />
              {fieldErrors.passingScore && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.passingScore}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="exam-status-select"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              สถานะการสอบ
            </label>
            <select
              id="exam-status-select"
              value={formState.status}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  status: e.target.value as ExaminationStatus,
                }))
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="draft">ฉบับร่าง (Draft)</option>
              <option value="published">เปิดใช้งาน (Published)</option>
              <option value="closed">ปิดการสอบ (Closed)</option>
            </select>
            {fieldErrors.status && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.status}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="exam-description-input"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              รายละเอียดเพิ่มเติม (ไม่บังคับ)
            </label>
            <textarea
              id="exam-description-input"
              rows={3}
              value={formState.description}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="คำชี้แจงหรือหมายเหตุสำหรับการสอบรอบนี้..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving
                ? 'กำลังบันทึก...'
                : isEdit
                ? 'บันทึกการแก้ไข'
                : 'บันทึกการสอบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
