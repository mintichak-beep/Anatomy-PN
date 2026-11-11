import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Slash,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { StudentFormInput, StudentRecord } from '../types/oralExam';
import {
  createStudent,
  deleteStudent,
  setStudentActiveStatus,
  updateStudent,
} from '../services/students/studentService';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FeedbackBanner } from '../components/ui/FeedbackBanner';
import { StudentFormModal } from '../components/students/StudentFormModal';

interface StudentsPageProps {
  students: StudentRecord[];
  isLoading: boolean;
  dbError: string | null;
  onDataChanged: () => Promise<void>;
}

type ActiveFilter = 'all' | 'active' | 'inactive';

export const StudentsPage: React.FC<StudentsPageProps> = ({
  students,
  isLoading,
  dbError,
  onDataChanged,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<StudentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    variant: 'success' | 'error';
    message: string;
  } | null>(null);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((stu) => {
      const matchesStatus =
        activeFilter === 'all'
          ? true
          : activeFilter === 'active'
          ? stu.active
          : !stu.active;

      if (!matchesStatus) return false;
      if (!q) return true;

      return (
        stu.studentCode.toLowerCase().includes(q) ||
        stu.fullName.toLowerCase().includes(q)
      );
    });
  }, [activeFilter, searchQuery, students]);

  const hasActiveFilters = searchQuery.trim() !== '' || activeFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
  };

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (student: StudentRecord) => {
    setEditingStudent(student);
    setFormOpen(true);
  };

  const handleFormSubmit = async (input: StudentFormInput) => {
    if (editingStudent) {
      const updated = await updateStudent(editingStudent.id, input);
      await onDataChanged();
      setFormOpen(false);
      setEditingStudent(null);
      setFeedback({
        variant: 'success',
        message: `บันทึกการแก้ไขข้อมูลผู้เข้าสอบ "${updated.studentCode} · ${updated.fullName}" เรียบร้อยแล้ว`,
      });
    } else {
      const created = await createStudent(input);
      await onDataChanged();
      setFormOpen(false);
      setFeedback({
        variant: 'success',
        message: `เพิ่มรายชื่อผู้เข้าสอบ "${created.studentCode} · ${created.fullName}" เรียบร้อยแล้ว`,
      });
    }
  };

  const handleToggleActive = async (student: StudentRecord) => {
    setTogglingId(student.id);
    setFeedback(null);
    try {
      const nextActive = !student.active;
      const updated = await setStudentActiveStatus(student.id, nextActive);
      await onDataChanged();
      setFeedback({
        variant: 'success',
        message: updated.active
          ? `เปิดใช้งานผู้เข้าสอบ "${updated.studentCode} · ${updated.fullName}" แล้ว`
          : `ปิดใช้งานผู้เข้าสอบ "${updated.studentCode} · ${updated.fullName}" แล้ว`,
      });
    } catch (err) {
      setFeedback({
        variant: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'ไม่สามารถเปลี่ยนสถานะผู้เข้าสอบได้ กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteStudent(deleteTarget.id);
      const removedLabel = `${deleteTarget.studentCode} · ${deleteTarget.fullName}`;
      await onDataChanged();
      setDeleteTarget(null);
      setFeedback({
        variant: 'success',
        message: `ลบข้อมูลผู้เข้าสอบ "${removedLabel}" เรียบร้อยแล้ว`,
      });
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถลบข้อมูลผู้เข้าสอบได้ กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="รายชื่อผู้เข้าสอบ"
        description="จัดการทะเบียนนักศึกษาสำหรับเรียกเข้าสอบปากเปล่า ข้อมูลทั้งหมดจัดเก็บภายในเบราว์เซอร์ (IndexedDB)"
        actions={
          <button
            type="button"
            disabled={Boolean(dbError)}
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายชื่อผู้เข้าสอบ</span>
          </button>
        }
      />

      {dbError && <FeedbackBanner variant="error" message={dbError} />}

      {feedback && (
        <FeedbackBanner
          variant={feedback.variant}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* Search & Active Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัสประจำตัว หรือชื่อ-นามสกุล..."
              aria-label="ค้นหารายชื่อผู้เข้าสอบ"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            {(
              [
                { value: 'all', label: 'ทั้งหมด' },
                { value: 'active', label: 'ใช้งาน' },
                { value: 'inactive', label: 'ปิดใช้งาน' },
              ] as { value: ActiveFilter; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActiveFilter(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeFilter === opt.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        <span className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
          แสดง {filteredStudents.length} / {students.length} คน
        </span>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex items-center justify-center gap-2.5 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>กำลังโหลดข้อมูลผู้เข้าสอบจาก IndexedDB...</span>
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="ยังไม่มีข้อมูลผู้เข้าสอบ"
          description="เพิ่มรายชื่อนักศึกษาเพื่อเริ่มต้นจัดทำทะเบียนผู้เข้าสอบในเบราว์เซอร์"
          action={
            <button
              type="button"
              disabled={Boolean(dbError)}
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มรายชื่อผู้เข้าสอบคนแรก</span>
            </button>
          }
        />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon={Search}
          title="ไม่พบรายชื่อผู้เข้าสอบที่ตรงกับเงื่อนไข"
          description="ลองปรับคำค้นหาหรือล้างตัวกรองสถานะเพื่อดูรายชื่อทั้งหมด"
          action={
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              ล้างการค้นหาและตัวกรอง
            </button>
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 w-36">รหัสประจำตัว</th>
                  <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-4">ภาควิชา / สาขา</th>
                  <th className="py-3 px-4">หลักสูตร</th>
                  <th className="py-3 px-4 w-32">สถานะ</th>
                  <th className="py-3 px-4 text-right w-44">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                      {stu.studentCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {stu.fullName}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {stu.department || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {stu.program || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {stu.active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>ใช้งาน</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Slash className="w-3.5 h-3.5 shrink-0" />
                          <span>ปิดใช้งาน</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={togglingId === stu.id}
                          onClick={() => handleToggleActive(stu)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer disabled:opacity-40"
                        >
                          {stu.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(stu)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="แก้ไขข้อมูล"
                          aria-label={`แก้ไข ${stu.fullName}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(stu);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="ลบข้อมูล"
                          aria-label={`ลบ ${stu.fullName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formOpen && (
        <StudentFormModal
          initialStudent={editingStudent}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setFormOpen(false);
            setEditingStudent(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="ยืนยันการลบข้อมูลผู้เข้าสอบ"
          description={`คุณต้องการลบรายชื่อ "${deleteTarget.studentCode} · ${deleteTarget.fullName}" ออกจากฐานข้อมูลหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
          isBusy={isDeleting}
          errorMessage={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (!isDeleting) {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }}
        />
      )}
    </div>
  );
};
