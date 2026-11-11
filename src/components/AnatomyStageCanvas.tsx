import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Eye, EyeOff, ImageOff } from 'lucide-react';
import { AnatomySystem, AnatomyTerm, ExamMode } from '../types/anatomy';
import { BrainSvgPlate } from './BrainSvgPlate';

interface AnatomyStageCanvasProps {
  system: AnatomySystem;
  term: AnatomyTerm;
  examMode: ExamMode;
  showPinInTermMode?: boolean;
  onTogglePinInTermMode?: () => void;
  showTargetPin?: boolean;
  showThaiInPrompt?: boolean;
}

export const AnatomyStageCanvas: React.FC<AnatomyStageCanvasProps> = ({
  system,
  term,
  examMode,
  showPinInTermMode = false,
  onTogglePinInTermMode,
  showTargetPin = true,
  showThaiInPrompt = true,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [laserMode, setLaserMode] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [imgError, setImgError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasPin = term.pinX !== undefined && term.pinY !== undefined;
  const shouldShowPin =
    hasPin && showTargetPin && (examMode === 'spotter' || showPinInTermMode);

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
        setLaserPos({ x, y });
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
    if (laserMode) setLaserPos(null);
  };

  const imageSrc = term.customImageUrl || (system.plateImage !== 'svg-brain' ? system.plateImage : null);

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Top Plate Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">
            {term.customPlateTitle || system.nameTh}
          </span>
          <span aria-hidden="true">·</span>
          <span>{system.nameEn}</span>
          {term.isCustom && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-sky-700 font-medium">ภาพที่อาจารย์กำหนดเอง</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {examMode === 'term' && hasPin && onTogglePinInTermMode && (
            <button
              type="button"
              onClick={onTogglePinInTermMode}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showPinInTermMode
                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {showPinInTermMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPinInTermMode ? 'ซ่อนหมุดเฉลย' : 'ชี้จุดเฉลย'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setLaserMode((prev) => !prev);
              setLaserPos(null);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              laserMode
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="ใช้เลเซอร์ชี้จุดบนภาพเพื่อถามเพิ่มเติม"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{laserMode ? 'เลเซอร์เปิดอยู่' : 'เลเซอร์อาจารย์'}</span>
          </button>

          <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden">
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

      {/* Term Prompt Banner when in Term Mode or when term has no pin */}
      {(examMode === 'term' || !hasPin) && (
        <div className="px-5 py-3.5 bg-sky-50/90 border-b border-sky-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-sky-800">
              คำถามจากระบบ · ให้นักศึกษาชี้ตำแหน่งบนภาพและอธิบายคำศัพท์นี้
            </p>
            <p className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {term.termEn}
              {showThaiInPrompt && term.termTh && (
                <span className="font-medium text-slate-600 text-base ml-2">
                  — {term.termTh}
                </span>
              )}
            </p>
          </div>
          <span className="text-xs text-slate-600">{term.regionTh}</span>
        </div>
      )}

      {/* 4:3 Interactive Anatomical Stage */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`relative w-full aspect-[4/3] bg-[#F5F2EA] overflow-hidden select-none ${
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
          {!term.customImageUrl && system.plateImage === 'svg-brain' ? (
            <BrainSvgPlate activePartId={shouldShowPin ? term.svgPartId : undefined} />
          ) : imageSrc && !imgError ? (
            <img
              src={imageSrc}
              alt={`${system.nameEn} anatomical plate`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              draggable={false}
              className={`w-full h-full ${term.customImageUrl ? 'object-contain' : 'object-cover'}`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-6 text-center">
              <ImageOff className="w-10 h-10 mb-2 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">{system.nameTh}</p>
              <p className="text-xs text-slate-500 mt-1">{term.regionTh}</p>
            </div>
          )}

          {/* Target Pin Overlay */}
          {shouldShowPin && (
            <div
              className="absolute pointer-events-none z-10"
              style={{ left: `${term.pinX}%`, top: `${term.pinY}%` }}
            >
              {/* Expanding target ring */}
              <div
                className="w-11 h-11 rounded-full border-2 border-rose-600/80 bg-rose-500/10 animate-target-ripple"
                style={{ position: 'absolute', left: 0, top: 0 }}
              />
              {/* Crisp center bullseye */}
              <div
                className="w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-md"
                style={{ transform: 'translate(-50%, -50%)' }}
              />
              {/* Stem + Callout marker */}
              <div
                className="absolute left-3 -top-7 flex items-center gap-1 bg-slate-900/90 text-white px-2 py-0.5 rounded text-[11px] font-mono font-semibold shadow-sm whitespace-nowrap"
              >
                <span>?</span>
              </div>
            </div>
          )}
        </div>

        {/* Instructor Live Laser Dot */}
        {laserMode && laserPos && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: `${laserPos.x}%`,
              top: `${laserPos.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-6 h-6 rounded-full bg-rose-500/25 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white shadow-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Plate Caption */}
      <div className="px-4 py-2.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {examMode === 'spotter'
            ? 'ให้นักศึกษาดูจุดหมุดสีแดงบนภาพ แล้วตอบชื่อโครงสร้างและหน้าที่ภายใน 30 วินาที'
            : 'ให้นักศึกษาอธิบายตำแหน่ง ลักษณะสำคัญ และหน้าที่ของคำศัพท์ด้านบนภายใน 30 วินาที'}
        </span>
        <span className="font-mono tabular-nums text-slate-400">
          {term.regionTh}
        </span>
      </div>
    </div>
  );
};
