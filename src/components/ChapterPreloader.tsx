import React from 'react';
import { Loader2, Zap, Eye, CheckCircle2, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';

interface ChapterPreloaderProps {
  current: number;
  total: number;
  chapterTitle?: string;
  message?: string;
  onSkip?: () => void;
  isCompact?: boolean;
}

export default function ChapterPreloader({
  current,
  total,
  chapterTitle,
  message = 'جاري التحميل المسبق لصفحات الفصل...',
  onSkip,
  isCompact = false,
}: ChapterPreloaderProps) {
  const percentage = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;
  const isComplete = total > 0 && current >= total;

  if (isCompact) {
    return (
      <div className="w-full max-w-xl mx-auto my-3 p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 text-xs mb-2">
          <div className="flex items-center gap-2 text-zinc-200 font-bold">
            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
            <span>{message}</span>
          </div>
          <span className="font-mono font-black text-amber-400">{percentage}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(percentage, 4)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto my-4 p-5 sm:p-6 bg-zinc-950/90 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden font-sans select-none">
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-red-950 text-white shadow-lg ring-1 ring-red-500/30">
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider text-red-400 uppercase bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-800/40">
                  تحميل مسبق ذكي ⚡
                </span>
                {chapterTitle && (
                  <span className="text-xs font-semibold text-zinc-400">
                    {chapterTitle}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                {message}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-mono text-zinc-300">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {total > 0 ? `${current} / ${total} صفحة` : 'جاري التجهيز...'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>اكتمال التخزين الموقت</span>
            </span>
            <span className="text-sm font-black font-mono text-amber-400">
              {percentage}%
            </span>
          </div>

          <div className="relative w-full h-3 bg-zinc-900 border border-zinc-800 rounded-full p-0.5 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-300 relative"
              style={{ width: `${Math.max(percentage, 3)}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[size:14px_14px] animate-[pulse_1s_infinite]" />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>تجهيز الصور بجودة عالية لتصفح أسرع وبدون تقطيع</span>
          </div>

          {onSkip && !isComplete && (
            <button
              onClick={onSkip}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:text-white"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              تصفح الصفحات الجاهزة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
