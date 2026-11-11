import React, { useState } from 'react';
import { Upload, X, Plus, Trash2, MapPin, Check, ListPlus } from 'lucide-react';
import {
  AnatomySystem,
  AnatomyTerm,
  CustomPlate,
  CustomPlateTerm,
  SystemId,
} from '../types/anatomy';

interface CustomPlateBuilderModalProps {
  systems: AnatomySystem[];
  builtInTerms: AnatomyTerm[];
  initialPlate?: CustomPlate | null;
  onSave: (plate: CustomPlate) => void;
  onClose: () => void;
}

export const CustomPlateBuilderModal: React.FC<CustomPlateBuilderModalProps> = ({
  systems,
  builtInTerms,
  initialPlate,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(initialPlate?.title || '');
  const [systemId, setSystemId] = useState<SystemId>(initialPlate?.systemId || 'skeletal');
  const [imageUrl, setImageUrl] = useState(initialPlate?.imageUrl || '');
  const [terms, setTerms] = useState<CustomPlateTerm[]>(initialPlate?.terms || []);
  const [pinTargetTermId, setPinTargetTermId] = useState<string | null>(null);

  // Add term helper state
  const [addTab, setAddTab] = useState<'bank' | 'manual' | 'batch'>('bank');
  const [manualEn, setManualEn] = useState('');
  const [manualTh, setManualTh] = useState('');
  const [manualHint, setManualHint] = useState('');
  const [batchText, setBatchText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const systemBankTerms = builtInTerms.filter((t) => t.systemId === systemId);

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

  const isBankTermAdded = (bankTerm: AnatomyTerm) =>
    terms.some((t) => t.termEn.toLowerCase() === bankTerm.termEn.toLowerCase());

  const toggleBankTerm = (bankTerm: AnatomyTerm) => {
    if (isBankTermAdded(bankTerm)) {
      setTerms((prev) =>
        prev.filter((t) => t.termEn.toLowerCase() !== bankTerm.termEn.toLowerCase())
      );
    } else {
      const next: CustomPlateTerm = {
        id: `cpt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        systemId: bankTerm.systemId,
        termEn: bankTerm.termEn,
        termTh: bankTerm.termTh,
        clinicalHintTh: bankTerm.clinicalHintTh,
        rubric2Pt: bankTerm.rubric2Pt,
        rubric1Pt: bankTerm.rubric1Pt,
      };
      setTerms((prev) => [...prev, next]);
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
          clinicalHintTh: bt.clinicalHintTh,
          rubric2Pt: bt.rubric2Pt,
          rubric1Pt: bt.rubric1Pt,
        });
      }
    }
    setTerms((prev) => [...prev, ...additions]);
  };

  const handleAddManual = () => {
    if (!manualEn.trim()) return;
    const next: CustomPlateTerm = {
      id: `cpt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      systemId,
      termEn: manualEn.trim(),
      termTh: manualTh.trim() || 'คำศัพท์ที่อาจารย์กำหนด',
      clinicalHintTh: manualHint.trim() || 'ระบุตำแหน่งและหน้าที่สำคัญของโครงสร้างนี้บนภาพ',
      rubric2Pt: 'ระบุตำแหน่ง/ชื่อและอธิบายหน้าที่ถูกต้องครบถ้วนภายใน 30 วินาที',
      rubric1Pt: 'ระบุได้บางส่วนหรืออธิบายหน้าที่ไม่สมบูรณ์',
    };
    setTerms((prev) => [...prev, next]);
    setManualEn('');
    setManualTh('');
    setManualHint('');
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
        termTh: thPart || 'คำศัพท์ที่อาจารย์กำหนด',
        clinicalHintTh: 'ระบุตำแหน่งและอธิบายหน้าที่ของโครงสร้างนี้บนภาพ',
        rubric2Pt: 'ระบุตำแหน่ง/ชื่อและอธิบายหน้าที่ถูกต้องครบถ้วนภายใน 30 วินาที',
        rubric1Pt: 'ระบุได้บางส่วนหรืออธิบายหน้าที่ไม่สมบูรณ์',
      };
    });

    setTerms((prev) => [...prev, ...additions]);
    setBatchText('');
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinTargetTermId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));
    setTerms((prev) =>
      prev.map((t) => (t.id === pinTargetTermId ? { ...t, pinX: x, pinY: y } : t))
    );
    setPinTargetTermId(null);
  };

  const handleClearPin = (id: string) => {
    setTerms((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinX: undefined, pinY: undefined } : t))
    );
  };

  const handleRemoveTerm = (id: string) => {
    setTerms((prev) => prev.filter((t) => t.id !== id));
    if (pinTargetTermId === id) setPinTargetTermId(null);
  };

  const handleSavePlate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setErrorMsg('กรุณาอัปโหลดรูปภาพก่อนบันทึก');
      return;
    }
    if (terms.length === 0) {
      setErrorMsg('กรุณาเลือกหรือเพิ่มคำศัพท์อย่างน้อย 1 คำเพื่อให้ระบบใช้ถามในภาพนี้');
      return;
    }

    const plate: CustomPlate = {
      id: initialPlate?.id || `plate-${Date.now()}`,
      title:
        title.trim() ||
        `ชุดภาพ${systems.find((s) => s.id === systemId)?.nameTh || 'กายวิภาค'}`,
      systemId,
      imageUrl,
      terms,
      createdAt: initialPlate?.createdAt || new Date().toISOString(),
    };
    onSave(plate);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full p-6 my-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialPlate ? 'แก้ไขชุดภาพและคำศัพท์' : 'กำหนดภาพเอง เพื่อให้ระบบสุ่มถามคำศัพท์'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              อัปโหลดภาพของคุณ แล้วเลือกหรือพิมพ์คำศัพท์ที่ต้องการให้ระบบสุ่มถามนักศึกษาบนภาพนี้
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
          {/* Left Side: Image Upload & Optional Pin Placement */}
          <div className="lg:col-span-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อชุดภาพ
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น หุ่นจำลองหัวใจ Lab 2"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ระบบอวัยวะ
                </label>
                <select
                  value={systemId}
                  onChange={(e) => setSystemId(e.target.value as SystemId)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                >
                  {systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameTh}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Image Preview Box */}
            <div
              onClick={handleImageClick}
              className={`relative w-full aspect-[4/3] bg-slate-100 border rounded-xl overflow-hidden flex items-center justify-center ${
                pinTargetTermId
                  ? 'border-sky-600 ring-2 ring-sky-500 cursor-crosshair'
                  : 'border-slate-200'
              }`}
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Custom anatomy plate"
                    className="w-full h-full object-contain bg-[#F5F2EA]"
                  />
                  {/* Render pins for terms that have coordinates */}
                  {terms.map((t, idx) =>
                    t.pinX !== undefined && t.pinY !== undefined ? (
                      <div
                        key={t.id}
                        className="absolute pointer-events-none flex items-center gap-1"
                        style={{
                          left: `${t.pinX}%`,
                          top: `${t.pinY}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold flex items-center justify-center border border-white shadow">
                          {idx + 1}
                        </span>
                      </div>
                    ) : null
                  )}
                </>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 text-center cursor-pointer w-full h-full hover:bg-slate-200/50 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-700">
                    คลิกเพื่ออัปโหลดภาพกายวิภาคของคุณ
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    รองรับไฟล์ JPG, PNG, WebP (ภาพหุ่นจำลอง ภาพอาจารย์ใหญ่ หรือแผนภาพไร้ตัวอักษร)
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

            {pinTargetTermId && (
              <div className="px-3 py-2 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
                <span>
                  กำลังปักหมุดเฉลยให้:{' '}
                  <strong>{terms.find((t) => t.id === pinTargetTermId)?.termEn}</strong> — คลิกบนภาพได้เลย
                </span>
                <button
                  type="button"
                  onClick={() => setPinTargetTermId(null)}
                  className="text-sky-700 font-semibold hover:underline cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            )}

            {imageUrl && (
              <label className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>เปลี่ยนรูปภาพใหม่</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Right Side: Term Picker & Attached Term List */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Segmented Tabs to add terms */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  คำศัพท์ที่ต้องการให้ระบบถามบนภาพนี้
                </span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAddTab('bank')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                      addTab === 'bank' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    เลือกจากคลังระบบ
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddTab('manual')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer ${
                      addTab === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    พิมพ์ทีละคำ
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

              {/* Tab 1: Select from System Bank */}
              {addTab === 'bank' && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      คำศัพท์ในระบบ{' '}
                      <strong>{systems.find((s) => s.id === systemId)?.nameTh}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={selectAllSystemBankTerms}
                      className="text-sky-700 font-semibold hover:underline cursor-pointer"
                    >
                      + เลือกทั้งหมดในระบบนี้
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
                          {active && <Check className="w-3.5 h-3.5 text-sky-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Manual Single Term */}
              {addTab === 'manual' && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={manualEn}
                      onChange={(e) => setManualEn(e.target.value)}
                      placeholder="คำศัพท์ EN / Latin (เช่น Femur)"
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                    <input
                      type="text"
                      value={manualTh}
                      onChange={(e) => setManualTh(e.target.value)}
                      placeholder="ชื่อไทย (ไม่บังคับ)"
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualHint}
                      onChange={(e) => setManualHint(e.target.value)}
                      placeholder="คำใบ้/เฉลยสั้นสำหรับอาจารย์ (ไม่บังคับ)"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddManual}
                      disabled={!manualEn.trim()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มคำ</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Batch Paste */}
              {addTab === 'batch' && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2">
                  <textarea
                    rows={3}
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    placeholder="พิมพ์หลายคำคั่นด้วยเครื่องหมายจุลภาค (,) หรือขึ้นบรรทัดใหม่ เช่น&#10;Right Atrium | หัวใจห้องบนขวา&#10;Left Ventricle | หัวใจห้องล่างซ้าย&#10;Arch of Aorta"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddBatch}
                      disabled={!batchText.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg cursor-pointer"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>เพิ่มทั้งหมดเข้าภาพนี้</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Attached Terms List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    คำศัพท์ที่จะใช้สุ่มถามบนภาพนี้ ({terms.length} คำ)
                  </span>
                  {terms.length > 0 && (
                    <span className="text-[11px] text-slate-500">
                      ปักหมุดเฉลยบนภาพหรือไม่ปักก็ได้
                    </span>
                  )}
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {terms.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      ยังไม่มีคำศัพท์ในภาพนี้ เลือกจากด้านบนได้เลย
                    </div>
                  ) : (
                    terms.map((t, idx) => {
                      const hasPin = t.pinX !== undefined && t.pinY !== undefined;
                      const isPinning = pinTargetTermId === t.id;
                      return (
                        <div
                          key={t.id}
                          className="px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-slate-50"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="font-mono tabular-nums text-slate-400 w-5 shrink-0">
                              {idx + 1}.
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{t.termEn}</p>
                              <p className="text-[11px] text-slate-500 truncate">{t.termTh}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {imageUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  hasPin
                                    ? handleClearPin(t.id)
                                    : setPinTargetTermId(isPinning ? null : t.id)
                                }
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                                  isPinning
                                    ? 'bg-sky-600 text-white border-sky-600'
                                    : hasPin
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                                title={hasPin ? 'คลิกเพื่อลบหมุด' : 'คลิกแล้วจิ้มบนภาพเพื่อปักหมุดเฉลย'}
                              >
                                <MapPin className="w-3 h-3" />
                                <span>
                                  {isPinning ? 'จิ้มบนภาพ...' : hasPin ? 'มีหมุดแล้ว' : 'ปักหมุด'}
                                </span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveTerm(t.id)}
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
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg cursor-pointer"
              >
                บันทึกชุดภาพ ({terms.length} คำ)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
