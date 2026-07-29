import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Award } from 'lucide-react';

interface Particle {
  id: number;
  emoji: string;
  x: number; // percentage from left
  y: number; // percentage from top
  scale: number;
  rotate: number;
  tx: number; // target translate x (pixels)
  ty: number; // target translate y (pixels)
  duration: number;
}

export default function CompanionEffects() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [levelUpAlert, setLevelUpAlert] = useState<{ show: boolean; level: number } | null>(null);

  // Sound effects can be added if requested, for now we do visually striking animations

  useEffect(() => {
    const handleEffect = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: 'cuddle' | 'evolve'; level?: number }>;
      const { type, level } = customEvent.detail;

      const now = Date.now();
      const newParticles: Particle[] = [];

      if (type === 'cuddle') {
        // Heart & Love Explosion
        const emojis = ['❤️', '💖', '🥰', '💕', '✨', '🌸', '💘'];
        
        // 1. Burst from bottom-left corner (near floating widget)
        for (let i = 0; i < 18; i++) {
          const angle = (Math.random() * 80 + 5) * (Math.PI / 180); // 5 to 85 degrees
          const distance = Math.random() * 150 + 100;
          newParticles.push({
            id: now + i,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            x: 10 + (Math.random() * 10 - 5), // Near bottom-left
            y: 85 + (Math.random() * 10 - 5),
            scale: Math.random() * 0.8 + 0.6,
            rotate: Math.random() * 360,
            tx: Math.cos(angle) * distance * 1.5,
            ty: -Math.sin(angle) * distance * 1.5,
            duration: Math.random() * 1.5 + 1.2,
          });
        }

        // 2. Burst from center of screen (covers modal view)
        for (let i = 0; i < 18; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 180 + 80;
          newParticles.push({
            id: now + 100 + i,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            x: 50 + (Math.random() * 8 - 4),
            y: 50 + (Math.random() * 8 - 4),
            scale: Math.random() * 0.9 + 0.6,
            rotate: Math.random() * 360,
            tx: Math.cos(angle) * distance,
            ty: Math.sin(angle) * distance,
            duration: Math.random() * 1.6 + 1.0,
          });
        }
      } else if (type === 'evolve') {
        // Celestial Star Shower / Confetti Explosion
        const emojis = ['✨', '🌟', '🎉', '👑', '🔥', '💫', '⚡', '💛'];
        
        // Trigger Level Up Screen overlay Alert
        if (level) {
          setLevelUpAlert({ show: true, level });
          setTimeout(() => {
            setLevelUpAlert(null);
          }, 4000);
        }

        // 1. Spawning standard particles in screen center
        for (let i = 0; i < 35; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 250 + 100;
          newParticles.push({
            id: now + 200 + i,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            x: 50 + (Math.random() * 10 - 5),
            y: 45 + (Math.random() * 10 - 5),
            scale: Math.random() * 1.1 + 0.7,
            rotate: Math.random() * 360,
            tx: Math.cos(angle) * distance,
            ty: Math.sin(angle) * distance,
            duration: Math.random() * 2.2 + 1.6,
          });
        }

        // 2. Rising particles from the widget
        for (let i = 0; i < 20; i++) {
          const angle = (Math.random() * 70 + 10) * (Math.PI / 180);
          const distance = Math.random() * 200 + 150;
          newParticles.push({
            id: now + 300 + i,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            x: 10 + (Math.random() * 10 - 5),
            y: 85 + (Math.random() * 10 - 5),
            scale: Math.random() * 1.0 + 0.6,
            rotate: Math.random() * 360,
            tx: Math.cos(angle) * distance * 1.5,
            ty: -Math.sin(angle) * distance * 1.5,
            duration: Math.random() * 2.0 + 1.5,
          });
        }
      }

      setParticles((prev) => [...prev, ...newParticles]);

      // Remove particles after their animations finish
      const maxDuration = 3000;
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => Date.now() - p.id < maxDuration));
      }, maxDuration);
    };

    window.addEventListener('companion-effect', handleEffect);
    return () => {
      window.removeEventListener('companion-effect', handleEffect);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      {/* 1. RENDER BURSTING PARTICLES */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              opacity: 1, 
              scale: 0.1, 
              x: 0, 
              y: 0, 
              rotate: 0 
            }}
            animate={{ 
              opacity: [1, 1, 0.8, 0],
              scale: [0.1, p.scale, p.scale * 1.2, p.scale * 0.4],
              x: p.tx, 
              y: p.ty,
              rotate: p.rotate 
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: p.duration, 
              ease: "easeOut" 
            }}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: '24px',
              userSelect: 'none',
              transformOrigin: 'center',
            }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 2. RENDER GRAND LEVEL-UP / EVOLUTION BANNER */}
      <AnimatePresence>
        {levelUpAlert && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 15 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto z-[1000]"
            onClick={() => setLevelUpAlert(null)}
          >
            <motion.div 
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
              className="relative max-w-sm mx-4 bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.4)] overflow-hidden"
              dir="rtl"
            >
              {/* Decorative Background Rings */}
              <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl" />

              {/* Glowing Halo behind award icon */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-amber-500/20 rounded-full blur-xl animate-pulse" />

              {/* Header Icon */}
              <div className="relative z-10 flex justify-center mb-4">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2.5, 
                    repeatType: "reverse" 
                  }}
                  className="bg-amber-500 text-zinc-950 p-4 rounded-full shadow-lg border-2 border-yellow-300"
                >
                  <Award className="w-8 h-8" />
                </motion.div>
              </div>

              {/* Alert Typography */}
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-black text-amber-400 mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
                <span>ارتقى رفيقك القارئ!</span>
                <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
              </motion.h3>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-zinc-300 leading-relaxed mb-4 font-bold"
              >
                لقد زادت طاقة رفيقك وتطور نفوذه! مستواه الحالي الآن:
              </motion.p>

              {/* Large Level Badge */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                className="inline-flex items-center gap-1 bg-amber-500/20 border-2 border-amber-500/50 text-amber-300 font-black text-3xl px-6 py-2 rounded-2xl mb-4 font-mono shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                <span>LEVEL</span>
                <span>{levelUpAlert.level}</span>
              </motion.div>

              {/* Heart Interaction Reminder */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-zinc-400 bg-zinc-800/60 py-2 px-4 rounded-xl border border-zinc-700/50 flex items-center justify-center gap-1.5"
              >
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
                <span>استمر بالقراءة والمشاهدة لفتح هدايا ومقتنيات جديدة!</span>
              </motion.div>

              {/* Tap to close note */}
              <div className="text-[10px] text-zinc-500 mt-4 animate-pulse">
                انقر في أي مكان لإغلاق هذه النافذة الكبرى
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
