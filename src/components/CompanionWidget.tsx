import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronUp, Package } from 'lucide-react';
import { CompanionState, CompanionMood } from '../types';
import CompanionAvatar from './CompanionAvatar';
import { saveCompanionState } from '../utils/companionStorage';

interface CompanionWidgetProps {
  state: CompanionState;
  onUpdateState: (newState: CompanionState) => void;
  onOpenModal: () => void;
  isReadingOrWatching?: boolean;
  contentType?: 'manga' | 'anime';
}

export default function CompanionWidget({
  state,
  onUpdateState,
  onOpenModal,
  isReadingOrWatching = false,
  contentType = 'manga'
}: CompanionWidgetProps) {
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [xpToast, setXpToast] = useState<string | null>(null);
  const [speechText, setSpeechText] = useState('');
  const [ambientVisible, setAmbientVisible] = useState(false);
  const [ambientPhrase, setAmbientPhrase] = useState('');
  const [ambientMood, setAmbientMood] = useState<CompanionMood>('happy');

  // Ambient intervals for reading or watching sessions to avoid user distraction
  useEffect(() => {
    if (!isReadingOrWatching) {
      setAmbientVisible(false);
      return;
    }

    const mangaPhrases = [
      '📖 أقرأ معك بتركيز! هذه الصفحة مشوقة للغاية!',
      '✨ واو! الرسم في هذا الفصل مذهل وجاذب!',
      '🤫 هسس... الفصل يزداد حماساً وإثارة!',
      '☕ خذ رشفة من قهوتك، القراءة الطويلة ممتعة!',
      '📄 هل أقلب لك الصفحة التالية؟ 🤭',
      '🥱 يا لها من أحداث أسطورية في هذا الفصل!',
      '👀 أنظر إليك بابتسامة... واصل القراءة يا بطل!',
      '✨ لقد مر وقت... تذكر أن تريح عينيك قليلاً! 💚'
    ];

    const animePhrases = [
      '🍿 أتابع معك الأنمي! اللقطة القادمة ستكون أسطورية!',
      '🎬 واو، التحريك والقتال هنا من عالم آخر!',
      '🍿 يم، هل تعطيني بعض الفشار اللذيذ؟ 😋',
      '🔥 حماس لا يوصف! الموسيقى التصويرية رهيبة!',
      '🤩 البطل رائع جداً في هذا المشهد!',
      '🤫 ركز ركز... اللقطة الحاسمة قادمة!'
    ];

    const moods: CompanionMood[] = ['happy', 'excited', 'reading', 'coffee', 'sleepy'];

    const triggerAppearance = () => {
      const pool = contentType === 'manga' ? mangaPhrases : animePhrases;
      const randomPhrase = pool[Math.floor(Math.random() * pool.length)];
      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      
      setAmbientPhrase(randomPhrase);
      setAmbientMood(randomMood);
      setShowSpeechBubble(true);
      setAmbientVisible(true);

      // Dismiss and hide after 10 seconds of presence
      const hideTimeout = setTimeout(() => {
        setAmbientVisible(false);
      }, 10000);

      return hideTimeout;
    };

    // First appearance after 15 seconds
    const initialTimer = setTimeout(() => {
      triggerAppearance();
    }, 15000);

    // Periodic appearances every 45 seconds thereafter
    const interval = setInterval(() => {
      triggerAppearance();
    }, 45000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isReadingOrWatching, contentType]);

  if (!state.enabled || state.hidden) return null;

  // Determine active mood
  let mood: CompanionMood = 'happy';
  if (state.happiness < 40) {
    mood = 'sad';
  } else if (isReadingOrWatching) {
    mood = ambientMood;
  } else if (state.level % 2 === 0) {
    mood = 'coffee';
  }

  // Set Speech Text
  useEffect(() => {
    if (!state.hatched) {
      if (state.chaptersRead >= 3) {
        setSpeechText('✨ وجدت بيضة! انقر لفقس البيضة واختيار رفيقك...');
      } else {
        setSpeechText(`🥚 بيضة دافئة... اقرأ ${state.chaptersRead}/3 فصول لفقسها!`);
      }
    } else if (state.happiness < 40) {
      setSpeechText('🌙 أشعر ببعض الكسل، دعنا نقرأ فصلاً جديداً معاً! 📚');
    } else if (isReadingOrWatching) {
      setSpeechText(ambientPhrase);
    } else {
      const phrases = [
        `☕ يتذوق القهوة بينما تختار فصلاً جديداً...`,
        `✨ مستعد لمغامرة جديدة! (مستوى ${state.level})`,
        `💖 أنت أفضل رفيق قراءة!`,
        `📚 قرأنا ${state.chaptersRead} فصلاً معاً!`
      ];
      setSpeechText(phrases[state.level % phrases.length]);
    }
  }, [state.hatched, state.chaptersRead, state.happiness, isReadingOrWatching, contentType, state.level, ambientPhrase]);

  // Toggle Minimized State
  const handleToggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...state, minimized: !state.minimized };
    saveCompanionState(updated);
    onUpdateState(updated);
  };

  // MINIMIZED STATE VIEW (Tiny floating pill icon with ambient fade-out)
  if (state.minimized) {
    return (
      <div className={`fixed bottom-20 md:bottom-5 left-3 z-40 select-none transition-all duration-700 transform ${
        isReadingOrWatching 
          ? 'opacity-0 scale-75 -translate-x-12 pointer-events-none'
          : 'opacity-100 scale-100 translate-x-0 pointer-events-auto'
      }`}>
        <button
          onClick={onOpenModal}
          className="relative group flex items-center gap-1.5 bg-zinc-900/95 backdrop-blur-md text-zinc-200 border border-amber-500/40 rounded-full px-2.5 py-1 shadow-lg hover:bg-zinc-800 transition-all transform hover:scale-105"
        >
          <CompanionAvatar
            type={state.type}
            stage={state.stage}
            level={state.level}
            mood={mood}
            equipped={state.equipped}
            size="xs"
            animate={false}
          />
          <span className="text-[11px] font-bold text-amber-300 max-w-[80px] truncate">
            {state.hatched ? state.name : 'البيضة'}
          </span>
          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-1 py-0.5 rounded-full">
            Lv.{state.level}
          </span>
          
          <ChevronUp
            onClick={handleToggleMinimize}
            className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-100 ml-0.5"
          />

          {state.unopenedChests > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-950 font-black text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center animate-bounce">
              {state.unopenedChests}
            </span>
          )}
        </button>
      </div>
    );
  }

  // COMPACT EXPANDED FLOATING CORNER WIDGET (With beautiful sliding ambient transition)
  return (
    <div className={`fixed bottom-20 md:bottom-5 left-3 z-40 w-auto max-w-[210px] select-none transition-all duration-700 transform ${
      isReadingOrWatching 
        ? 'opacity-0 scale-75 -translate-x-12 pointer-events-none'
        : 'opacity-100 scale-100 translate-x-0 pointer-events-auto shadow-xl'
    }`}>
      
      {/* Floating XP / Cooldown Toast */}
      {xpToast && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg animate-bounce whitespace-nowrap z-20">
          {xpToast}
        </div>
      )}

      {/* SPEECH BUBBLE */}
      {showSpeechBubble && speechText && (
        <div className="relative mb-1.5 bg-zinc-900/95 border border-zinc-700/80 text-zinc-200 text-[10px] rounded-xl p-2 shadow-xl backdrop-blur-md animate-scale-up">
          <p className="leading-snug font-medium pr-3 text-right">{speechText}</p>
          <button
            onClick={() => setShowSpeechBubble(false)}
            className="absolute top-1 right-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="absolute -bottom-1 left-5 w-2 h-2 bg-zinc-900 border-r border-b border-zinc-700/80 rotate-45" />
        </div>
      )}

      {/* MAIN COMPACT CONTAINER */}
      <div 
        onClick={onOpenModal}
        className="group relative flex items-center gap-2 bg-zinc-900/95 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-2 shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02]"
      >
        {/* Compact Avatar Graphic */}
        <div className="relative shrink-0">
          <CompanionAvatar
            type={state.type}
            stage={state.stage}
            level={state.level}
            mood={mood}
            equipped={state.equipped}
            size="sm"
          />
          {state.unopenedChests > 0 && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black text-[9px] px-1 py-0.5 rounded-full shadow-md animate-bounce flex items-center gap-0.5">
              <Package className="w-2.5 h-2.5" />
              <span>{state.unopenedChests}</span>
            </div>
          )}
        </div>

        {/* Info & Progress */}
        <div className="flex-grow min-w-0 pr-0.5">
          <div className="flex items-center justify-between gap-1 mb-0.5 text-right">
            <h4 className="text-[11px] font-bold text-zinc-100 truncate flex-grow">
              {state.hatched ? state.name : 'بيضة غامضة 🥚'}
            </h4>
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded-full shrink-0">
              Lv.{state.level}
            </span>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden mb-1">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (state.xp / state.maxXp) * 100)}%` }}
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between text-[9px] text-zinc-400">
            <span className="font-mono text-[9px]">
              {state.xp}/{state.maxXp} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
