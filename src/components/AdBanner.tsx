import React, { useState } from 'react';
import { ExternalLink, X, Megaphone } from 'lucide-react';
import { AppwriteAd } from '../lib/appwrite';

interface AdBannerProps {
  ads: AppwriteAd[];
  position: 'top_banner' | 'reader_bottom' | 'sidebar' | 'popup';
}

export default function AdBanner({ ads, position }: AdBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const activeAds = ads.filter(
    a => a.position === position && a.isActive && a.$id && !dismissedIds.includes(a.$id)
  );

  if (activeAds.length === 0) return null;

  const handleDismiss = (e: React.MouseEvent, id?: string) => {
    e.stopPropagation();
    if (id) {
      setDismissedIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="w-full my-4 space-y-3">
      {activeAds.map(ad => (
        <div
          key={ad.$id || Math.random().toString()}
          className="relative group bg-zinc-900/80 border border-pink-500/30 hover:border-pink-500/60 rounded-2xl overflow-hidden shadow-xl transition-all duration-300"
        >
          <a
            href={ad.linkUrl || '#'}
            target={ad.linkUrl && ad.linkUrl !== '#' ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="block"
          >
            {ad.imageUrl ? (
              <div className="relative max-h-48 w-full overflow-hidden flex items-center justify-center bg-zinc-950">
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-full h-auto max-h-48 object-cover group-hover:scale-102 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent flex items-end p-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="text-right">
                      <span className="text-[9px] font-black tracking-wider uppercase text-pink-400 bg-pink-950/80 border border-pink-800/50 px-2 py-0.5 rounded-md inline-block mb-1">
                        إعلان متثبت
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-pink-300 transition-colors drop-shadow">
                        {ad.title}
                      </h4>
                    </div>
                    {ad.linkUrl && ad.linkUrl !== '#' && (
                      <span className="p-2 bg-pink-600 group-hover:bg-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-lg shrink-0">
                        <span>زيارة</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between bg-gradient-to-r from-pink-950/40 via-zinc-900 to-purple-950/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-600/20 text-pink-400 rounded-xl">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-pink-400">إعلان مميز</span>
                    <h4 className="text-xs font-black text-white">{ad.title}</h4>
                  </div>
                </div>
                {ad.linkUrl && ad.linkUrl !== '#' && (
                  <span className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow">
                    <span>افتح الرابط</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            )}
          </a>

          {/* Dismiss Button */}
          <button
            onClick={(e) => handleDismiss(e, ad.$id)}
            className="absolute top-2 left-2 p-1.5 bg-zinc-950/80 hover:bg-red-600 text-zinc-400 hover:text-white rounded-full transition-all border border-zinc-800 z-10 cursor-pointer"
            title="إغلاق الإعلان"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
