import React, { useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { AnatomySystem, AnatomyTerm, SystemId } from '../types/anatomy';

interface LibraryManagerViewProps {
  systems: AnatomySystem[];
  terms: AnatomyTerm[];
  onAddCustomTerm: (term: AnatomyTerm) => void;
  onDeleteCustomTerm: (id: string) => void;
}

export const LibraryManagerView: React.FC<LibraryManagerViewProps> = ({
  systems,
  terms,
  onAddCustomTerm,
  onDeleteCustomTerm,
}) => {
  const [filterSystem, setFilterSystem] = useState<SystemId | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newSystemId, setNewSystemId] = useState<SystemId>('respiratory');
  const [newTermEn, setNewTermEn] = useState('');
  const [newTermLatin, setNewTermLatin] = useState('');
  const [newTermTh, setNewTermTh] = useState('');

  const filteredTerms = terms.filter((t) => {
    const matchesSys = filterSystem === 'all' || t.systemId === filterSystem;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.termEn.toLowerCase().includes(q) ||
      t.termTh.toLowerCase().includes(q) ||
      (t.termLatin || '').toLowerCase().includes(q);
    return matchesSys && matchesSearch;
  });

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermEn.trim()) return;

    const created: AnatomyTerm = {
      id: `custom-term-${Date.now()}`,
      systemId: newSystemId,
      termEn: newTermEn.trim(),
      termLatin: newTermLatin.trim() || undefined,
      termTh: newTermTh.trim(),
      isCustom: true,
    };

    onAddCustomTerm(created);
    setShowAddModal(false);
    setNewTermEn('');
    setNewTermLatin('');
    setNewTermTh('');
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            คลังคำศัพท์กายวิภาคศาสตร์ (8 ระบบ)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            คำศัพท์มาตรฐานทั้ง {systems.length} ระบบสำหรับใช้สุ่มถามบนภาพที่อาจารย์อัปโหลด สามารถเพิ่มคำศัพท์ใหม่ได้ตามต้องการ
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มคำศัพท์เข้าคลัง</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setFilterSystem('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              filterSystem === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทุกระบบ ({terms.length})
          </button>
          {systems.map((sys) => (
            <button
              key={sys.id}
              type="button"
              onClick={() => setFilterSystem(sys.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterSystem === sys.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sys.nameTh}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาคำศัพท์ EN / ไทย..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
          />
        </div>
      </div>

      {/* Term Table (Pure Terms, No Standard Images or Answer Keys) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-14">ลำดับ</th>
                <th className="py-3 px-4">ระบบอวัยวะ</th>
                <th className="py-3 px-4">คำศัพท์ (English / Latin)</th>
                <th className="py-3 px-4">ชื่อภาษาไทย</th>
                <th className="py-3 px-4 text-right w-20">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTerms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-xs text-slate-500">
                    ไม่พบคำศัพท์ที่ตรงกับการค้นหา
                  </td>
                </tr>
              ) : (
                filteredTerms.map((term, idx) => {
                  const sys = systems.find((s) => s.id === term.systemId);
                  return (
                    <tr key={term.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {sys?.nameTh || term.systemId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">{term.termEn}</span>
                        {term.termLatin && term.termLatin !== term.termEn && (
                          <span className="ml-2 text-xs italic text-slate-400">
                            ({term.termLatin})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {term.termTh || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {term.isCustom ? (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomTerm(term.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                            title="ลบคำศัพท์ที่เพิ่มเอง"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom Term Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                เพิ่มคำศัพท์ใหม่เข้าคลัง 8 ระบบ
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ระบบอวัยวะ
                </label>
                <select
                  value={newSystemId}
                  onChange={(e) => setNewSystemId(e.target.value as SystemId)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                >
                  {systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameTh} ({s.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  คำศัพท์ภาษาอังกฤษ *
                </label>
                <input
                  required
                  type="text"
                  value={newTermEn}
                  onChange={(e) => setNewTermEn(e.target.value)}
                  placeholder="เช่น Coronary Sinus"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อภาษาละติน (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={newTermLatin}
                  onChange={(e) => setNewTermLatin(e.target.value)}
                  placeholder="เช่น Sinus coronarius"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อภาษาไทย (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={newTermTh}
                  onChange={(e) => setNewTermTh(e.target.value)}
                  placeholder="เช่น แอ่งเลือดดำหัวใจ"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg cursor-pointer"
                >
                  บันทึกคำศัพท์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
