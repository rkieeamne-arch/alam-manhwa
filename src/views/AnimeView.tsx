import React, { useState, useEffect } from 'react';
import { fetchLatestEpisodes, fetchLatestSeries, Anime } from '../utils/animeScraper';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AnimeViewProps {
  onSelectAnime: (anime: Anime) => void;
}

export default function AnimeView({ onSelectAnime }: AnimeViewProps) {
  const [latestEpisodes, setLatestEpisodes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLatestEpisodes().then(data => {
      setLatestEpisodes(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 text-amber-500" /></div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">آخر الحلقات المضافة</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {latestEpisodes.map(anime => (
          <motion.div
            key={anime.id}
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer bg-zinc-900 rounded-lg overflow-hidden"
            onClick={() => onSelectAnime(anime)}
          >
            <img src={anime.coverUrl} alt={anime.title} className="w-full aspect-[2/3] object-cover" />
            <div className="p-2">
              <h3 className="text-sm font-semibold text-white truncate">{anime.title}</h3>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
