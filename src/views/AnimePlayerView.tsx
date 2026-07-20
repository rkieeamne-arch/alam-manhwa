import React, { useState, useEffect, useRef } from 'react';
import { fetchWatchServers, Anime, Episode } from '../utils/animeScraper';
import { Loader2, ShieldCheck, Play, ChevronLeft, ChevronRight, RotateCcw, RotateCw } from 'lucide-react';

interface AnimePlayerViewProps {
  anime: Anime;
  episodeNumber: number;
  onNavigateEpisode: (episodeId: string, episodeNumber: number) => void;
}

export default function AnimePlayerView({ anime, episodeNumber, onNavigateEpisode }: AnimePlayerViewProps) {
  const [servers, setServers] = useState<{ name: string; url: string }[]>([]);
  const [activeServer, setActiveServer] = useState<{ name: string; url: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);

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
      <div className="flex-grow relative">
        {activeServer ? (
          <iframe
            ref={iframeRef}
            src={activeServer.url}
            title={`${anime.title} Episode ${episodeNumber}`}
            className="w-full h-full object-contain"
            allowFullScreen
            referrerPolicy="no-referrer"
            scrolling="no"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
          />
        ) : (
          <div className="flex justify-center items-center h-full text-white">لا توجد سيرفرات متاحة</div>
        )}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span>تم تفعيل درع الحماية من الإعلانات</span>
        </div>
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/60 backdrop-blur-md px-8 py-4 rounded-full text-white">
          <button onClick={() => seekVideo(-10)} className="p-3 hover:bg-zinc-700 rounded-full transition-all">
            <RotateCcw className="w-6 h-6" />
          </button>
          <button onClick={() => seekVideo(10)} className="p-3 hover:bg-zinc-700 rounded-full transition-all">
            <RotateCw className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="p-4 bg-zinc-900 text-white flex items-center justify-between gap-4">
        <button onClick={() => handleNavigateEpisode('prev')} className="p-2 bg-zinc-800 rounded-lg shrink-0"><ChevronLeft /></button>
        <div className="text-sm sm:text-lg font-bold truncate text-center flex-1" dir="rtl">
          <span className="text-amber-500">الحلقة {episodeNumber}</span>
          <span className="mx-2 text-zinc-500">•</span>
          <span className="text-zinc-300">{anime.title}</span>
        </div>
        <button onClick={() => handleNavigateEpisode('next')} className="p-2 bg-zinc-800 rounded-lg shrink-0"><ChevronRight /></button>
      </div>

      <div className="p-4 bg-zinc-950 flex gap-2 overflow-x-auto">
        {servers.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveServer(s)}
            className={`px-4 py-2 rounded-lg text-sm ${activeServer?.url === s.url ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-white'}`}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
