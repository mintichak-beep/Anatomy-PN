import React, { useState, useRef } from 'react';
import { Upload, X, Plus, Trash2, Check, ListPlus, Crosshair, MapPinOff } from 'lucide-react';
import {
  AnatomySystem,
  AnatomyTerm,
  CustomPlate,
  CustomPlateTerm,
  SystemId,
} from '../types/anatomy';
import { getSystemTheme } from '../data/systemThemes';

interface CustomPlateBuilderModalProps {
  systems: AnatomySystem[];
  allTerms: AnatomyTerm[];
  initialPlate?: CustomPlate | null;
  initialSystemId?: SystemId;
  initialImageUrl?: string;
  onSave: (plate: CustomPlate) => void;
  onClose: () => void;
}

export const CustomPlateBuilderModal: React.FC<CustomPlateBuilderModalProps> = ({
  systems,
  allTerms,
  initialPlate,
  initialSystemId,
  initialImageUrl,
  onSave,
  onClose,
}) => {
  const candidateSystemId = initialPlate?.systemId || initialSystemId || 'respiratory';
  const defaultSystemId: SystemId = systems.some((s) => s.id === candidateSystemId)
    ? candidateSystemId
    : (systems[0]?.id || 'respiratory');
  const [title, setTitle] = useState(initialPlate?.title || '');
  const [systemId, setSystemId] = useState<SystemId>(defaultSystemId);
  const [imageUrl, setImageUrl] = useState(initialPlate?.imageUrl || initialImageUrl || '');
  const [terms, setTerms] = useState<CustomPlateTerm[]>(() => {
    if (initialPlate) return initialPlate.terms;
    return allTerms
      .filter((t) => t.systemId === defaultSystemId)
      .map((t) => ({
        id: `cpt-${t.id}`,
        systemId: t.systemId,
        termEn: t.termEn,
        termTh: t.termTh,
      }));
  });

  const [activePinTermId, setActivePinTermId] = useState<string | null>(() => {
    if (initialPlate) {
      const firstUnpinned = initialPlate.terms.find((t) => t.targetX === undefined);
      return firstUnpinned?.id || initialPlate.terms[0]?.id || null;
    }
    const firstSysTerm = allTerms.find((t) => t.systemId === defaultSystemId);
    return firstSysTerm ? `cpt-${firstSysTerm.id}` : null;
  });

  const [addTab, setAddTab] = useState<'bank' | 'manual' | 'batch'>('bank');
  const [manualEn, setManualEn] = useState('');
  const [manualTh, setManualTh] = useState('');
  const [batchText, setBatchText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);

  const systemBankTerms = allTerms.filter((t) => t.systemId === systemId);

  const handleSystemChange = (nextSys: SystemId) => {
    setSystemId(nextSys);
    if (!initialPlate) {
      const nextTerms = allTerms
        .filter((t) => t.systemId === nextSys)
        .map((t) => ({
          id: `cpt-${t.id}`,
          systemId: t.systemId,
          termEn: t.termEn,
          termTh: t.termTh,
        }));
      setTerms(nextTerms);
      setActivePinTermId(nextTerms[0]?.id || null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1080;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setImageUrl(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrl || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));
    const clampedX = Math.max(1, Math.min(99, x));
    const clampedY = Math.max(1, Math.min(99, y));

    if (activePinTermId && terms.some((t) => t.id === activePinTermId)) {
      const nextTerms = terms.map((t) =>
        t.id === activePinTermId ? { ...t, targetX: clampedX, targetY: clampedY } : t
      );
      setTerms(nextTerms);
      // Auto-advance selection to next unpinned term for rapid clicking
      const nextUnpinned = nextTerms.find(
        (t) => t.id !== activePinTermId && t.targetX === undefined
      );
      setActivePinTermId(nextUnpinned ? nextUnpinned.id : null);
    } else {
      // Direct spot creation without needing to pick a term first
      const spotNum = terms.filter((t) => t.targetX !== undefined).length + 1;
      const newSpot: CustomPlateTerm = {
        id: `cpt-spot-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        systemId,
        termEn: `จุดที่ ${spotNum}`,
        termTh: '',
        targetX: clampedX,
        targetY: clampedY,
      };
      setTerms((prev) => [...prev, newSpot]);
    }
  };

  const handleClearPin = (id: string) => {
    setTerms((prev) =>
      prev.map((t) => (t.id === id ? { ...t, targetX: undefined, targetY: undefined } : t))
    );
    setActivePinTermId(id);
  };

  const handleClearAllPins = () => {
    setTerms((prev) => prev.map((t) => ({ ...t, targetX: undefined, targetY: undefined })));
    setActivePinTermId(terms[0]?.id || null);
  };

  const isBankTermAdded = (bankTerm: AnatomyTerm) =>
    terms.some((t) => t.termEn.toLowerCase() === bankTerm.termEn.toLowerCase());

  const toggleBankTerm = (bankTerm: AnatomyTerm) => {
    if (isBankTermAdded(bankTerm)) {
      const next = terms.filter((t) => t.termEn.toLowerCase() !== bankTerm.termEn.toLowerCase());
      setTerms(next);
      if (activePinTermId && !next.some((t) => t.id === activePinTermId)) {
        setActivePinTermId(next[0]?.id || null);
      }
    } else {
      const created: CustomPlateTerm = {
        id: `cpt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        systemId: bankTerm.systemId,
        termEn: bankTerm.termEn,
        termTh: bankTerm.termTh,
      };
      setTerms((prev) => [...prev, created]);
      setActivePinTermId(created.id);
    }
  };

  const selectAllSystemBankTerms = () => {
    const additions: CustomPlateTerm[] = [];
    for (const bt of systemBankTerms) {
      if (!isBankTermAdded(bt)) {
        additions.push({
          id: `cpt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          systemId: bt.systemId,
          termEn: bt.termEn,
          termTh: bt.termTh,
        });
      }
    }
    setTerms((prev) => [...prev, ...additions]);
    if (!activePinTermId && additions[0]) {
      setActivePinTermId(additions[0].id);
    }
  };

  const clearSystemTerms = () => {
    setTerms([]);
    setActivePinTermId(null);
  };

  const handleAddManual = () => {
    if (!manualEn.trim()) return;
    const created: CustomPlateTerm = {
      id: `cpt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      systemId,
      termEn: manualEn.trim(),
      termTh: manualTh.trim(),
    };
    setTerms((prev) => [...prev, created]);
    setActivePinTermId(created.id);
    setManualEn('');
    setManualTh('');
  };

  const handleAddBatch = () => {
    const lines = batchText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const additions: CustomPlateTerm[] = lines.map((line, i) => {
      const [enPart, thPart] = line.split('|').map((s) => s.trim());
      return {
        id: `cpt-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
        systemId,
        termEn: enPart,
        termTh: thPart || '',
      };
    });

    setTerms((prev) => [...prev, ...additions]);
    if (!activePinTermId && additions[0]) {
      setActivePinTermId(additions[0].id);
    }
    setBatchText('');
  };

  const handleRemoveTerm = (id: string) => {
    const next = terms.filter((t) => t.id !== id);
    setTerms(next);
    if (activePinTermId === id) {
      setActivePinTermId(next.find((t) => t.targetX === undefined)?.id || null);
    }
  };

  const handleSavePlate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setErrorMsg('กรุณาอัปโหลดรูปภาพก่อนบันทึก');
      return;
    }
    if (terms.length === 0) {
      setErrorMsg('กรุณาคลิกกำหนดจุดเลเซอร์บนภาพ หรือเลือกคำศัพท์อย่างน้อย 1 รายการ');
      return;
    }

    const plate: CustomPlate = {
      id: initialPlate?.id || `plate-${Date.now()}`,
      title:
        title.trim() ||
        systems.find((s) => s.id === systemId)?.nameTh ||
        'ภาพกายวิภาค',
      systemId,
      imageUrl,
      terms,
      createdAt: initialPlate?.createdAt || new Date().toISOString(),
    };
    onSave(plate);
  };

  const pinnedCount = terms.filter((t) => t.targetX !== undefined && t.targetY !== undefined).length;
  const activeTerm = terms.find((t) => t.id === activePinTermId) || null;
  const activeTheme = getSystemTheme(systemId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full p-6 my-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialPlate ? 'แก้ไขภาพและกำหนดจุดเลเซอร์บนภาพ' : 'อัปโหลดภาพและกำหนดจุดเลเซอร์สำหรับสุ่มชี้'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกบนภาพเพื่อกำหนดตำแหน่งที่ต้องการให้ระบบสุ่มเลเซอร์ชี้ (หน้าทดสอบจริงจะไม่แสดงเฉลย)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSavePlate} className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
          {/* Left: Interactive Image + Laser Pinning Stage */}
          <div className="lg:col-span-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ระบบอวัยวะ (8 ระบบ)
                </label>
                <select
                  value={systemId}
                  onChange={(e) => handleSystemChange(e.target.value as SystemId)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  ชื่อชุดภาพ (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ภาพหุ่นจำลองหัวใจ ชุดที่ 1"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {imageUrl && (
              <div className={`px-3.5 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${activeTheme.softBg} ${activeTheme.softBorder}`}>
                <div className={`flex items-center gap-2 min-w-0 ${activeTheme.accentText}`}>
                  <Crosshair className="w-4 h-4 text-rose-600 shrink-0" />
                  {activeTerm ? (
                    <span className="truncate">
                      คลิกบนภาพเพื่อชี้จุดสำหรับ: <strong>{activeTerm.termEn}</strong>
                    </span>
                  ) : (
                    <span>
                      โหมดจิ้มจุดใหม่บนภาพ · คลิกจุดใดก็ได้บนภาพเพื่อเพิ่มจุดเลเซอร์
                    </span>
                  )}
                </div>
                {pinnedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllPins}
                    className="text-[11px] font-medium text-rose-700 hover:underline cursor-pointer shrink-0"
                  >
                    ล้างจุดทั้งหมด ({pinnedCount})
                  </button>
                )}
              </div>
            )}

            <div
              ref={stageRef}
              onClick={handleStageClick}
              className={`relative w-full aspect-[4/3] bg-specimen-stage border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center select-none ${
                imageUrl ? 'cursor-crosshair' : ''
              }`}
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Instructor plate preview"
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                  {/* Render Pinned Laser Dots */}
                  {terms.map((t, idx) => {
                    if (t.targetX === undefined || t.targetY === undefined) return null;
                    const isFocused = t.id === activePinTermId;
                    return (
                      <div
                        key={t.id}
                        style={{
                          left: `${t.targetX}%`,
                          top: `${t.targetY}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute pointer-events-none z-10"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-md ring-2 ${
                            isFocused
                              ? 'bg-sky-600 ring-white scale-110'
                              : 'bg-rose-600 ring-white/90'
                          }`}
                        >
                          {idx + 1}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 text-center cursor-pointer w-full h-full bg-slate-100 hover:bg-slate-200/70 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-700">
                    คลิกเพื่ออัปโหลดภาพของคุณ
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    รองรับไฟล์ JPG, PNG, WebP
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {imageUrl && (
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center justify-center gap-2 flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>เปลี่ยนรูปภาพ</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setActivePinTermId(null)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                    activePinTermId === null
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>จิ้มจุดใหม่บนภาพ</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Terms & Pinned Coordinates List */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  กำหนดคำศัพท์และจุดเลเซอร์ ({pinnedCount}/{terms.length} จุด)
                </span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAddTab('bank')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                      addTab === 'bank' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    คำศัพท์ระบบนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddTab('manual')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                      addTab === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    พิมพ์เพิ่มเอง
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddTab('batch')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                      addTab === 'batch' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    วางหลายคำ
                  </button>
                </div>
              </div>

              {addTab === 'bank' && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      คลังคำศัพท์{' '}
                      <strong>{systems.find((s) => s.id === systemId)?.nameTh}</strong>
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={selectAllSystemBankTerms}
                        className="text-sky-600 font-semibold hover:underline cursor-pointer"
                      >
                        เลือกทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={clearSystemTerms}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        ล้างรายการ
                      </button>
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {systemBankTerms.map((bt) => {
                      const active = isBankTermAdded(bt);
                      return (
                        <button
                          key={bt.id}
                          type="button"
                          onClick={() => toggleBankTerm(bt)}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'bg-sky-50 border-sky-500 text-sky-900 font-medium'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{bt.termEn}</span>
                          {active && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {addTab === 'manual' && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={manualEn}
                    onChange={(e) => setManualEn(e.target.value)}
                    placeholder="คำศัพท์ EN / Latin (เช่น Femur)"
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    type="text"
                    value={manualTh}
                    onChange={(e) => setManualTh(e.target.value)}
                    placeholder="หมายเหตุ (ไม่บังคับ)"
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddManual}
                    disabled={!manualEn.trim()}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-lg cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มคำ</span>
                  </button>
                </div>
              )}

              {addTab === 'batch' && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2">
                  <textarea
                    rows={3}
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    placeholder="พิมพ์หลายคำคั่นด้วยเครื่องหมายจุลภาค (,) หรือขึ้นบรรทัดใหม่ เช่น&#10;Right Atrium&#10;Left Ventricle&#10;Arch of Aorta"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddBatch}
                      disabled={!batchText.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-lg cursor-pointer"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>เพิ่มทั้งหมด</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Terms & Laser Points List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    คลิกเลือกรายการแล้วจิ้มบนภาพด้านซ้ายเพื่อปักจุดเลเซอร์
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {terms.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      ยังไม่มีจุดเลเซอร์หรือคำศัพท์ คลิกบนภาพด้านซ้ายเพื่อเพิ่มจุดได้เลย
                    </div>
                  ) : (
                    terms.map((t, idx) => {
                      const hasPin = t.targetX !== undefined && t.targetY !== undefined;
                      const isActive = t.id === activePinTermId;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setActivePinTermId(t.id)}
                          className={`px-3 py-2 flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors ${
                            isActive ? 'bg-sky-50/90' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-mono tabular-nums text-[10px] font-bold shrink-0 ${
                                hasPin
                                  ? 'bg-rose-600 text-white'
                                  : isActive
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-900 truncate">
                              {t.termEn}
                            </span>
                            {hasPin ? (
                              <span className="text-[11px] font-mono tabular-nums text-rose-700 shrink-0">
                                ชี้จุดแล้ว
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 shrink-0">
                                {isActive ? 'รอคลิกบนภาพ...' : 'ยังไม่ชี้จุด'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {hasPin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearPin(t.id);
                                }}
                                className="p-1 text-slate-400 hover:text-amber-600 rounded cursor-pointer"
                                title="ลบจุดชี้เพื่อปักใหม่"
                              >
                                <MapPinOff className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTerm(t.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              aria-label="ลบคำศัพท์"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs cursor-pointer"
              >
                บันทึกชุดภาพ ({pinnedCount > 0 ? `สุ่มจาก ${pinnedCount} จุด` : `${terms.length} คำ`})
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
