import React, { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface ArtPlayerProps {
  url: string;
  title?: string;
  poster?: string;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  getInstance?: (art: Artplayer) => void;
}

const ArtPlayer: React.FC<ArtPlayerProps> = ({ url, title, poster, currentTime = 0, onTimeUpdate, getInstance }) => {
  const artRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Artplayer | null>(null);

  useEffect(() => {
    if (!artRef.current) return;

    let art: Artplayer;
    const isM3u8 = url.includes('.m3u8');

    const customType = {
      m3u8: function (video: HTMLVideoElement, url: string) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            // Setup done
          });
          art.on('destroy', () => hls.destroy());
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
        } else {
          art.notice.show = 'Does not support playback of m3u8';
        }
      },
    };

    art = new Artplayer({
      container: artRef.current,
      url: url,
      type: isM3u8 ? 'm3u8' : 'mp4',
      customType: isM3u8 ? customType : undefined,
      poster: poster || '',
      volume: 1,
      isLive: false,
      muted: false,
      autoplay: true,
      pip: true,
      autoSize: true,
      autoMini: true,
      screenshot: false,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#f59e0b', // Amber-500
      lang: 'ar',
    });

    playerRef.current = art;
    if (getInstance) getInstance(art);

    if (currentTime > 0) {
      art.on('ready', () => {
        art.seek = currentTime;
      });
    }

    if (onTimeUpdate) {
      art.on('video:timeupdate', () => {
        onTimeUpdate(art.currentTime);
      });
    }

    return () => {
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, [url]);

  return <div ref={artRef} className="w-full h-full" />;
}

export default ArtPlayer;
