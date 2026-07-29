import React, { useState, useEffect } from 'react';
import { 
  X, Heart, Sparkles, Package, Settings, 
  Smile, Check, Lock, Gift, Edit3, Zap 
} from 'lucide-react';
import { CompanionState, CompanionType, CosmeticItem } from '../types';
import CompanionAvatar from './CompanionAvatar';
import { 
  ALL_COSMETIC_ITEMS, COMPANION_NAMES, COMPANION_DESCRIPTIONS, 
  hatchCompanion, openLootChest, equipCosmetic, changeCompanionType,
  resetCompanionState, saveCompanionState, requestResetCompanion, cancelResetCompanion 
} from '../utils/companionStorage';

interface CompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CompanionState;
  onUpdateState: (newState: CompanionState) => void;
}

export default function CompanionModal({
  isOpen,
  onClose,
  state,
  onUpdateState
}: CompanionModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'chests' | 'wardrobe' | 'settings'>('overview');
  const [selectedType, setSelectedType] = useState<CompanionType>('wolf');
  const [customName, setCustomName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState(state.name);

  // Toast / Feedback message inside modal
  const [careToastMessage, setCareToastMessage] = useState<string | null>(null);

  // Chest Opening Animation State
  const [isOpeningChest, setIsOpeningChest] = useState(false);
  const [openedItem, setOpenedItem] = useState<CosmeticItem | null>(null);

  // Wardrobe Category Filter
  const [wardrobeCategory, setWardrobeCategory] = useState<'hat' | 'prop' | 'aura' | 'background'>('hat');

  // Reset Countdown State
  const [resetTimeLeft, setResetTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!state.resetRequestedAt) {
      setResetTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const requestedAt = new Date(state.resetRequestedAt!).getTime();
      const threeHoursInMs = 3 * 60 * 60 * 1000;
      const elapsed = Date.now() - requestedAt;
      const remaining = Math.max(0, Math.ceil((threeHoursInMs - elapsed) / 1000));
      setResetTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [state.resetRequestedAt]);

  const formatResetTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const parts = [];
    if (h > 0) parts.push(`${h} ساعة`);
    if (m > 0) parts.push(`${m} دقيقة`);
    parts.push(`${s} ثانية`);
    return parts.join(' و ');
  };

  if (!isOpen) return null;

  // 1. EGG HATCHING VIEW (If not hatched)
  const isReadyToHatch = state.chaptersRead >= 3 || state.hatched;

  const handleHatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newState = hatchCompanion(selectedType, customName || COMPANION_NAMES[selectedType]);
    onUpdateState(newState);
    setActiveTab('overview');
  };

  // Open Chest Action
  const handleOpenChest = () => {
    if (state.unopenedChests <= 0 || isOpeningChest) return;
    setIsOpeningChest(true);
    setOpenedItem(null);

    setTimeout(() => {
      const { newState, item } = openLootChest();
      onUpdateState(newState);
      setOpenedItem(item);
      setIsOpeningChest(false);
    }, 1200);
  };

  // Equip Item
  const handleEquipToggle = (category: 'hat' | 'prop' | 'aura' | 'background', itemId: string) => {
    const isCurrentlyEquipped = state.equipped[category] === itemId;
    const newState = equipCosmetic(category, isCurrentlyEquipped ? null : itemId);
    onUpdateState(newState);
  };

  // Save Name Change
  const handleSaveName = () => {
    if (!newNameInput.trim()) return;
    const updated = { ...state, name: newNameInput.trim() };
    saveCompanionState(updated);
    onUpdateState(updated);
    setEditingName(false);
  };

  // Initiate reset request
  const handleRequestReset = () => {
    const updated = requestResetCompanion();
    onUpdateState(updated);
  };

  // Cancel reset request
  const handleCancelReset = () => {
    const updated = cancelResetCompanion();
    onUpdateState(updated);
  };

  // Perform actual reset
  const handleExecuteReset = () => {
    if (confirm('هل أنت متأكد من رغبتك في إعادة ضبط الرفيق والبدء من الصفر؟ سيتم حذف جميع مستويات الرفيق الحالي والبدء ببيضة جديدة.')) {
      const resetState = resetCompanionState();
      onUpdateState(resetState);
      setActiveTab('overview');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>رفيق القراءة</span>
                {state.hatched && (
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    مستوى {state.level}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">رفيقك اللطيف للتطور والمكافآت التجميلية أثناء القراءة</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* EGG UNHATCHED SETUP STEP */}
        {!state.hatched ? (
          <div className="p-6 overflow-y-auto text-center space-y-6">
            <div className="py-4">
              <CompanionAvatar type={selectedType} stage="egg" level={state.level} size="xl" className="mx-auto" />
              <h4 className="text-xl font-bold text-amber-300 mt-4 mb-2">✨ بيضة القراءة الغامضة</h4>
              <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                {isReadyToHatch
                  ? 'لقد قرأت الفصول المطلوبة ونبضت البيضة بالدفء! اختر رفيقك المفضل وسّمه لبدء رحلتكما معاً.'
                  : `اقرأ 3 فصول من المانهو لفقس البيضة! (قرأت ${state.chaptersRead}/3) أو يمكنك التفقيس المباشر الآن.`}
              </p>
            </div>

            {/* Pick Companion Type */}
            <form onSubmit={handleHatchSubmit} className="space-y-6 max-w-lg mx-auto text-right">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-3">اختر نوع الرفيق:</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['wolf', 'dragon', 'fox', 'spirit'] as CompanionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedType(t)}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-3 ${
                        selectedType === t
                          ? 'border-amber-500 bg-amber-500/10 text-zinc-100 shadow-md'
                          : 'border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <CompanionAvatar type={t} stage="baby" level={1} size="sm" animate={false} />
                      <div>
                        <div className="text-sm font-bold text-zinc-200">{COMPANION_NAMES[t]}</div>
                        <div className="text-[11px] text-zinc-400 line-clamp-1">{COMPANION_DESCRIPTIONS[t]}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-2">اسم الرفيق:</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={COMPANION_NAMES[selectedType]}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Hatch */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-bold py-3 px-6 rounded-2xl shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="w-5 h-5" />
                <span>فقس البيضة وبدء الرحلة</span>
              </button>
            </form>
          </div>
        ) : (
          /* HATCHED COMPANION FULL MANAGEMENT TABS */
          <>
            {/* Nav Tabs */}
            <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none border-b border-zinc-800 bg-zinc-950/30 px-4 sm:px-6 gap-1 md:gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`shrink-0 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Smile className="w-4 h-4" />
                <span>الحالة والعناية</span>
              </button>

              <button
                onClick={() => setActiveTab('chests')}
                className={`relative shrink-0 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'chests'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>صناديق المكافآت</span>
                {state.unopenedChests > 0 && (
                  <span className="bg-amber-500 text-zinc-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {state.unopenedChests}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('wardrobe')}
                className={`shrink-0 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'wardrobe'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>الخزانة والتجميل</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`shrink-0 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'settings'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>الإعدادات</span>
              </button>
            </div>

            {/* TAB CONTENT STAGE */}
            <div className="p-6 overflow-y-auto flex-grow">
              
              {/* TAB 1: OVERVIEW & CARE */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* Companion Showcase Card */}
                  <div className="relative bg-gradient-to-b from-zinc-800/80 to-zinc-900 border border-zinc-700/60 rounded-3xl p-6 text-center shadow-xl overflow-hidden">
                    
                    {/* Level Badge */}
                    <div className="absolute top-4 right-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs px-3 py-1 rounded-full">
                      مستوى {state.level} ({state.stage === 'baby' ? 'صغير' : state.stage === 'teen' ? 'يافع' : 'أسطوري متطور'})
                    </div>

                    {/* Avatar Display */}
                    <div className="py-2">
                      <CompanionAvatar
                        type={state.type}
                        stage={state.stage}
                        level={state.level}
                        mood={state.happiness < 40 ? 'sad' : 'happy'}
                        equipped={state.equipped}
                        size="xl"
                        className="mx-auto"
                      />
                    </div>

                    {/* Name & Rename */}
                    <div className="mt-2 flex items-center justify-center gap-2">
                      {editingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newNameInput}
                            onChange={(e) => setNewNameInput(e.target.value)}
                            className="bg-zinc-950 border border-amber-500/50 text-sm font-bold text-center px-3 py-1 rounded-xl text-zinc-100"
                          />
                          <button
                            onClick={handleSaveName}
                            className="bg-amber-500 text-zinc-950 px-3 py-1 rounded-xl text-xs font-bold"
                          >
                            حفظ
                          </button>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-xl font-bold text-zinc-100">{state.name}</h2>
                          <button
                            onClick={() => {
                              setNewNameInput(state.name);
                              setEditingName(true);
                            }}
                            className="text-zinc-500 hover:text-amber-400 p-1 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                      {COMPANION_DESCRIPTIONS[state.type]}
                    </p>

                    {/* Quick Companion Type Selector */}
                    <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-zinc-400 ml-1">تغيير الشكل:</span>
                      {(['wolf', 'dragon', 'fox', 'spirit'] as CompanionType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            const newState = changeCompanionType(t);
                            onUpdateState(newState);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                            state.type === t
                              ? 'bg-amber-500 text-zinc-950 shadow-md'
                              : 'bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <span>{t === 'wolf' ? '🐺' : t === 'dragon' ? '🐉' : t === 'fox' ? '🦊' : '🔮'}</span>
                          <span>{COMPANION_NAMES[t]}</span>
                        </button>
                      ))}
                    </div>

                    {/* Care Toast inside Modal */}
                    {careToastMessage && (
                      <div className="mt-3 inline-block bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full animate-bounce">
                        {careToastMessage}
                      </div>
                    )}

                    {/* Happiness & XP Bars */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-right">
                      
                      {/* Happiness Bar */}
                      <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-bold text-rose-400 flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-rose-400" /> السعادة والاهتمام
                          </span>
                          <span className="font-mono text-zinc-300">{state.happiness}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-rose-500 to-pink-400 h-full transition-all duration-500"
                            style={{ width: `${state.happiness}%` }}
                          />
                        </div>
                      </div>

                      {/* XP Bar */}
                      <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 fill-amber-400" /> خبرة المستوى
                          </span>
                          <span className="font-mono text-zinc-300">{state.xp}/{state.maxXp} XP</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (state.xp / state.maxXp) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reading Activity Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 text-center">
                      <div className="text-2xl font-black text-amber-400 mb-1">{state.chaptersRead}</div>
                      <div className="text-xs text-zinc-400 font-medium">فصل مانهو/مانجا تم قراءته</div>
                    </div>
                    <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 text-center">
                      <div className="text-2xl font-black text-amber-400 mb-1">{state.episodesWatched}</div>
                      <div className="text-xs text-zinc-400 font-medium">حلقة أنمي تم مشاهدتها</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CHESTS & REWARDS */}
              {activeTab === 'chests' && (
                <div className="space-y-6 text-center">
                  
                  {/* Chest Stage Box */}
                  <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="text-5xl my-4 animate-bounce">🎁</div>
                    <h3 className="text-lg font-bold text-amber-300 mb-1">صناديق المكافآت التجميلية</h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
                      تحصل على صندوق تجميلي جديد كل 100 فصل تقرؤه! لا تمنح أي تفوق تكتيكي لحفظ عدالة التجربة.
                    </p>

                    {/* Unopened Chests Counter */}
                    <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-2xl text-sm font-bold mb-6">
                      <Package className="w-4 h-4" />
                      <span>الصناديق الجاهزة للفتح: {state.unopenedChests}</span>
                    </div>

                    {/* Open Chest Button */}
                    <div>
                      <button
                        onClick={handleOpenChest}
                        disabled={state.unopenedChests <= 0 || isOpeningChest}
                        className={`w-full max-w-xs mx-auto py-3.5 px-6 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                          state.unopenedChests > 0 && !isOpeningChest
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 hover:brightness-110 active:scale-95'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Gift className="w-5 h-5" />
                        <span>{isOpeningChest ? 'جاري فتح الصندوق...' : 'فتح صندوق مكافأة الآن'}</span>
                      </button>
                    </div>

                    {/* Unlocked Reward Reveal Popup */}
                    {openedItem && (
                      <div className="mt-6 p-4 bg-zinc-900/90 border border-amber-500 rounded-2xl animate-scale-up text-center">
                        <span className="text-xs text-amber-400 font-bold block mb-1">✨ مبروك! حصلت على عنصر تجميلي جديد:</span>
                        <div className="text-3xl my-2">{openedItem.icon}</div>
                        <h4 className="text-sm font-bold text-zinc-100">{openedItem.name}</h4>
                        <p className="text-xs text-zinc-400 mt-1">{openedItem.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Chapter Milestone Tracker */}
                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 text-right">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-bold text-zinc-200">التقدم نحو الصندوق التالي:</span>
                      <span className="text-amber-400 font-mono font-bold">
                        {state.chaptersRead % 100} / 100 فصل
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500"
                        style={{ width: `${(state.chaptersRead % 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WARDROBE & COSMETICS */}
              {activeTab === 'wardrobe' && (
                <div className="space-y-6">
                  
                  {/* Category Selector */}
                  <div className="flex gap-2 border-b border-zinc-800 pb-3 overflow-x-auto scrollbar-none">
                    {[
                      { id: 'hat', label: 'القبعات', icon: '🧢' },
                      { id: 'prop', label: 'الإكسسوارات', icon: '⚔️' },
                      { id: 'aura', label: 'المؤثرات والهالات', icon: '✨' },
                      { id: 'background', label: 'الخلفيات', icon: '🖼️' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setWardrobeCategory(cat.id as any)}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          wardrobeCategory === cat.id
                            ? 'bg-amber-500 text-zinc-950'
                            : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Item Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ALL_COSMETIC_ITEMS.filter((i) => i.category === wardrobeCategory).map((item) => {
                      const isUnlocked = state.inventory.includes(item.id);
                      const isEquipped = state.equipped[wardrobeCategory] === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => isUnlocked && handleEquipToggle(wardrobeCategory, item.id)}
                          className={`relative p-3 rounded-2xl border transition-all text-right ${
                            isUnlocked
                              ? isEquipped
                                ? 'border-amber-500 bg-amber-500/10 shadow-md cursor-pointer'
                                : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-600 cursor-pointer'
                              : 'border-zinc-900 bg-zinc-950/40 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{item.icon}</span>
                            {isEquipped ? (
                              <span className="bg-amber-500 text-zinc-950 p-0.5 rounded-full">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : !isUnlocked && (
                              <Lock className="w-3.5 h-3.5 text-zinc-500" />
                            )}
                          </div>

                          <h5 className="text-xs font-bold text-zinc-200 mb-0.5">{item.name}</h5>
                          <p className="text-[10px] text-zinc-500 line-clamp-1">{item.description}</p>

                          {isUnlocked && (
                            <span className="mt-2 block text-[10px] font-semibold text-amber-400">
                              {isEquipped ? 'مجهز حالياً' : 'انقر للتجهيز'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6 text-right">
                  
                  {/* Enable / Disable Toggle */}
                  <div className="flex items-center justify-between p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">تفعيل رفيق القراءة</h4>
                      <p className="text-xs text-zinc-400">إظهار الرفيق العائم وتلقي التطور والجوائز التجميلية</p>
                    </div>
                    <button
                      onClick={() => {
                        const updated = { ...state, enabled: !state.enabled };
                        saveCompanionState(updated);
                        onUpdateState(updated);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                        state.enabled ? 'bg-amber-500' : 'bg-zinc-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform ${
                          state.enabled ? 'translate-x-0' : '-translate-x-6'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reset Companion */}
                  <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                    <h4 className="text-sm font-bold text-rose-300 mb-1">طلب إعادة ضبط الرفيق والبدء من الصفر</h4>
                    
                    {state.resetRequestedAt ? (
                      resetTimeLeft > 0 ? (
                        <div className="space-y-3 mt-2">
                          <p className="text-xs text-zinc-300">
                            ⏳ تم تقديم طلب إعادة الضبط بنجاح لتجنب الضغط بالخطأ. يتوجب عليك الانتظار لمدة <span className="text-amber-400 font-bold">3 ساعات</span> حتى يتم تنشيط خيار إعادة الضبط النهائي.
                          </p>
                          <div className="p-3 bg-zinc-950/80 border border-amber-500/30 rounded-xl text-center">
                            <span className="text-xs text-zinc-400 block mb-1">الوقت المتبقي لإمكانية إعادة الضبط:</span>
                            <span className="text-sm font-mono font-bold text-amber-400">{formatResetTime(resetTimeLeft)}</span>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={handleCancelReset}
                              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                            >
                              إلغاء طلب إعادة الضبط والاحتفاظ بالرفيق 💚
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 mt-2 animate-pulse">
                          <p className="text-xs text-emerald-400 font-bold">
                            ✅ انقضت فترة الانتظار (3 ساعات)! خيار إعادة ضبط الرفيق جاهز الآن للاستخدام.
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            يمكنك الآن إتمام إعادة تعيين الرفيق والبدء من الصفر، أو إلغاء الطلب والاحتفاظ بالرفيق الحالي كما هو.
                          </p>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={handleCancelReset}
                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                            >
                              إلغاء الطلب والتراجع
                            </button>
                            <button
                              onClick={handleExecuteReset}
                              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-rose-500/20"
                            >
                              إتمام إعادة ضبط الرفيق والعودة للصفر ⚠️
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="space-y-3 mt-2">
                        <p className="text-xs text-zinc-400">
                          لتجنب الضغط بالخطأ، يتطلب هذا الإجراء تقديم طلب مسبق والانتظار لمدة <span className="text-amber-400 font-bold">3 ساعات</span> قبل تنفيذه. يمكنك إلغاء الطلب في أي لحظة خلال فترة الانتظار والاحتفاظ بتقدمك.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={handleExecuteReset}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-md flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>إعادة ضبط فورية إلى بيضة وتفقيس جديد 🐣</span>
                          </button>
                          <button
                            onClick={handleRequestReset}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                          >
                            طلب آمن (انتظار 3 ساعات)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
