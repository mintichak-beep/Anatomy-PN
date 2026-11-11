import React, { useState } from 'react';
import { BookOpen, FolderOpen, Plus, Search } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { MilestoneNotice } from '../components/ui/MilestoneNotice';

export const QuestionBankPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="คลังคำถาม"
        description="จัดการชุดคำถามและรายการคำถามสำหรับใช้ถามผู้เข้าสอบแบบปากเปล่า"
        actions={
          <button
            type="button"
            onClick={() => setShowNotice(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มชุดคำถาม</span>
          </button>
        }
      />

      {showNotice && (
        <MilestoneNotice
          title="ฟังก์ชันจัดการคลังคำถามยังไม่เปิดใช้งานในระยะที่ 1"
          description="การสร้างชุดคำถาม เพิ่มรายการคำถาม และจัดเก็บลงฐานข้อมูลจะดำเนินการในขั้นตอนถัดไป"
          onDismiss={() => setShowNotice(false)}
        />
      )}

      {/* Search Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชุดคำถาม หรือหัวข้อคำถาม..."
            aria-label="ค้นหาในคลังคำถาม"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono tabular-nums">
          0 ชุดคำถาม · 0 คำถาม
        </span>
      </div>

      {/* Question Sets & Question List Split Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-5 space-y-3" aria-label="ชุดคำถาม">
          <h2 className="text-sm font-semibold text-slate-900">ชุดคำถาม</h2>
          <EmptyState
            icon={FolderOpen}
            title="ยังไม่มีข้อมูลชุดคำถาม"
            description="ชุดคำถามสำหรับจัดหมวดหมู่หัวข้อสอบจะแสดงที่นี่"
          />
        </section>

        <section className="lg:col-span-7 space-y-3" aria-label="รายการคำถาม">
          <h2 className="text-sm font-semibold text-slate-900">รายการคำถาม</h2>
          <EmptyState
            icon={BookOpen}
            title="ยังไม่มีข้อมูลคำถาม"
            description="รายการคำถามภายในชุดคำถามที่เลือกจะแสดงในส่วนนี้เมื่อเพิ่มข้อมูลในขั้นตอนถัดไป"
          />
        </section>
      </div>
    </div>
  );
};
