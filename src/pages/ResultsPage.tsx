import React, { useState } from 'react';
import { BarChart3, Search } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

export const ResultsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [examFilter, setExamFilter] = useState('all');

  return (
    <div className="space-y-6">
      <PageHeader
        title="ผลการสอบ"
        description="ตรวจสอบและค้นหาผลการประเมินการสอบปากเปล่าของผู้เข้าสอบแต่ละคน"
      />

      {/* Search and Filter Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัสประจำตัว หรือชื่อผู้เข้าสอบ..."
              aria-label="ค้นหาผลการสอบ"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            aria-label="กรองตามการสอบ"
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            <option value="all">ทุกการสอบ (0 รายการ)</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-mono tabular-nums">
          ทั้งหมด 0 รายการ
        </span>
      </div>

      {/* Results Table Structure & Empty State */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">รหัสผู้เข้าสอบ</th>
                <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                <th className="py-3 px-4">การสอบ</th>
                <th className="py-3 px-4 text-right">คะแนนที่ได้</th>
                <th className="py-3 px-4 text-right">วันที่ประเมิน</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState
                    icon={BarChart3}
                    title="ยังไม่มีข้อมูลผลการสอบ"
                    description="เมื่อมีการดำเนินการสอบและบันทึกผลการประเมินในขั้นตอนถัดไป รายละเอียดคะแนนจะแสดงในตารางนี้"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
