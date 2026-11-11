import React from 'react';
import { Info } from 'lucide-react';

interface MilestoneNoticeProps {
  title: string;
  description: string;
  onDismiss?: () => void;
}

export const MilestoneNotice: React.FC<MilestoneNoticeProps> = ({
  title,
  description,
  onDismiss,
}) => {
  return (
    <div
      role="status"
      className="bg-slate-100/90 border border-slate-200 rounded-xl px-4 py-3.5 flex items-start justify-between gap-3 text-xs sm:text-sm"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="text-slate-600 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          ปิด
        </button>
      )}
    </div>
  );
};
