import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  FileEdit,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  ExaminationFormInput,
  ExaminationRecord,
  ExaminationStatus,
} from '../types/oralExam';
import {
  createExam,
  deleteExam,
  updateExam,
} from '../services/exams/examService';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FeedbackBanner } from '../components/ui/FeedbackBanner';
import { ExamFormModal } from '../components/exams/ExamFormModal';

interface ExaminationsPageProps {
  exams: ExaminationRecord[];
  isLoading: boolean;
  dbError: string | null;
  onDataChanged: () => Promise<void>;
}

type StatusFilter = 'all' | ExaminationStatus;

export function renderStatusLabel(status: ExaminationStatus): {
  label: string;
  colorClass: string;
  Icon: React.ComponentType<{ className?: string }>;
} {
  switch (status) {
    case 'published':
      return {
        label: 'เปิดใช้งาน',
        colorClass: 'text-emerald-700',
        Icon: CheckCircle2,
      };
    case 'closed':
      return {
        label: 'ปิดการสอบ',
        colorClass: 'text-slate-500',
        Icon: Lock,
      };
    case 'draft':
    default:
      return {
        label: 'ฉบับร่าง',
        colorClass: 'text-amber-700',
        Icon: FileEdit,
      };
  }
}

export const ExaminationsPage: React.FC<ExaminationsPageProps> = ({
  exams,
  isLoading,
  dbError,
  onDataChanged,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExaminationRecord | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ExaminationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    variant: 'success' | 'error';
    message: string;
  } | null>(null);

  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return exams.filter((exam) => {
      const matchesStatus =
        statusFilter === 'all' ? true : exam.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;

      return (
        exam.title.toLowerCase().includes(q) ||
        exam.subject.toLowerCase().includes(q)
      );
    });
  }, [exams, searchQuery, statusFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const handleOpenCreate = () => {
    setEditingExam(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (exam: ExaminationRecord) => {
    setEditingExam(exam);
    setFormOpen(true);
  };

  const handleFormSubmit = async (input: ExaminationFormInput) => {
    if (editingExam) {
      const updated = await updateExam(editingExam.id, input);
      await onDataChanged();
      setFormOpen(false);
      setEditingExam(null);
      setFeedback({
        variant: 'success',
        message: `บันทึกการแก้ไขการสอบ "${updated.title}" เรียบร้อยแล้ว`,
      });
    } else {
      const created = await createExam(input);
      await onDataChanged();
      setFormOpen(false);
      setFeedback({
        variant: 'success',
        message: `สร้างการสอบ "${created.title}" เรียบร้อยแล้ว`,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteExam(deleteTarget.id);
      const removedTitle = deleteTarget.title;
      await onDataChanged();
      setDeleteTarget(null);
      setFeedback({
        variant: 'success',
        message: `ลบการสอบ "${removedTitle}" เรียบร้อยแล้ว`,
      });
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถลบข้อมูลการสอบได้ กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="การสอบ"
        description="จัดการรอบการสอบปากเปล่า กำหนดวันที่สอบ เกณฑ์คะแนนผ่าน และสถานะการสอบ (จัดเก็บใน IndexedDB)"
        actions={
          <button
            type="button"
            disabled={Boolean(dbError)}
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างการสอบ</span>
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

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อการสอบ หรือรายวิชา..."
              aria-label="ค้นหารายการสอบ"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            {(
              [
                { value: 'all', label: 'ทั้งหมด' },
                { value: 'draft', label: 'ฉบับร่าง' },
                { value: 'published', label: 'เปิดใช้งาน' },
                { value: 'closed', label: 'ปิดการสอบ' },
              ] as { value: StatusFilter; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === opt.value
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
          แสดง {filteredExams.length} / {exams.length} รายการ
        </span>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex items-center justify-center gap-2.5 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>กำลังโหลดข้อมูลการสอบจาก IndexedDB...</span>
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="ยังไม่มีข้อมูลการสอบ"
          description="สร้างรอบการสอบแรกของคุณเพื่อจัดการกำหนดการสอบและเกณฑ์คะแนนผ่าน"
          action={
            <button
              type="button"
              disabled={Boolean(dbError)}
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สร้างการสอบครั้งแรก</span>
            </button>
          }
        />
      ) : filteredExams.length === 0 ? (
        <EmptyState
          icon={Search}
          title="ไม่พบรายการสอบที่ตรงกับเงื่อนไข"
          description="ลองปรับคำค้นหาหรือล้างตัวกรองสถานะเพื่อดูรายการทั้งหมด"
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
                  <th className="py-3 px-4">ชื่อการสอบ</th>
                  <th className="py-3 px-4">รายวิชา</th>
                  <th className="py-3 px-4 w-32">วันที่สอบ</th>
                  <th className="py-3 px-4 text-right w-28">คะแนนผ่าน</th>
                  <th className="py-3 px-4 w-32">สถานะ</th>
                  <th className="py-3 px-4 text-right w-28">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExams.map((exam) => {
                  const statusInfo = renderStatusLabel(exam.status);
                  const StatusIcon = statusInfo.Icon;
                  return (
                    <tr key={exam.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{exam.title}</p>
                        {exam.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {exam.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {exam.subject || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                        {exam.examDate}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                        {exam.passingScore}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusInfo.colorClass}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(exam)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="แก้ไขข้อมูล"
                            aria-label={`แก้ไข ${exam.title}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(exam);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="ลบข้อมูล"
                            aria-label={`ลบ ${exam.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formOpen && (
        <ExamFormModal
          initialExam={editingExam}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setFormOpen(false);
            setEditingExam(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="ยืนยันการลบข้อมูลการสอบ"
          description={`คุณต้องการลบการสอบ "${deleteTarget.title}" (${deleteTarget.examDate}) ออกจากฐานข้อมูลหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
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
