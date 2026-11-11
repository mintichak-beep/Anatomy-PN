import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface FeedbackBannerProps {
  variant: 'success' | 'error';
  message: string;
  onDismiss?: () => void;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
  variant,
  message,
  onDismiss,
}) => {
  const isError = variant === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-3 text-xs sm:text-sm ${
        isError
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {isError ? (
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        )}
        <p className="leading-relaxed">{message}</p>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-0.5 opacity-70 hover:opacity-100 cursor-pointer shrink-0"
          aria-label="ปิดข้อความแจ้งเตือน"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
