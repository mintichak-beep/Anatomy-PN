import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Shuffle } from 'lucide-react';
import { AnatomySystem, AnatomyTerm } from '../types/anatomy';
import { AnatomicalSystemIcon } from './AnatomicalSystemIcon';
import { getSystemTheme } from '../data/systemThemes';
import { pickSmartRandomLaserSpot } from '../utils/laserRandomizer';

interface AnatomyStageCanvasProps {
  system: AnatomySystem;
  term: AnatomyTerm;
  questionIndex?: number;
  totalQuestions?: number;
  onTargetChange?: (x: number, y: number) => void;
}

export const AnatomyStageCanvas: React.FC<AnatomyStageCanvasProps> = ({
  system,
  term,
  questionIndex,
  totalQuestions,
  onTargetChange,
}) => {
  const [activeTarget, setActiveTarget] = useState<{ x: number; y: number } | null>(() =>
    term.targetX !== undefined && term.targetY !== undefined
      ? { x: term.targetX, y: term.targetY }
      : null
  );
  const hasAutoTarget = activeTarget !== null;
  const theme = getSystemTheme(system.id);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [laserMode, setLaserMode] = useState<boolean>(!hasAutoTarget);
  const [manualLaserPos, setManualLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [imgError, setImgError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!term.isAutoLaser || !term.customImageUrl) return;
    let cancelled = false;
    void pickSmartRandomLaserSpot(term.customImageUrl).then((spot) => {
      if (cancelled) return;
      setActiveTarget(spot);
      setLaserMode(false);
      onTargetChange?.(spot.x, spot.y);
    });
    return () => {
      cancelled = true;
    };
    // Only refine once per mounted question
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRerollLaser = async () => {
    if (!term.customImageUrl) return;
    const spot = await pickSmartRandomLaserSpot(
      term.customImageUrl,
      activeTarget || undefined
    );
    setActiveTarget(spot);
    setLaserMode(false);
    setManualLaserPos(null);
    onTargetChange?.(spot.x, spot.y);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.4, Number((z + 0.4).toFixed(1))));
  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(1, Number((z - 0.4).toFixed(1)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (laserMode || zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (laserMode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        setManualLaserPos({ x, y });
      }
      return;
    }
    if (isDragging && zoom > 1) {
      setPan({
        x: Math.max(-220, Math.min(220, e.clientX - dragStart.x)),
        y: Math.max(-180, Math.min(180, e.clientY - dragStart.y)),
      });
    }
  };

  const handlePointerUp = () => setIsDragging(false);

  const handlePointerLeave = () => {
    setIsDragging(false);
    if (laserMode) setManualLaserPos(null);
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      {/* Top Plate Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
          <AnatomicalSystemIcon systemId={system.id} className={`w-4 h-4 ${theme.iconText} shrink-0`} />
          <span className="font-semibold text-slate-900 truncate">
            {term.customPlateTitle || system.nameTh}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="truncate">{system.nameTh}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {term.customImageUrl && !imgError && (
            <button
              type="button"
              onClick={() => void handleRerollLaser()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="ให้ระบบสุ่มย้ายจุดเลเซอร์บนภาพใหม่"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>สุ่มจุดเลเซอร์ใหม่</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setLaserMode((prev) => !prev);
              setManualLaserPos(null);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              laserMode
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="ใช้เลเซอร์อาจารย์ชี้เพิ่มเติมบนภาพ"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{laserMode ? 'เลเซอร์อาจารย์เปิดอยู่' : 'เลเซอร์อาจารย์'}</span>
          </button>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="ซูมออก"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono tabular-nums text-slate-700 border-x border-slate-200">
              {zoom.toFixed(1)}x
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 2.4}
              className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="ซูมเข้า"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom > 1 && (
              <button
                type="button"
                onClick={handleResetView}
                className="p-1.5 text-slate-600 hover:bg-slate-100 border-l border-slate-200 cursor-pointer"
                aria-label="รีเซ็ตมุมมอง"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Test Stage Header: Zero Answer Keys Shown */}
      <div className={`px-5 py-4 ${theme.softBg} border-b ${theme.softBorder} flex items-center justify-between gap-4`}>
        <div className="min-w-0">
          <div className={`flex items-center gap-2 text-xs font-semibold ${theme.accentText}`}>
            {questionIndex && totalQuestions ? (
              <>
                <span className="font-mono tabular-nums">
                  ระบบที่ {questionIndex} / {totalQuestions}
                </span>
                <span aria-hidden="true" className="opacity-40">·</span>
              </>
            ) : null}
            <span>{system.nameEn}</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            {system.nameTh}
          </p>
          <p className="text-xs md:text-sm text-slate-600 mt-0.5">
            {hasAutoTarget
              ? 'ให้นักศึกษาตอบชื่อโครงสร้าง ณ ตำแหน่งที่จุดเลเซอร์ชี้บนภาพ (ไม่แสดงคำเฉลย)'
              : 'อาจารย์ชี้ตำแหน่งบนภาพด้วยเลเซอร์เพื่อให้นักศึกษาตอบ (ไม่แสดงคำเฉลย)'}
          </p>
        </div>

        <div className={`hidden sm:flex w-12 h-12 rounded-2xl ${theme.iconBgFilled} text-white shadow-xs items-center justify-center shrink-0`}>
          <AnatomicalSystemIcon systemId={system.id} className="w-6 h-6" />
        </div>
      </div>

      {/* 4:3 Clinical Specimen Lightbox Stage */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`relative w-full aspect-[4/3] bg-specimen-stage overflow-hidden select-none ${
          laserMode ? 'cursor-crosshair' : zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
      >
        <div
          className="relative w-full h-full transition-transform duration-150 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {term.customImageUrl && !imgError ? (
            <img
              src={term.customImageUrl}
              alt={term.customPlateTitle || system.nameEn}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              draggable={false}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-8 text-center">
              <div className={`w-14 h-14 rounded-2xl ${theme.iconBgFilled} text-white flex items-center justify-center mb-3 shadow-md`}>
                <AnatomicalSystemIcon systemId={system.id} className="w-7 h-7" />
              </div>
              <p className="text-base md:text-lg font-bold text-white">{system.nameTh}</p>
              <p className="text-xs font-mono text-sky-300 mt-0.5">{system.nameEn}</p>
              <p className="text-xs md:text-sm text-slate-300 mt-3 max-w-md leading-relaxed">
                สถานีสอบปากเปล่า · อาจารย์ชี้โครงสร้างบนหุ่นจำลองจริงในห้องปฏิบัติการ (ไม่แสดงคำเฉลย)
              </p>
            </div>
          )}

          {/* System Auto-Pointed Laser Dot (Locked onto exact structure inside zoom/pan wrapper) */}
          {activeTarget && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: `${activeTarget.x}%`,
                top: `${activeTarget.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-8 h-8 rounded-full border border-rose-400/80 bg-rose-500/20 animate-target-ripple absolute left-1/2 top-1/2" />
              <div className="w-5 h-5 rounded-full bg-rose-500/35 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white shadow-[0_0_12px_rgba(244,63,94,0.9)]" />
              </div>
            </div>
          )}
        </div>

        {/* Instructor Live Cursor Laser Dot */}
        {laserMode && manualLaserPos && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              left: `${manualLaserPos.x}%`,
              top: `${manualLaserPos.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-7 h-7 rounded-full bg-rose-500/30 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white shadow-sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
