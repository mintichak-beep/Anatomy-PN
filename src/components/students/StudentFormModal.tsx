import React, { useState } from 'react';
import { X } from 'lucide-react';
import { StudentFormInput, StudentRecord } from '../../types/oralExam';
import {
  StudentValidationErrors,
  validateStudentInput,
} from '../../services/students/studentService';

interface StudentFormModalProps {
  initialStudent?: StudentRecord | null;
  onSubmit: (input: StudentFormInput) => Promise<void>;
  onClose: () => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  initialStudent,
  onSubmit,
  onClose,
}) => {
  const isEdit = Boolean(initialStudent);

  const [formState, setFormState] = useState<StudentFormInput>({
    studentCode: initialStudent?.studentCode ?? '',
    fullName: initialStudent?.fullName ?? '',
    department: initialStudent?.department ?? '',
    program: initialStudent?.program ?? '',
    active: initialStudent?.active ?? true,
  });

  const [fieldErrors, setFieldErrors] = useState<StudentValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validateStudentInput(formState);
    if (errors.studentCode || errors.fullName) {
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
          : 'ไม่สามารถบันทึกข้อมูลผู้เข้าสอบได้ กรุณาลองใหม่อีกครั้ง';
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
      aria-labelledby="student-form-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-lg my-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 id="student-form-title" className="text-base font-semibold text-slate-900">
            {isEdit ? 'แก้ไขข้อมูลผู้เข้าสอบ' : 'เพิ่มรายชื่อผู้เข้าสอบ'}
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
              htmlFor="student-code-input"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              รหัสประจำตัว <span className="text-rose-600">*</span>
            </label>
            <input
              id="student-code-input"
              type="text"
              value={formState.studentCode}
              onChange={(e) => {
                setFormState((prev) => ({ ...prev, studentCode: e.target.value }));
                if (fieldErrors.studentCode) {
                  setFieldErrors((prev) => ({ ...prev, studentCode: undefined }));
                }
              }}
              placeholder="เช่น 006701042 หรือ STU-001"
              className={`w-full px-3 py-2 text-sm font-mono bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.studentCode
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-200 focus:ring-slate-900'
              }`}
            />
            {fieldErrors.studentCode && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.studentCode}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="student-fullname-input"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              ชื่อ-นามสกุล <span className="text-rose-600">*</span>
            </label>
            <input
              id="student-fullname-input"
              type="text"
              value={formState.fullName}
              onChange={(e) => {
                setFormState((prev) => ({ ...prev, fullName: e.target.value }));
                if (fieldErrors.fullName) {
                  setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                }
              }}
              placeholder="เช่น นายสมชาย ใจดี"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.fullName
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-200 focus:ring-slate-900'
              }`}
            />
            {fieldErrors.fullName && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.fullName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="student-department-input"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                ภาควิชา / สาขา (ไม่บังคับ)
              </label>
              <input
                id="student-department-input"
                type="text"
                value={formState.department}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, department: e.target.value }))
                }
                placeholder="เช่น กายวิภาคศาสตร์"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="student-program-input"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                หลักสูตร / ชั้นปี (ไม่บังคับ)
              </label>
              <input
                id="student-program-input"
                type="text"
                value={formState.program}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, program: e.target.value }))
                }
                placeholder="เช่น พ.บ. ชั้นปีที่ 2"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="inline-flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formState.active}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, active: e.target.checked }))
                }
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>สถานะใช้งาน (Active)</span>
            </label>
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
                : 'บันทึกผู้เข้าสอบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
