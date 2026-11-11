import React, { useState } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { ALLOWED_RUBRIC_SCORES } from '../types/oralExam';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { MilestoneNotice } from '../components/ui/MilestoneNotice';

export const RubricTemplatesPage: React.FC = () => {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="เกณฑ์การให้คะแนน"
        description="จัดการแม่แบบเกณฑ์การประเมินสำหรับการสอบปากเปล่า โดยทุกเกณฑ์ย่อยรองรับระดับคะแนนมาตรฐาน 0, 1 และ 2 คะแนน"
        actions={
          <button
            type="button"
            onClick={() => setShowNotice(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างเกณฑ์การให้คะแนน</span>
          </button>
        }
      />

      {showNotice && (
        <MilestoneNotice
          title="ฟังก์ชันสร้างแม่แบบเกณฑ์คะแนนยังไม่เปิดใช้งานในระยะที่ 1"
          description="การสร้าง แก้ไข และบันทึกแม่แบบเกณฑ์การให้คะแนนลงในฐานข้อมูลจะดำเนินการในขั้นตอนถัดไป"
          onDismiss={() => setShowNotice(false)}
        />
      )}

      {/* Confirmed Scoring Standard Specification */}
      <section
        aria-label="มาตรฐานระดับคะแนนต่อเกณฑ์ประเมิน"
        className="bg-white border border-slate-200 rounded-xl p-5"
      >
        <h2 className="text-sm font-semibold text-slate-900">
          โครงสร้างคะแนนมาตรฐานต่อเกณฑ์ย่อย
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
          ทุกหัวข้อเกณฑ์การประเมินรองรับเฉพาะค่าคะแนนจำนวนเต็ม 3 ระดับเท่านั้น (คะแนนเต็มรวมของแต่ละแม่แบบจะคำนวณจาก 2 &times; จำนวนเกณฑ์ย่อย)
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ALLOWED_RUBRIC_SCORES.map((score) => {
            const label =
              score === 0
                ? 'ไม่ถูกต้อง / ไม่สามารถอธิบายได้'
                : score === 1
                ? 'ถูกต้องบางส่วน / ยังไม่สมบูรณ์'
                : 'ถูกต้องครบถ้วนชัดเจน';

            return (
              <div
                key={score}
                className="border border-slate-200 rounded-lg px-4 py-3 bg-slate-50/60 flex items-center gap-3"
              >
                <span className="w-8 h-8 rounded-md bg-white border border-slate-200 font-mono tabular-nums text-base font-bold text-slate-900 flex items-center justify-center shrink-0">
                  {score}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900">
                    {score} คะแนน
                  </p>
                  <p className="text-xs text-slate-500 truncate">{label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rubric Template List Area */}
      <section className="space-y-3" aria-label="รายการแม่แบบเกณฑ์การให้คะแนน">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            รายการแม่แบบเกณฑ์การให้คะแนน
          </h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            ทั้งหมด 0 แม่แบบ
          </span>
        </div>

        <EmptyState
          icon={ListChecks}
          title="ยังไม่มีข้อมูลเกณฑ์การให้คะแนน"
          description="แม่แบบเกณฑ์การประเมินที่คุณสร้างจะแสดงที่นี่ เมื่อเปิดใช้งานระบบจัดเก็บข้อมูลในขั้นตอนถัดไป"
        />
      </section>
    </div>
  );
};
