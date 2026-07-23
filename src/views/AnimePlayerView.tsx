import React, { useState, useEffect, useRef } from 'react';
import { fetchWatchServers, Anime, Episode } from '../utils/animeScraper';
import { 
  Loader2, 
  ShieldCheck, 
  Play, 
  Pause,
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  RotateCw, 
  ArrowRight, 
  Clock, 
  Settings, 
  Lock, 
  Unlock, 
  ListVideo, 
  Maximize, 
  Minimize, 
  Sliders, 
  X, 
  Check, 
  Sparkles, 
  PictureInPicture2,
  Tv,
  Film
} from 'lucide-react';

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
  // Player state
  const [servers, setServers] = useState<{ name: string; url: string }[]>([]);
  const [activeServer, setActiveServer] = useState<{ name: string; url: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRotated, setIsRotated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  // Controls visibility
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Time & History state
  const [stoppedSeconds, setStoppedSeconds] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeTimeSeconds, setResumeTimeSeconds] = useState(0);

  // Menus & Drawers
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Next Episode Auto Countdown
  const [showNextCountdown, setShowNextCountdown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Current and Next/Prev Episode
  const episodesList = anime?.episodes || [];
  const currentEpIndex = episodesList.findIndex(e => e.episodeNumber === episodeNumber);
  const nextEpisode = currentEpIndex !== -1 && currentEpIndex < episodesList.length - 1 ? episodesList[currentEpIndex + 1] : null;
  const prevEpisode = currentEpIndex > 0 ? episodesList[currentEpIndex - 1] : null;

  // Initialize episode and check resume timestamp
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setIsRotated(false);
      } else {
        setIsFullscreen(true);
        setIsRotated(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const initTime = initialStoppedSeconds || 0;
    setStoppedSeconds(initTime);

    if (initTime > 15) {
      // Just record the time, do not show resume prompt
    }
    
    if (anime && episodeNumber) {
      const episode = episodesList.find(e => e.episodeNumber === episodeNumber);
      if (onAddAnimeHistory) {
        onAddAnimeHistory({
          animeId: anime.id,
          animeTitle: anime.title,
          animeCover: anime.coverUrl,
          episodeId: episode?.id || `ep-${episodeNumber}`,
          episodeTitle: episode?.title || `الحلقة ${episodeNumber}`,
          episodeNumber: episodeNumber,
          stoppedAtSeconds: initTime
        });
      }
    }
  }, [anime, episodeNumber, initialStoppedSeconds]);

  // Save history helper
  const triggerSaveHistory = (secs: number) => {
    if (onAddAnimeHistory && anime && episodeNumber) {
      const episode = episodesList.find(e => e.episodeNumber === episodeNumber);
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

  // Fetch servers for current episode
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
        console.error('Watch servers fetch error:', err);
        setLoading(false);
      });
  }, [anime, episodeNumber]);

  // Auto-hide controls logic (2.5 seconds timeout)
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (!isLocked) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowServerMenu(false);
      }, 3000);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isLocked]);

  const handleMouseMove = () => {
    if (isLocked) return;
    if (!showControls) {
      setShowControls(true);
    }
    resetControlsTimeout();
  };

  const toggleControls = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isLocked) return;
    setShowControls(prev => {
      if (!prev) {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        return true;
      }
      return false;
    });
  };

  // Next Episode Countdown Logic
  const startNextCountdown = () => {
    if (!nextEpisode) return;
    setShowNextCountdown(true);
    setCountdownSeconds(5);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setShowNextCountdown(false);
          onNavigateEpisode(nextEpisode.id, nextEpisode.episodeNumber);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelNextCountdown = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setShowNextCountdown(false);
  };

  // Picture in Picture
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (containerRef.current && 'requestPictureInPicture' in containerRef.current) {
        // @ts-ignore
        await containerRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP not supported or failed:', e);
    }
  };

  // Fullscreen and Rotate toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setIsRotated(true);
      }).catch(e => console.warn(e));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setIsRotated(false);
      }).catch(e => console.warn(e));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!anime) return <div className="text-white text-center p-10 font-bold">البيانات غير متاحة</div>;
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-amber-500 gap-4" dir="rtl">
        <Loader2 className="animate-spin w-12 h-12 text-amber-500" />
        <p className="text-sm font-bold text-zinc-400">جاري تجهيز مشغل أنمي سينمائي...</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-screen bg-black select-none overflow-hidden relative font-sans"
      onMouseMove={handleMouseMove}
      dir="rtl"
    >
      {/* ================= MAIN VIDEO STAGE ================= */}
      <div className="flex-grow relative overflow-hidden bg-black group flex items-center justify-center">
        {activeServer ? (
          <div 
            className="w-full h-full transition-all duration-300 relative bg-black flex items-center justify-center"
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
            onClick={toggleControls}
          >
            <iframe
              ref={iframeRef}
              src={activeServer.url || undefined}
              title={`${anime.title} Episode ${episodeNumber}`}
              className="w-full h-full object-contain pointer-events-auto"
              allowFullScreen
              referrerPolicy="no-referrer"
              scrolling="no"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
            />

            {/* Screen Lock Overlay Badge when Locked */}
            {isLocked && (
              <div className="absolute top-6 right-6 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLocked(false);
                    setShowControls(true);
                  }}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-black px-4 py-2 rounded-full text-xs shadow-2xl transition-all active:scale-95 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>الشاشة مقفلة (انقر لإلغاء القفل) 🔓</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
            <Tv className="w-12 h-12 text-zinc-600" />
            <p className="font-bold text-sm">عذراً، لا توجد سيرفرات تشغيل متاحة لهذه الحلقة</p>
          </div>
        )}

        {/* ================= NEXT EPISODE COUNTDOWN OVERLAY ================= */}
        {showNextCountdown && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 gap-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500 flex items-center justify-center text-2xl font-black text-amber-400 animate-pulse">
              {countdownSeconds}
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-lg font-black text-amber-400">الحلقة التالية ستنطلق تلقائياً</h4>
              {nextEpisode && (
                <p className="text-sm font-bold text-zinc-300">
                  الحلقة {nextEpisode.episodeNumber}: {nextEpisode.title || anime.title}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  cancelNextCountdown();
                  if (nextEpisode) onNavigateEpisode(nextEpisode.id, nextEpisode.episodeNumber);
                }}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
              >
                تشغيل الآن ▶
              </button>
              <button
                onClick={cancelNextCountdown}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                إلغاء الانتقال
              </button>
            </div>
          </div>
        )}

        {/* ================= SLEEK CONTROLS OVERLAY (NETFLIX/CRUNCHYROLL STYLE) ================= */}
        {/* Floating Always-Visible Actions when overlay is hidden */}
        {!showControls && !isLocked && (
          <div className="absolute top-4 left-4 z-50 flex items-center gap-2 animate-fade-in">
            <button
              onClick={onBack}
              className="bg-red-600/90 hover:bg-red-600 text-white font-black text-xs px-3.5 py-2 rounded-full border border-red-500/40 backdrop-blur-md shadow-2xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="الرجوع لصفحة الأنمي"
            >
              <ArrowRight className="w-4 h-4" />
              <span>رجوع</span>
            </button>
            <button
              onClick={() => setShowControls(true)}
              className="bg-zinc-900/90 hover:bg-amber-500 text-white hover:text-black font-black text-xs px-3.5 py-2 rounded-full border border-zinc-700 backdrop-blur-md shadow-2xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-amber-500" />
              <span>التحكم ⚙️</span>
            </button>
          </div>
        )}

        {!isLocked && (
          <div 
            className={`absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/40 to-black/85 transition-opacity duration-300 pointer-events-none ${
              showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0'
            }`}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                toggleControls(e as any);
              }
            }}
          >
            {/* --- TOP BAR --- */}
            <div className="flex items-center justify-between gap-3">
              {/* Anime & Episode Title Info */}
              <div className="flex items-center gap-3 truncate">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all cursor-pointer shadow-lg shrink-0 font-black text-xs"
                  title="الرجوع لصفحة التفاصيل"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>رجوع للأنمي</span>
                </button>
                <div className="truncate">
                  <h3 className="text-sm sm:text-base font-black text-white truncate">{anime.title}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <span>الحلقة {episodeNumber}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{activeServer?.name || 'سيرفر مجاني'}</span>
                  </div>
                </div>
              </div>

              {/* Right Action Icons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowControls(false)}
                  className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="إخفاء الواجهة"
                >
                  <X className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowEpisodeDrawer(true)}
                  className="flex items-center gap-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                  title="قائمة الحلقات"
                >
                  <ListVideo className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">الحلقات</span>
                </button>

                <button
                  onClick={() => setIsLocked(true)}
                  className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer"
                  title="قفل الشاشة"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* --- CENTER CONTROLS --- */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 my-auto pointer-events-auto">
            </div>

            {/* --- BOTTOM BAR (PROGRESS & ACTION CONTROLS) --- */}
            <div className="space-y-3 pointer-events-auto">
              {/* Progress Scrubber */}
              <div className="space-y-1 bg-zinc-950/80 backdrop-blur-md p-3 rounded-2xl border border-zinc-800/80">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>موضع المشاهدة المحفوظ: <strong className="text-amber-400 font-black">{formatTime(stoppedSeconds)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 text-[10px] sm:text-xs font-bold">تسجيل وقت التوقف:</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3600"
                  step="5"
                  value={stoppedSeconds}
                  onChange={(e) => handleStoppedSecondsChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 hover:h-3 accent-amber-500 rounded-lg appearance-none cursor-pointer transition-all"
                />
              </div>

              {/* Bottom Control Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {/* Left: Previous & Next Episode */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={!prevEpisode}
                    onClick={() => prevEpisode && onNavigateEpisode(prevEpisode.id, prevEpisode.episodeNumber)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      prevEpisode 
                        ? 'bg-zinc-900/90 hover:bg-zinc-800 text-white border-zinc-800 cursor-pointer' 
                        : 'bg-zinc-950 text-zinc-600 border-zinc-900 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span className="hidden sm:inline">السابقة</span>
                  </button>

                  <button
                    disabled={!nextEpisode}
                    onClick={startNextCountdown}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all ${
                      nextEpisode 
                        ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-400 cursor-pointer shadow-md' 
                        : 'bg-zinc-950 text-zinc-600 border-zinc-900 cursor-not-allowed'
                    }`}
                  >
                    <span>التالية</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Right: Quality/Servers, Speed, PiP, Fullscreen */}
                <div className="flex items-center gap-2 relative">
                  {/* Server Selector Popup Menu */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowServerMenu(prev => !prev);
                        setShowSpeedMenu(false);
                      }}
                      className="flex items-center gap-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[80px]">{activeServer?.name || 'السيرفر'}</span>
                    </button>

                    {showServerMenu && (
                      <div className="absolute bottom-10 left-0 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl min-w-[150px] z-50 space-y-1">
                        <div className="text-[10px] font-black text-zinc-500 px-2 py-1 border-b border-zinc-800">سيرفرات التشغيل</div>
                        {servers.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveServer(s);
                              setShowServerMenu(false);
                            }}
                            className={`w-full text-right px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                              activeServer?.url === s.url ? 'bg-amber-500 text-black font-black' : 'text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            <span>{s.name}</span>
                            {activeServer?.url === s.url && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Playback Speed Menu */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowSpeedMenu(prev => !prev);
                        setShowServerMenu(false);
                      }}
                      className="px-2.5 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="سرعة التشغيل"
                    >
                      {playbackSpeed}x
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute bottom-10 left-0 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl min-w-[120px] z-50 space-y-1">
                        <div className="text-[10px] font-black text-zinc-500 px-2 py-1 border-b border-zinc-800">سرعة التشغيل</div>
                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speedVal => (
                          <button
                            key={speedVal}
                            onClick={() => {
                              setPlaybackSpeed(speedVal);
                              setShowSpeedMenu(false);
                            }}
                            className={`w-full text-right px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                              playbackSpeed === speedVal ? 'bg-amber-500 text-black font-black' : 'text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            <span>{speedVal}x</span>
                            {playbackSpeed === speedVal && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen & Rotate Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="تكبير وتدوير الشاشة"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= IN-PLAYER EPISODE SELECTOR DRAWER ================= */}
      {showEpisodeDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fade-in" dir="rtl">
          <div className="w-full max-w-sm bg-zinc-900 h-full p-5 flex flex-col space-y-4 border-r border-zinc-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ListVideo className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-base text-white">قائمة الحلقات ({episodesList.length})</h3>
              </div>
              <button
                onClick={() => setShowEpisodeDrawer(false)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {episodesList.map((ep) => {
                const isActive = ep.episodeNumber === episodeNumber;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setShowEpisodeDrawer(false);
                      onNavigateEpisode(ep.id, ep.episodeNumber);
                    }}
                    className={`w-full p-3 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-black'
                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {ep.episodeNumber}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{ep.title || `الحلقة ${ep.episodeNumber}`}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{anime.title}</p>
                      </div>
                    </div>
                    {isActive && <Play className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

        {/* ================= CLEAN INFO & SERVER PANEL BELOW PLAYER ================= */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20" dir="rtl">
          {/* Anime Title Info & Back Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all cursor-pointer shadow-lg shrink-0 flex items-center gap-2 text-xs font-bold"
              title="الرجوع لصفحة الأنمي"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">صفحة الأنمي</span>
            </button>
            {anime.coverUrl && (
              <img src={anime.coverUrl} alt={anime.title} className="w-10 h-14 object-cover rounded-xl border border-zinc-800 shrink-0" />
            )}
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">{anime.title}</h2>
              <p className="text-xs font-bold text-amber-500">الحلقة {episodeNumber}</p>
            </div>
          </div>

          {/* Server Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar">
            <span className="text-xs font-bold text-zinc-500 shrink-0">السيرفرات:</span>
            {servers.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveServer(s)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                  activeServer?.url === s.url 
                    ? 'bg-amber-500 text-black font-black shadow-md' 
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
    </div>
  );
}

