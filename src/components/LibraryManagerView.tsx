import React, { useState } from 'react';
import { Plus, Search, Trash2, Upload, MapPin, X } from 'lucide-react';
import { AnatomySystem, AnatomyTerm, SystemId } from '../types/anatomy';
import { AnatomyStageCanvas } from './AnatomyStageCanvas';

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
  const [selectedTermId, setSelectedTermId] = useState<string>(terms[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Custom Term Form State
  const [newSystemId, setNewSystemId] = useState<SystemId>('skeletal');
  const [newTermEn, setNewTermEn] = useState('');
  const [newTermTh, setNewTermTh] = useState('');
  const [newRegionTh, setNewRegionTh] = useState('');
  const [newHintTh, setNewHintTh] = useState('');
  const [newRubric2, setNewRubric2] = useState('');
  const [newRubric1, setNewRubric1] = useState('');
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newPin, setNewPin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const filteredTerms = terms.filter((t) => {
    const matchesSys = filterSystem === 'all' || t.systemId === filterSystem;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.termEn.toLowerCase().includes(q) ||
      t.termTh.toLowerCase().includes(q) ||
      t.regionTh.toLowerCase().includes(q);
    return matchesSys && matchesSearch;
  });

  const activeTerm =
    filteredTerms.find((t) => t.id === selectedTermId) || filteredTerms[0] || terms[0];
  const activeSystem =
    systems.find((s) => s.id === activeTerm?.systemId) || systems[0];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Resize cleanly to max 960px width to fit localStorage nicely
        const maxW = 960;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setNewImageUrl(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePlacePinClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));
    setNewPin({ x, y });
  };

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermEn.trim() || !newTermTh.trim()) return;

    const created: AnatomyTerm = {
      id: `custom-${Date.now()}`,
      systemId: newSystemId,
      termEn: newTermEn.trim(),
      termTh: newTermTh.trim(),
      regionTh: newRegionTh.trim() || 'ภาพเพิ่มเติมโดยอาจารย์',
      pinX: newPin.x,
      pinY: newPin.y,
      clinicalHintTh: newHintTh.trim() || 'อธิบายชื่อโครงสร้าง ตำแหน่ง และหน้าที่สำคัญ',
      rubric2Pt: newRubric2.trim() || 'ระบุชื่อคำศัพท์และหน้าที่สำคัญได้ครบถ้วนภายใน 30 วินาที',
      rubric1Pt: newRubric1.trim() || 'ระบุชื่อได้บางส่วนหรืออธิบายหน้าที่ไม่สมบูรณ์',
      customImageUrl: newImageUrl || undefined,
      isCustom: true,
    };

    onAddCustomTerm(created);
    setSelectedTermId(created.id);
    setShowAddModal(false);
    setNewTermEn('');
    setNewTermTh('');
    setNewRegionTh('');
    setNewHintTh('');
    setNewRubric2('');
    setNewRubric1('');
    setNewImageUrl('');
    setNewPin({ x: 50, y: 50 });
  };

  const previewSystem = systems.find((s) => s.id === newSystemId) || systems[0];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            คลังภาพและคำศัพท์กายวิภาคศาสตร์
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            ตรวจสอบจุดชี้บนภาพและเกณฑ์การให้คะแนน 0–2 คะแนน หรืออัปโหลดภาพจำลอง/ภาพอาจารย์ใหญ่เพิ่มเติมได้
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มคำศัพท์ / อัปโหลดภาพเอง</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
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

      {/* Master-Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        {/* Term List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
            รายการคำศัพท์ ({filteredTerms.length})
          </div>
          <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
            {filteredTerms.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                ไม่พบคำศัพท์ที่ตรงกับการค้นหา
              </div>
            ) : (
              filteredTerms.map((term) => {
                const sys = systems.find((s) => s.id === term.systemId);
                const isSelected = activeTerm?.id === term.id;
                return (
                  <div
                    key={term.id}
                    onClick={() => setSelectedTermId(term.id)}
                    className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {term.termEn}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                        <span>{term.termTh}</span>
                        <span aria-hidden="true">·</span>
                        <span>{sys?.nameTh}</span>
                      </div>
                    </div>

                    {term.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomTerm(term.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer shrink-0"
                        title="ลบคำศัพท์ที่เพิ่มเอง"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Plate Preview & Rubric */}
        <div className="lg:col-span-7 space-y-4">
          {activeTerm && activeSystem && (
            <>
              <AnatomyStageCanvas
                key={activeTerm.id}
                system={activeSystem}
                term={activeTerm}
                examMode="spotter"
              />

              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{activeTerm.termEn}</h2>
                  {activeTerm.termLatin && (
                    <span className="text-xs italic text-slate-500">{activeTerm.termLatin}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-sky-800">{activeTerm.termTh}</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {activeTerm.clinicalHintTh}
                </p>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
                    <span className="font-mono font-bold text-emerald-800 block mb-1">
                      เกณฑ์ 2 คะแนน (ถูกต้องครบถ้วน)
                    </span>
                    <span className="text-slate-700 leading-relaxed">{activeTerm.rubric2Pt}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-100">
                    <span className="font-mono font-bold text-amber-800 block mb-1">
                      เกณฑ์ 1 คะแนน (ถูกบางส่วน)
                    </span>
                    <span className="text-slate-700 leading-relaxed">{activeTerm.rubric1Pt}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Custom Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 my-8 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                เพิ่มโจทย์ภาพและคำศัพท์ใหม่
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
              {/* Left: Image & Pin Placement */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    คลิกบนภาพเพื่อปักหมุดตำแหน่งคำถาม
                  </span>
                  <span className="font-mono tabular-nums text-[11px] text-slate-500">
                    X: {newPin.x}% · Y: {newPin.y}%
                  </span>
                </div>

                <div
                  onClick={handlePlacePinClick}
                  className="relative w-full aspect-[4/3] bg-[#F5F2EA] border border-slate-200 rounded-xl overflow-hidden cursor-crosshair"
                >
                  {newImageUrl ? (
                    <img
                      src={newImageUrl}
                      alt="Custom anatomy upload"
                      className="w-full h-full object-cover"
                    />
                  ) : previewSystem.plateImage !== 'svg-brain' ? (
                    <img
                      src={previewSystem.plateImage}
                      alt={previewSystem.nameEn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 p-4 text-center">
                      อัปโหลดภาพสมองหรือภาพโครงสร้างเพื่อวางหมุด
                    </div>
                  )}

                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${newPin.x}%`,
                      top: `${newPin.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <MapPin className="w-6 h-6 text-rose-600 fill-rose-600/20 -mt-3" />
                  </div>
                </div>

                <label className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-dashed border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{newImageUrl ? 'เปลี่ยนรูปภาพที่อัปโหลด' : 'อัปโหลดภาพของอาจารย์เอง (ถ้ามี)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Right: Term & Rubric Inputs */}
              <div className="space-y-3">
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
                    คำศัพท์ภาษาอังกฤษ / ละติน *
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
                    ชื่อภาษาไทย *
                  </label>
                  <input
                    required
                    type="text"
                    value={newTermTh}
                    onChange={(e) => setNewTermTh(e.target.value)}
                    placeholder="เช่น แอ่งเลือดดำหัวใจ"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    บริเวณ / คำอธิบายสั้น
                  </label>
                  <input
                    type="text"
                    value={newHintTh}
                    onChange={(e) => setNewHintTh(e.target.value)}
                    placeholder="เช่น รับเลือดดำจากกล้ามเนื้อหัวใจเข้าสู่ Right Atrium"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-800 mb-1">
                    เกณฑ์ได้ 2 คะแนน
                  </label>
                  <input
                    type="text"
                    value={newRubric2}
                    onChange={(e) => setNewRubric2(e.target.value)}
                    placeholder="บอกชื่อถูกต้องพร้อมหน้าที่หลัก"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-amber-800 mb-1">
                    เกณฑ์ได้ 1 คะแนน
                  </label>
                  <input
                    type="text"
                    value={newRubric1}
                    onChange={(e) => setNewRubric1(e.target.value)}
                    placeholder="บอกชื่อได้แต่ไม่ทราบหน้าที่"
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
                    บันทึกเข้าคลังข้อสอบ
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
