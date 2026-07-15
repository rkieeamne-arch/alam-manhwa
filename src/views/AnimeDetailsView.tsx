import React, { useState, useEffect } from 'react';
import { fetchAnimeDetails, Anime } from '../utils/animeScraper';
import { Loader2, ArrowRight } from 'lucide-react';

interface AnimeDetailsViewProps {
  animeUrl: string;
  onBack: () => void;
  onSelectEpisode: (episodeNumber: number) => void;
  setAnime: (anime: Anime) => void;
}

export default function AnimeDetailsView({ animeUrl, onBack, onSelectEpisode, setAnime }: AnimeDetailsViewProps) {
  const [anime, setAnimeState] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAnimeDetails(animeUrl).then(data => {
      setAnimeState(data);
      if (data) setAnime(data);
      setLoading(false);
    });
  }, [animeUrl, setAnime]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 text-amber-500" /></div>;
  if (!anime) return <div className="text-white text-center p-10">حدث خطأ في جلب تفاصيل الأنمي</div>;

  return (
    <div className="p-6 text-right text-white">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 mb-6"><ArrowRight /> عودة</button>
      <div className="flex flex-col md:flex-row gap-6">
        <img src={anime.coverUrl} alt={anime.title} className="w-full md:w-64 rounded-lg" />
        <div>
          <h1 className="text-3xl font-bold mb-4">{anime.title}</h1>
          <p className="mb-4">{anime.description}</p>
          <div className="grid grid-cols-2 gap-4">
             {anime.episodes.map(ep => (
               <button key={ep.id} onClick={() => onSelectEpisode(ep.episodeNumber)} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700">
                 {ep.title}
               </button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
