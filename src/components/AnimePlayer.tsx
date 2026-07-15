import React, { useState, useEffect } from 'react';
import { Maximize2, RefreshCw, AlertCircle, Play, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';

interface AnimePlayerProps {
  url: string;
}

export default function AnimePlayer({ url }: AnimePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Extract server name if passed via hash
  const [cleanUrl, serverName] = url.split('#');
  const decodedServerName = decodeURIComponent(serverName || 'سيرفر المشاهدة');

  const isDirectVideo = cleanUrl.includes('.mp4') || cleanUrl.includes('.mkv') || cleanUrl.startsWith('blob:') || cleanUrl.includes('m3u8');
  const isOffline = cleanUrl.startsWith('blob:');

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    // Prevent top-level redirect ads from hijacking the page
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'هل أنت متأكد من مغادرة هذه الصفحة الرائعة لمشاهدة الأنمي؟';
      return 'هل أنت متأكد من مغادرة هذه الصفحة الرائعة لمشاهدة الأنمي؟';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [url]);

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    if (!isDirectVideo) {
      const iframe = document.getElementById('anime-iframe') as HTMLIFrameElement;
      if (iframe) iframe.src = cleanUrl;
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = cleanUrl;
    a.download = `anime-episode-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative group">
      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950 gap-4">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
             <Play className="absolute inset-0 m-auto w-6 h-6 text-red-500 fill-red-500 animate-pulse" />
          </div>
          <p className="text-zinc-400 text-xs font-bold font-mono animate-pulse uppercase tracking-widest">
            {isOffline ? 'جاري تشغيل الفصل المحمل...' : 'جاري تحضير السيرفر...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4 opacity-50" />
          <h3 className="text-zinc-100 font-bold mb-2">فشل تحميل السيرفر</h3>
          <p className="text-zinc-500 text-sm max-w-xs mb-6">
            قد يكون هذا السيرفر غير متاح حالياً أو يتطلب متصفحاً مختلفاً. حاول الانتقال لسيرفر آخر.
          </p>
          <button 
            onClick={handleRefresh}
            className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-zinc-800"
          >
            <RefreshCw className="w-4 h-4 text-red-500" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Player Header/Info */}
      <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 ${isOffline ? 'bg-green-500' : 'bg-red-500'} rounded-full animate-pulse`}></div>
          <span className="text-white text-xs font-bold truncate max-w-[200px]">
            {isOffline ? 'عرض من الجهاز (بدون نت)' : decodedServerName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!isDirectVideo && (
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-100 rounded-lg border border-zinc-700 text-[10px] font-bold transition-all"
              title="فتح في نافذة خارجية (إذا لم يشتغل)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>نافذة خارجية</span>
            </a>
          )}
          {isDirectVideo && (
            <button 
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-100 rounded-lg border border-zinc-700 text-[10px] font-bold transition-all"
            >
              {downloadSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Download className="w-3.5 h-3.5 text-red-500" />}
              <span>{downloadSuccess ? 'تم الحفظ' : 'حفظ الفيديو'}</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20 text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3" />
            <span>اتصال آمن</span>
          </div>
        </div>
      </div>

      {/* Player Content: Video or Iframe */}
      {isDirectVideo ? (
        <video
          src={cleanUrl}
          className="w-full h-full"
          controls
          autoPlay
          onLoadedData={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      ) : (
        <iframe
          id="anime-iframe"
          src={cleanUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      )}

      {/* Quality Badge Overlay */}
      {!isDirectVideo && (
        <div className="absolute bottom-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white border border-white/10 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            HD 1080p
          </div>
        </div>
      )}
    </div>
  );
}
