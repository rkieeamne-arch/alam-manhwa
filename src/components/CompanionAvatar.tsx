import React from 'react';
import { CompanionType, CompanionStage, CompanionMood } from '../types';
import { ALL_COSMETIC_ITEMS } from '../utils/companionStorage';

interface CompanionAvatarProps {
  type: CompanionType;
  stage: CompanionStage;
  level?: number;
  mood?: CompanionMood;
  equipped?: {
    hat?: string;
    prop?: string;
    aura?: string;
    background?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

export default function CompanionAvatar({
  type,
  stage,
  level = 1,
  mood = 'happy',
  equipped = {},
  size = 'md',
  className = '',
  animate = true
}: CompanionAvatarProps) {
  // Dimensions map (Scaled down for compact and delicate layout)
  const sizeMap = {
    xs: 'w-6.5 h-6.5',
    sm: 'w-9 h-9',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36'
  };

  const currentSizeClass = sizeMap[size] || sizeMap.md;

  // Hat & Prop items
  const hatItem = ALL_COSMETIC_ITEMS.find(i => i.id === equipped.hat);
  const propItem = ALL_COSMETIC_ITEMS.find(i => i.id === equipped.prop);
  const auraItem = ALL_COSMETIC_ITEMS.find(i => i.id === equipped.aura);

  // Stage scaling
  const scaleByStage = {
    egg: 'scale-90',
    baby: 'scale-95',
    teen: 'scale-100',
    adult: 'scale-105'
  };

  // EGG STAGE
  if (stage === 'egg') {
    return (
      <div className={`relative flex items-center justify-center ${currentSizeClass} ${className}`}>
        {/* Aura / Sparkles behind egg */}
        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
        
        {/* Egg Container */}
        <div className={`relative z-10 w-full h-full flex items-center justify-center ${animate ? 'animate-bounce' : ''}`} style={{ animationDuration: '3s' }}>
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg">
            <defs>
              <linearGradient id="eggGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="glowRune" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            <path
              d="M50 10 C 20 10, 10 50, 10 80 C 10 105, 30 115, 50 115 C 70 115, 90 105, 90 80 C 90 50, 80 10, 50 10 Z"
              fill="url(#eggGrad)"
              stroke="#78350f"
              strokeWidth="3"
            />
            <path
              d="M35 45 L45 55 L40 65 L55 75 L48 85"
              fill="none"
              stroke="url(#glowRune)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />
            <circle cx="30" cy="30" r="3" fill="#ffffff" opacity="0.8" />
            <circle cx="70" cy="40" r="2" fill="#ffffff" opacity="0.9" />
            <circle cx="65" cy="85" r="2.5" fill="#fef08a" opacity="0.9" />
          </svg>
          <span className="absolute text-xl bottom-1 select-none animate-ping opacity-75">✨</span>
        </div>
      </div>
    );
  }

  // COLOR PALETTE BY COMPANION TYPE
  const typeConfig = {
    wolf: {
      primary: '#3b82f6', // blue-500
      secondary: '#1e40af', // blue-800
      belly: '#e0f2fe',
      ears: '#1d4ed8',
      glow: 'rgba(59, 130, 246, 0.35)',
      defaultName: 'ذئب'
    },
    dragon: {
      primary: '#ef4444', // red-500
      secondary: '#991b1b', // red-800
      belly: '#fef08a', // yellow-200
      ears: '#dc2626',
      glow: 'rgba(239, 68, 68, 0.4)',
      defaultName: 'تنين'
    },
    fox: {
      primary: '#f97316', // orange-500
      secondary: '#c2410c', // orange-700
      belly: '#fff7ed',
      ears: '#ea580c',
      glow: 'rgba(249, 115, 22, 0.35)',
      defaultName: 'ثعلب'
    },
    spirit: {
      primary: '#a855f7', // purple-500
      secondary: '#6b21a8', // purple-800
      belly: '#f3e8ff',
      ears: '#9333ea',
      glow: 'rgba(168, 85, 247, 0.45)',
      defaultName: 'روح'
    }
  };

  const cfg = typeConfig[type] || typeConfig.wolf;

  // Background Custom Styles & Floating Elements Map
  const bgStyles: Record<string, { class: string; elements?: React.ReactNode }> = {
    cozy_library: {
      class: 'bg-gradient-to-b from-[#7c2d12] via-[#451a03] to-[#1c1917] border-[#78350f]',
      elements: (
        <div className="absolute inset-0 opacity-80 flex items-center justify-center overflow-hidden pointer-events-none">
          <span className="absolute text-sm top-1 right-2 animate-pulse">📚</span>
          <span className="absolute text-xs bottom-1 left-2">📖</span>
          <span className="absolute text-[11px] top-6 left-1">📜</span>
        </div>
      )
    },
    sunset_beach: {
      class: 'bg-gradient-to-b from-orange-500 via-pink-500 to-indigo-950 border-orange-400',
      elements: (
        <div className="absolute inset-0 opacity-80 overflow-hidden pointer-events-none">
          <span className="absolute text-sm top-1.5 left-2 animate-bounce" style={{ animationDuration: '3s' }}>🌅</span>
          <span className="absolute text-xs bottom-1.5 right-2">🏝️</span>
        </div>
      )
    },
    starry_sky: {
      class: 'bg-gradient-to-b from-indigo-900 via-purple-950 to-zinc-950 border-indigo-400',
      elements: (
        <div className="absolute inset-0 opacity-90 overflow-hidden pointer-events-none">
          <span className="absolute text-[10px] top-1 right-3 animate-pulse">⭐</span>
          <span className="absolute text-[9px] top-4 left-2 animate-ping">✨</span>
          <span className="absolute text-sm bottom-1 left-3">🌙</span>
        </div>
      )
    },
    ancient_temple: {
      class: 'bg-gradient-to-br from-red-900 via-rose-950 to-[#0c0404] border-red-500',
      elements: (
        <div className="absolute inset-0 opacity-85 overflow-hidden pointer-events-none">
          <span className="absolute text-sm top-1 left-3">⛩️</span>
          <span className="absolute text-[10px] top-6 right-2 animate-bounce">🍁</span>
        </div>
      )
    },
    floating_castle: {
      class: 'bg-gradient-to-b from-sky-900 via-indigo-950 to-purple-950 border-sky-400',
      elements: (
        <div className="absolute inset-0 opacity-85 overflow-hidden pointer-events-none">
          <span className="absolute text-sm top-1 right-2">🏰</span>
          <span className="absolute text-xs bottom-1 left-2 animate-pulse">☁️</span>
        </div>
      )
    },
    royal_throne: {
      class: 'bg-gradient-to-br from-purple-900 via-amber-950/60 to-zinc-950 border-yellow-500',
      elements: (
        <div className="absolute inset-0 opacity-85 overflow-hidden pointer-events-none">
          <span className="absolute text-sm top-1 right-2">👑</span>
          <span className="absolute text-xs bottom-2 left-2">🏛️</span>
        </div>
      )
    },
    enchanted_forest: {
      class: 'bg-gradient-to-b from-emerald-900 via-teal-950 to-zinc-950 border-emerald-500',
      elements: (
        <div className="absolute inset-0 opacity-85 overflow-hidden pointer-events-none">
          <span className="absolute text-sm bottom-1 left-2">🌲</span>
          <span className="absolute text-[9px] top-1.5 right-2 animate-pulse">🍄</span>
        </div>
      )
    },
    cyberpunk_city: {
      class: 'bg-gradient-to-br from-violet-900 via-fuchsia-950 to-cyan-950 border-fuchsia-500',
      elements: (
        <div className="absolute inset-0 opacity-85 overflow-hidden pointer-events-none">
          <span className="absolute text-sm top-1 right-2">🏙️</span>
          <span className="absolute text-[9px] bottom-1 left-2 text-fuchsia-400 font-bold tracking-tight">NEON</span>
        </div>
      )
    }
  };

  const backgroundItem = equipped.background ? bgStyles[equipped.background] : null;

  return (
    <div className={`relative flex items-center justify-center ${currentSizeClass} ${className}`}>
      
      {/* Equipped Background Panel */}
      {backgroundItem && (
        <div className={`absolute inset-0 rounded-full border shadow-inner overflow-hidden ${backgroundItem.class} z-0`}>
          {backgroundItem.elements}
        </div>
      )}
      
      {/* Background Aura Effects */}
      {auraItem?.id === 'star_sparkles' && (
        <div className="absolute -inset-2 flex items-center justify-center pointer-events-none z-0">
          <span className="absolute top-0 right-0 text-xs animate-ping">✨</span>
          <span className="absolute bottom-1 left-0 text-[10px] animate-bounce">⭐</span>
          <span className="absolute top-2 left-2 text-[10px] animate-pulse">🌟</span>
        </div>
      )}

      {(auraItem?.id === 'cherry_blossom' || auraItem?.id === 'sakura_petals') && (
        <div className="absolute -inset-2 flex items-center justify-center pointer-events-none z-0">
          <span className="absolute top-0 left-1 text-xs animate-spin" style={{ animationDuration: '6s' }}>🌸</span>
          <span className="absolute bottom-1 right-1 text-xs animate-bounce">🌺</span>
        </div>
      )}

      {auraItem?.id === 'dragon_flame' && (
        <div className="absolute -inset-2 bg-gradient-to-t from-red-500/30 via-orange-500/20 to-transparent rounded-full blur-md animate-pulse z-0" />
      )}

      {auraItem?.id === 'thunder_sparks' && (
        <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur-md animate-pulse z-0">
          <span className="absolute top-0 left-1 text-xs animate-ping">⚡</span>
          <span className="absolute bottom-0 right-1 text-xs animate-pulse">⚡</span>
        </div>
      )}

      {auraItem?.id === 'shadow_flame' && (
        <div className="absolute -inset-2 bg-purple-900/40 rounded-full blur-md animate-pulse z-0">
          <span className="absolute top-0 right-0 text-xs animate-bounce">🖤</span>
        </div>
      )}

      {auraItem?.id === 'galaxy_nebula' && (
        <div className="absolute -inset-3 bg-gradient-to-r from-purple-600/30 via-pink-500/20 to-blue-600/30 rounded-full blur-lg animate-spin z-0" style={{ animationDuration: '10s' }} />
      )}

      {auraItem?.id === 'magic_runes' && (
        <div className="absolute -inset-3 border-2 border-dashed border-purple-400/50 rounded-full animate-spin z-0 pointer-events-none" style={{ animationDuration: '12s' }} />
      )}

      {auraItem?.id === 'fireflies' && (
        <div className="absolute -inset-2 flex items-center justify-center pointer-events-none z-0">
          <span className="absolute top-1 left-2 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse shadow-[0_0_8px_#fde047]" />
          <span className="absolute bottom-2 left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping shadow-[0_0_10px_#facc15]" style={{ animationDuration: '3s' }} />
          <span className="absolute top-2 right-1 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse shadow-[0_0_8px_#fde047]" style={{ animationDelay: '1s' }} />
          <span className="absolute bottom-1 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-[0_0_10px_#facc15]" style={{ animationDelay: '0.5s' }} />
        </div>
      )}

      {/* Level-Based Dynamic Aura Glow (Evolves with level) */}
      <div 
        className={`absolute inset-0.5 rounded-full blur-md transition-all duration-300 pointer-events-none ${
          level >= 15 
            ? 'ring-2 ring-yellow-400/80 animate-pulse shadow-[0_0_15px_rgba(253,224,71,0.5)]' 
            : level >= 10 
            ? 'ring-1 ring-yellow-400/40 shadow-[0_0_8px_rgba(253,224,71,0.3)]' 
            : ''
        }`} 
        style={{ backgroundColor: backgroundItem ? undefined : cfg.glow }} 
      />

      {/* COMPANION SVG SPRITE */}
      <div className={`relative z-10 w-full h-full ${scaleByStage[stage]} ${animate ? 'transition-transform duration-300' : ''}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id={`grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cfg.primary} />
              <stop offset="100%" stopColor={cfg.secondary} />
            </linearGradient>
            <radialGradient id="gemGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#eab308" />
            </radialGradient>
          </defs>

          {/* LEVEL EVOLUTION: Level >= 14 - Divine back ring of wisdom */}
          {level >= 14 && (
            <ellipse cx="50" cy="18" rx="25" ry="5" fill="none" stroke="#facc15" strokeWidth="1.5" strokeDasharray="2 2" className="animate-spin" style={{ animationDuration: '20s' }} />
          )}

          {/* LEVEL EVOLUTION: Level >= 9 - Back Ring of Magic */}
          {level >= 9 && (
            <circle cx="50" cy="55" r="37" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" className="animate-spin" style={{ animationDuration: '9s' }} />
          )}

          {/* LEVEL EVOLUTION: Level >= 6 - Wings / Multi Tails / Shoulder Crests */}
          {level >= 6 && (
            <g opacity="0.9">
              {type === 'dragon' ? (
                <g fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5">
                  <path d="M18 45 C0 25, -5 55, 18 62 Z" />
                  <path d="M82 45 C100 25, 105 55, 82 62 Z" />
                </g>
              ) : type === 'fox' ? (
                <g fill={cfg.primary} stroke="#c2410c" strokeWidth="1.2">
                  <path d="M78 60 C98 48, 98 78, 80 75 Z" />
                  <path d="M22 60 C2 48, 2 78, 20 75 Z" />
                  {/* Level >= 11: Extra tail */}
                  {level >= 11 && (
                    <g>
                      <path d="M76 48 C94 30, 99 60, 78 58 Z" />
                      <path d="M24 48 C6 30, 1 60, 22 58 Z" />
                    </g>
                  )}
                </g>
              ) : type === 'wolf' ? (
                <g fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1.2">
                  <path d="M15 52 L5 42 L18 60 Z" />
                  <path d="M85 52 L95 42 L82 60 Z" />
                </g>
              ) : (
                <circle cx="50" cy="55" r="42" fill="none" stroke="#d8b4fe" strokeWidth="1" strokeDasharray="4 2" />
              )}
            </g>
          )}

          {/* LEVEL EVOLUTION: Level >= 12 - Orbs of Wisdom */}
          {level >= 12 && (
            <g fill="#fbbf24" opacity="0.9">
              <circle cx="15" cy="40" r="3.5" className="animate-bounce" />
              <circle cx="85" cy="40" r="3.5" className="animate-bounce" style={{ animationDelay: '0.4s' }} />
            </g>
          )}

          {/* EARS / HORNS */}
          {type === 'dragon' ? (
            <g>
              <path d="M25 35 L12 18 L28 28 Z" fill={level >= 10 ? '#facc15' : '#eab308'} stroke="#713f12" strokeWidth="1.5" />
              <path d="M75 35 L88 18 L72 28 Z" fill={level >= 10 ? '#facc15' : '#eab308'} stroke="#713f12" strokeWidth="1.5" />
              <path d="M15 50 C5 40, 0 60, 18 65 Z" fill={cfg.secondary} />
              <path d="M85 50 C95 40, 100 60, 82 65 Z" fill={cfg.secondary} />
            </g>
          ) : (
            <g>
              <polygon points="20,40 10,12 40,30" fill={`url(#grad-${type})`} stroke="#1e293b" strokeWidth="1.5" />
              <polygon points="80,40 90,12 60,30" fill={`url(#grad-${type})`} stroke="#1e293b" strokeWidth="1.5" />
              <polygon points="22,36 15,18 36,29" fill={cfg.belly} />
              <polygon points="78,36 85,18 64,29" fill={cfg.belly} />
              
              {/* Level >= 4: Golden Ear Tip Accents */}
              {level >= 4 && (
                <g fill="#facc15">
                  <polygon points="10,12 15,18 18,14" />
                  <polygon points="90,12 85,18 82,14" />
                </g>
              )}

              {/* LEVEL EVOLUTION: Level >= 13 - Fire Ears Accents */}
              {level >= 13 && (
                <g fill="#ef4444" opacity="0.8" className="animate-pulse">
                  <path d="M12 20 Q18 16 16 26 Z" />
                  <path d="M88 20 Q82 16 84 26 Z" />
                </g>
              )}
            </g>
          )}

          {/* MAIN TAIL */}
          {type === 'fox' ? (
            <path d="M75 65 C95 55, 95 85, 78 80 Z" fill={cfg.primary} stroke="#c2410c" strokeWidth="1.5" />
          ) : type === 'wolf' ? (
            <path d="M75 68 C90 60, 92 82, 75 82 Z" fill={cfg.secondary} stroke="#0284c7" strokeWidth="1.5" />
          ) : type === 'spirit' ? (
            <path d="M50 82 C40 95, 60 98, 50 88 Z" fill={cfg.primary} opacity="0.6" />
          ) : null}

          {/* BODY / HEAD */}
          <circle cx="50" cy="55" r="32" fill={`url(#grad-${type})`} stroke="#0f172a" strokeWidth="2" />
          
          {/* LEVEL EVOLUTION: Level >= 15 - God Tier Celestial Body Ring */}
          {level >= 15 && (
            <g stroke="#facc15" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" className="animate-pulse">
              <circle cx="50" cy="55" r="33.5" />
            </g>
          )}

          {/* Belly Patch */}
          <ellipse cx="50" cy="65" rx="18" ry="16" fill={cfg.belly} />

          {/* LEVEL EVOLUTION: Level >= 5 - Neck Fluff Emblem */}
          {level >= 5 && (
            <path d="M42 63 Q50 69 58 63 Q50 73 42 63" fill="#facc15" opacity="0.9" />
          )}

          {/* LEVEL EVOLUTION: Level >= 2 - Forehead Rune / Star Mark */}
          {level >= 2 && (
            <g transform="translate(50, 34) scale(0.8)">
              {level >= 10 ? (
                <polygon points="0,-6 2,-2 6,-2 3,1 4,5 0,3 -4,5 -3,1 -6,-2 -2,-2" fill="#facc15" stroke="#a16207" strokeWidth="0.8" />
              ) : (
                <circle cx="0" cy="0" r="2.5" fill="#38bdf8" />
              )}
            </g>
          )}

          {/* LEVEL EVOLUTION: Level >= 8 - Chest Core Gem */}
          {level >= 8 && (
            <g transform="translate(50, 62)">
              <polygon points="0,-4 4,0 0,4 -4,0" fill="url(#gemGlow)" stroke="#ca8a04" strokeWidth="1" />
            </g>
          )}

          {/* EYES BY MOOD */}
          {mood === 'sleepy' ? (
            <g stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <path d="M36 48 C 38 52, 42 52, 44 48" />
              <path d="M56 48 C 58 52, 62 52, 64 48" />
            </g>
          ) : mood === 'sad' ? (
            <g fill="#0f172a">
              <circle cx="38" cy="48" r="3.5" />
              <circle cx="62" cy="48" r="3.5" />
              <circle cx="35" cy="54" r="1.5" fill="#38bdf8" />
            </g>
          ) : mood === 'excited' ? (
            <g fill="#0f172a">
              <path d="M34 45 L42 51 L34 53 Z" fill="#eab308" />
              <path d="M66 45 L58 51 L66 53 Z" fill="#eab308" />
            </g>
          ) : (
            <g fill="#0f172a">
              <circle cx="38" cy="48" r={level >= 12 ? 4.5 : 4} />
              <circle cx="62" cy="48" r={level >= 12 ? 4.5 : 4} />
              <circle cx="36.5" cy="46.5" r="1.5" fill="#ffffff" />
              <circle cx="60.5" cy="46.5" r="1.5" fill="#ffffff" />
              
              {/* LEVEL EVOLUTION: Level >= 7 - Starry reflection in pupils */}
              {level >= 7 && (
                <g fill="#60a5fa" opacity="0.9">
                  <circle cx="39.5" cy="49.5" r="1" />
                  <circle cx="63.5" cy="49.5" r="1" />
                </g>
              )}
            </g>
          )}

          {/* CHEEKS */}
          <circle cx="30" cy="56" r="3.5" fill="#f43f5e" opacity="0.4" />
          <circle cx="70" cy="56" r="3.5" fill="#f43f5e" opacity="0.4" />

          {/* LEVEL EVOLUTION: Level >= 3 - Extra Cheek Sparkles */}
          {level >= 3 && (
            <g fill="#fb7185" className="animate-pulse">
              <circle cx="26" cy="58" r="1" />
              <circle cx="74" cy="58" r="1" />
            </g>
          )}

          {/* MOUTH / NOSE */}
          <polygon points="50,52 47,56 53,56" fill="#0f172a" />
          {mood === 'sad' ? (
            <path d="M46 62 Q 50 58 54 62" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M45 59 Q 50 64 55 59" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          )}

          {/* EQUIPPED HAT / HEADWEAR OVERLAYS */}
          {hatItem?.id === 'glasses' && (
            <g stroke="#334155" strokeWidth="2.5" fill="rgba(255,255,255,0.2)">
              <circle cx="38" cy="48" r="8" />
              <circle cx="62" cy="48" r="8" />
              <line x1="46" y1="48" x2="54" y2="48" />
            </g>
          )}

          {hatItem?.id === 'headphones' && (
            <g stroke="#0f172a" strokeWidth="2" fill="none">
              <path d="M18 48 C 18 20, 82 20, 82 48" stroke="#38bdf8" strokeWidth="3.5" />
              <rect x="14" y="42" width="8" height="14" rx="3" fill="#0284c7" />
              <rect x="78" y="42" width="8" height="14" rx="3" fill="#0284c7" />
            </g>
          )}

          {hatItem?.id === 'ninja_headband' && (
            <g>
              <rect x="18" y="32" width="64" height="8" rx="2" fill="#1e293b" />
              <rect x="42" y="33" width="16" height="6" rx="1" fill="#cbd5e1" />
            </g>
          )}

          {hatItem?.id === 'angel_halo' && (
            <ellipse cx="50" cy="20" rx="18" ry="5" fill="none" stroke="#fde047" strokeWidth="3" />
          )}

          {hatItem?.id === 'crown' && (
            <polygon points="35,28 41,18 50,25 59,18 65,28" fill="#eab308" stroke="#854d0e" strokeWidth="1.5" />
          )}

          {hatItem?.id === 'wizard_hat' && (
            <path d="M30,30 L50,2 L70,30 C60,32 40,32 30,30 Z" fill="#6d28d9" stroke="#4c1d95" strokeWidth="1.5" />
          )}

          {hatItem?.id === 'detective_hat' && (
            <g>
              <rect x="25" y="14" width="50" height="17" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
              <ellipse cx="50" cy="31" rx="32" ry="4.5" fill="#0f172a" />
              <rect x="25" y="24" width="50" height="4" fill="#ef4444" />
            </g>
          )}

          {hatItem?.id === 'samurai_helmet' && (
            <g>
              <path d="M22 34 C22 14, 78 14, 78 34" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
              <polygon points="50,15 42,24 58,24" fill="#fbbf24" stroke="#ca8a04" strokeWidth="1.5" />
              <path d="M20 28 Q30 35 34 26" fill="#b91c1c" />
              <path d="M80 28 Q70 35 66 26" fill="#b91c1c" />
            </g>
          )}

          {hatItem?.id === 'santa_hat' && (
            <g>
              <path d="M24 34 L50 6 L72 32 C60 36, 35 36, 24 34 Z" fill="#dc2626" />
              <rect x="22" y="30" width="56" height="7" rx="3.5" fill="#f8fafc" />
              <circle cx="50" cy="7" r="4.5" fill="#f8fafc" />
            </g>
          )}

          {hatItem?.id === 'pirate_hat' && (
            <g>
              <path d="M22 32 Q 50 18 78 32 C 85 32, 80 22, 50 15 C 20 22, 15 32, 22 32 Z" fill="#0f172a" stroke="#eab308" strokeWidth="1.5" />
              <circle cx="50" cy="24" r="2.5" fill="#ffffff" />
            </g>
          )}

          {hatItem?.id === 'flower_crown' && (
            <g fill="#f43f5e">
              <circle cx="30" cy="28" r="3" />
              <circle cx="40" cy="24" r="3.5" fill="#fb7185" />
              <circle cx="50" cy="22" r="4" fill="#f43f5e" />
              <circle cx="60" cy="24" r="3.5" fill="#fb7185" />
              <circle cx="70" cy="28" r="3" />
            </g>
          )}

          {hatItem?.id === 'scarf' && (
            <path d="M32 68 Q 50 78 68 68 Q 50 82 32 68 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
          )}

          {/* EQUIPPED PROP OVERLAYS */}
          {propItem?.id === 'coffee_cup' && (
            <g transform="translate(62, 58)">
              <rect x="0" y="0" width="12" height="14" rx="2" fill="#38bdf8" stroke="#0369a1" strokeWidth="1" />
              <path d="M12 3 C15 3 15 10 12 10" fill="none" stroke="#0369a1" strokeWidth="1.5" />
              <path d="M3 -3 Q 6 -7 3 -10" fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.7" />
            </g>
          )}

          {propItem?.id === 'gaming_controller' && (
            <g transform="translate(36, 68)">
              <rect x="0" y="0" width="28" height="12" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
              <circle cx="6" cy="6" r="2" fill="#ef4444" />
              <circle cx="22" cy="6" r="2" fill="#22c55e" />
            </g>
          )}

          {propItem?.id === 'boba_tea' && (
            <g transform="translate(64, 56)">
              <rect x="0" y="0" width="11" height="16" rx="2" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
              <line x1="5.5" y1="-4" x2="5.5" y2="12" stroke="#ef4444" strokeWidth="2" />
              <circle cx="3" cy="12" r="1" fill="#0f172a" />
              <circle cx="8" cy="12" r="1" fill="#0f172a" />
            </g>
          )}

          {propItem?.id === 'secret_book' && (
            <g transform="translate(18, 58)">
              <rect x="0" y="0" width="14" height="16" rx="1" fill="#854d0e" stroke="#451a03" strokeWidth="1" />
              <line x1="7" y1="0" x2="7" y2="16" stroke="#fef08a" strokeWidth="1.5" />
            </g>
          )}

          {propItem?.id === 'legendary_sword' && (
            <g transform="translate(70, 40) rotate(25)">
              <rect x="0" y="0" width="4" height="24" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
              <rect x="-3" y="18" width="10" height="3" fill="#eab308" />
            </g>
          )}

          {propItem?.id === 'shield' && (
            <g transform="translate(14, 52)">
              <path d="M0 0 L12 0 L12 12 L6 18 L0 12 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
              <path d="M6 3 L6 15" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}

          {propItem?.id === 'crystal_ball' && (
            <g transform="translate(64, 56)">
              <ellipse cx="6" cy="11" rx="5" ry="3" fill="#64748b" />
              <circle cx="6" cy="5" r="5" fill="rgba(168, 85, 247, 0.5)" stroke="#c084fc" strokeWidth="1" className="animate-pulse" />
              <circle cx="4.5" cy="3.5" r="1.5" fill="#ffffff" opacity="0.8" />
            </g>
          )}

          {propItem?.id === 'holding_heart' && (
            <g transform="translate(64, 56)" className="animate-bounce">
              <path d="M6 3 C6 3, 4 0, 1.5 0 C-0.5 0, -1.5 2, -1.5 4 C-1.5 7, 3 11, 6 13 C9 11, 13.5 7, 13.5 4 C13.5 2, 12.5 0, 10.5 0 C8 0, 6 3, 6 3 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            </g>
          )}

          {propItem?.id === 'golden_key' && (
            <g transform="translate(68, 50) rotate(-30)">
              <circle cx="4" cy="4" r="4" fill="none" stroke="#facc15" strokeWidth="2" />
              <line x1="4" y1="8" x2="4" y2="20" stroke="#facc15" strokeWidth="2" />
              <line x1="4" y1="14" x2="8" y2="14" stroke="#facc15" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Dynamic Emoji Icon Tag */}
        {mood === 'coffee' && (
          <span className="absolute -top-1 -right-1 text-xs bg-zinc-900/90 rounded-full p-0.5 border border-zinc-700">☕</span>
        )}
        {mood === 'reading' && (
          <span className="absolute -top-1 -right-1 text-xs bg-zinc-900/90 rounded-full p-0.5 border border-zinc-700">📖</span>
        )}
        {mood === 'sleepy' && (
          <span className="absolute -top-2 right-0 text-[10px] text-indigo-400 font-bold animate-pulse">zzz...</span>
        )}
      </div>
    </div>
  );
}
