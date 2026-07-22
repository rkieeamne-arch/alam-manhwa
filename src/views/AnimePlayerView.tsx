import React, { useState, useEffect, useRef } from 'react';
import { fetchWatchServers, Anime, Episode } from '../utils/animeScraper';
import { Loader2, ShieldCheck, Play, ChevronLeft, ChevronRight, RotateCcw, RotateCw, ArrowRight, Clock } from 'lucide-react';

interface AnimePlayerViewProps {
  anime: Anime;
  episodeNumber: number;
  onNavigateEpisode: (episodeId: string, episodeNumber: number) => void;
  onBack: () => void;
  onAddAnimeHistory?: (item: {
    animeId: string;
    animeTitle: string;
    animeCover: string;
    episodeId: string;
    episodeTitle: string;
    episodeNumber: number;
    stoppedAtSeconds: number;
  }) => void;
  initialStoppedSeconds?: number;
}

export default function AnimePlayerView({ 
  anime, 
  episodeNumber, 
  onNavigateEpisode, 
  onBack,
  onAddAnimeHistory,
  initialStoppedSeconds
}: AnimePlayerViewProps) {
  const [servers, setServers] = useState<{ name: string; url: string }[]>([]);
  const [activeServer, setActiveServer] = useState<{ name: string; url: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRotated, setIsRotated] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [stoppedSeconds, setStoppedSeconds] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize and register history on mount/episode change
  useEffect(() => {
    setStoppedSeconds(initialStoppedSeconds || 0);
    
    if (anime && episodeNumber) {
      const episode = anime.episodes?.find(e => e.episodeNumber === episodeNumber);
      if (onAddAnimeHistory) {
        onAddAnimeHistory({
          animeId: anime.id,
          animeTitle: anime.title,
          animeCover: anime.coverUrl,
          episodeId: episode?.id || `ep-${episodeNumber}`,
          episodeTitle: episode?.title || `الحلقة ${episodeNumber}`,
          episodeNumber: episodeNumber,
          stoppedAtSeconds: initialStoppedSeconds || 0
        });
      }
    }
  }, [anime, episodeNumber, initialStoppedSeconds]);

  const triggerSaveHistory = (secs: number) => {
    if (onAddAnimeHistory && anime && episodeNumber) {
      const episode = anime.episodes?.find(e => e.episodeNumber === episodeNumber);
      onAddAnimeHistory({
        animeId: anime.id,
        animeTitle: anime.title,
        animeCover: anime.coverUrl,
        episodeId: episode?.id || `ep-${episodeNumber}`,
        episodeTitle: episode?.title || `الحلقة ${episodeNumber}`,
        episodeNumber: episodeNumber,
        stoppedAtSeconds: secs
      });
    }
  };

  const handleStoppedSecondsChange = (value: number) => {
    setStoppedSeconds(value);
    triggerSaveHistory(value);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!anime || !anime.episodes) {
      setLoading(false);
      return;
    }
    const episode = anime.episodes.find(e => e.episodeNumber === episodeNumber);
    const episodeUrl = episode?.url || '';
    if (!episodeUrl) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetchWatchServers(episodeUrl)
      .then(s => {
        setServers(s);
        setActiveServer(s[0] || null);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [anime, episodeNumber]);

  const seekVideo = (seconds: number) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { method: 'seek', seconds: seconds },
        '*'
      );
    }
    // Show a beautiful helpful hint informing user to seek using player controls directly due to cross-origin sandbox
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3500);
  };

  const handleNavigateEpisode = (direction: 'prev' | 'next') => {
    if (!anime || !anime.episodes || anime.episodes.length === 0) return;

    const currentIdx = anime.episodes.findIndex(
      ep => ep.episodeNumber === episodeNumber
    );

    if (currentIdx === -1) return;

    let targetIdx = direction === 'prev' ? currentIdx - 1 : currentIdx + 1;

    if (targetIdx >= 0 && targetIdx < anime.episodes.length) {
      const targetEp = anime.episodes[targetIdx];
      onNavigateEpisode(targetEp.id, targetEp.episodeNumber);
    }
  };

  if (!anime) return <div className="text-white text-center p-10">البيانات غير متاحة</div>;
  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 text-amber-500" /></div>;

  return (
    <div className="flex flex-col h-screen bg-black">
      <div className="flex-grow relative overflow-hidden bg-black">
        {activeServer ? (
          <div 
            className="w-full h-full transition-all duration-300"
            style={isRotated ? {
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '100vh',
              height: '100vw',
              transform: 'translate(-50%, -50%) rotate(90deg)',
              zIndex: 9999,
              backgroundColor: 'black'
            } : {}}
          >
            <iframe
              ref={iframeRef}
              src={activeServer.url || undefined}
              title={`${anime.title} Episode ${episodeNumber}`}
              className="w-full h-full object-contain"
              allowFullScreen
              referrerPolicy="no-referrer"
              scrolling="no"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
            />
            
            {/* Rotate Exit Overlay Button (specifically inside rotated frame) */}
            {isRotated && (
              <button 
                onClick={() => setIsRotated(false)}
                className="absolute top-4 right-4 z-[10000] flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-full text-xs shadow-2xl cursor-pointer"
              >
                <span>إلغاء تدوير الشاشة 🔄</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center h-full text-white">لا توجد سيرفرات متاحة</div>
        )}

        {/* Responsive, beautiful non-overlapping top header bar overlay */}
        {!isRotated && (
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between gap-3 bg-gradient-to-b from-black/90 to-transparent z-40" dir="rtl">
            {/* Ad blocker Shield Badge */}
            <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs shadow-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span className="font-bold text-zinc-300">منع الإعلانات نشط</span>
            </div>

            {/* Controller Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsRotated(!isRotated)}
                className="flex items-center gap-1.5 bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-800/80 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[11px] sm:text-xs font-black transition-all active:scale-95 cursor-pointer shadow-lg"
                title="تدوير الشاشة لوضع أفقي"
              >
                <span>ملء الشاشة تدوير 🔄</span>
              </button>
              
              <button 
                onClick={onBack}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[11px] sm:text-xs font-black border border-red-500/20 transition-all active:scale-95 cursor-pointer shadow-lg"
                title="الرجوع للتفاصيل"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>رجوع</span>
              </button>
            </div>
          </div>
        )}

        {/* Seek help Toast Notification hint */}
        {showHint && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black text-[11px] font-black px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
            <span>الرجاء استخدام شريط التحكم المدمج بلمس الفيديو للتقديم والتأخير 📺</span>
          </div>
        )}

        {/* Custom controller layout */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/60 backdrop-blur-md px-8 py-4 rounded-full text-white z-30">
          <button onClick={() => seekVideo(-10)} className="p-3 hover:bg-zinc-700 rounded-full transition-all cursor-pointer">
            <RotateCcw className="w-6 h-6" />
          </button>
          <button onClick={() => seekVideo(10)} className="p-3 hover:bg-zinc-700 rounded-full transition-all cursor-pointer">
            <RotateCw className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="p-4 bg-zinc-900 text-white flex items-center justify-between gap-4 z-20">
        <button onClick={() => handleNavigateEpisode('prev')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg shrink-0 cursor-pointer"><ChevronLeft /></button>
        <div className="text-sm sm:text-lg font-bold truncate text-center flex-1" dir="rtl">
          <span className="text-amber-500">الحلقة {episodeNumber}</span>
          <span className="mx-2 text-zinc-500">•</span>
          <span className="text-zinc-300">{anime.title}</span>
        </div>
        <button onClick={() => handleNavigateEpisode('next')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg shrink-0 cursor-pointer"><ChevronRight /></button>
      </div>

      {/* Interactive Watch Progress Slider & Stopped At Tracker */}
      <div className="px-5 py-3 bg-zinc-950 border-t border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-white z-20" dir="rtl">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-zinc-400">موضع التوقف الحالي:</span>
          <span className="text-sm font-black text-amber-400">{formatTime(stoppedSeconds)}</span>
        </div>
        <div className="flex items-center gap-3 flex-grow max-w-xl">
          <input 
            type="range" 
            min="0" 
            max="3600" // Up to 60 minutes
            step="10"
            value={stoppedSeconds}
            onChange={(e) => handleStoppedSecondsChange(parseInt(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
            title="مرر لتسجيل موضع توقفك"
          />
          <div className="flex gap-1 shrink-0">
            <button 
              onClick={() => handleStoppedSecondsChange(Math.max(0, stoppedSeconds - 60))}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
              title="تراجع دقيقة واحدة"
            >
              -1د
            </button>
            <button 
              onClick={() => handleStoppedSecondsChange(stoppedSeconds + 60)}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
              title="تقدم دقيقة واحدة"
            >
              +1د
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-zinc-950 flex gap-2 overflow-x-auto z-20">
        {servers.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveServer(s)}
            className={`px-4 py-2 rounded-lg text-sm shrink-0 cursor-pointer transition-all ${activeServer?.url === s.url ? 'bg-amber-500 text-black font-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
