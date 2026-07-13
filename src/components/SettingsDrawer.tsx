import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, BookOpen, Settings, LogIn, LogOut, RefreshCw, 
  ChevronRight, Sparkles, Moon, Sun, ZoomIn, ZoomOut, Palette, ShieldAlert
} from 'lucide-react';
import { UserProfile, ReadingHistoryItem, ReaderSettings } from '../types';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogin: (email: string, password: string) => Promise<any>;
  onSignup: (email: string, password: string) => Promise<any>;
  onResetPassword: (email: string) => Promise<any>;
  onLoginWithGoogle: () => Promise<any>;
  onLogout: () => void;
  history: ReadingHistoryItem[];
  onClearHistory: () => void;
  readerSettings: ReaderSettings;
  updateReaderSettings: (settings: Partial<ReaderSettings>) => void;
  onNavigate: (view: 'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists' | 'downloads') => void;
  currentView: string;
}

const colorPresets = [
  { name: 'أحمر قرمزي', value: '#ef4444' }, // Red-500
  { name: 'برتقالي مشتعل', value: '#f97316' }, // Orange-500
  { name: 'أزرق سماوي', value: '#3b82f6' }, // Blue-500
  { name: 'أخضر زمردي', value: '#10b981' }, // Emerald-500
  { name: 'بنفسجي ملكي', value: '#a855f7' }, // Purple-500
];

export default function SettingsDrawer({
  isOpen,
  onClose,
  user,
  onLogin,
  onSignup,
  onResetPassword,
  onLoginWithGoogle,
  onLogout,
  history,
  onClearHistory,
  readerSettings,
  updateReaderSettings,
  onNavigate,
  currentView
}: SettingsDrawerProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    setError(null);
    try {
      if (isSignup) {
        await onSignup(email, password);
      } else {
        await onLogin(email, password);
      }
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني في حقل البريد أولاً');
      return;
    }
    setError(null);
    try {
      await onResetPassword(email);
      setError('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 transition-opacity"
            id="drawer-backdrop"
          />

          {/* Drawer Curtain */}
          <motion.div
            initial={{ x: '100%' }} // Slides from the left or right depending on side, let's slide from right for RTL
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col overflow-hidden"
            id="settings-drawer-container"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-zinc-100 font-display">إعدادات التحكم والمزامنة</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                id="close-drawer-btn"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* SECTION 1: ACCOUNT (حساب) */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-bold border-b border-zinc-800 pb-2">
                  <User className="w-5 h-5" />
                  <span>1. الحساب المحلي للتطبيق</span>
                  {user && user.role === 'admin' && (
                    <span className="mr-auto text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      مسؤول الموقع
                    </span>
                  )}
                </div>

                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatarUrl || undefined} 
                        alt={user.displayName}
                        className="w-12 h-12 rounded-full border-2 border-red-500 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-bold text-zinc-100">{user.displayName}</h4>
                        <p className="text-[10px] text-zinc-400 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 inline-block">تخزين محلي (Offline)</p>
                      </div>
                    </div>
                    {user.bio && (
                      <p className="text-xs text-zinc-400 italic bg-zinc-950 p-2 rounded border border-zinc-900 leading-relaxed">
                        {user.bio}
                      </p>
                    )}
                    
                    <button
                      onClick={() => {
                        onNavigate('account');
                        onClose();
                      }}
                      className="w-full text-center py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-red-950/20 cursor-pointer"
                      id="go-profile-btn"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>تخصيص الحساب والنسخ الاحتياطية</span>
                    </button>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          onClose();
                        }}
                        className="w-full py-2 bg-red-950/40 hover:bg-red-950/60 border border-red-800/40 text-red-400 rounded-lg text-xs font-semibold transition-all mt-2 flex items-center justify-center gap-1 cursor-pointer"
                        id="go-admin-btn"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>لوحة الإدارة (مسؤول)</span>
                      </button>
                    )}
                  </div>
                ) : null}
              </div>

              {/* SECTION 2: READING HISTORY (سجل القراءة) */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold border-b border-zinc-800 pb-2 justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span>2. سجل قراءة المانهو</span>
                  </div>
                  {history.length > 0 && (
                    <button 
                      onClick={onClearHistory}
                      className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
                      id="clear-drawer-history-btn"
                    >
                      مسح الكل
                    </button>
                  )}
                </div>

                {history.length > 0 ? (
                  <div className="space-y-3">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {history.slice(0, 3).map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center gap-2 bg-zinc-950/80 p-2 rounded-lg border border-zinc-900 hover:border-zinc-800 transition-all cursor-pointer group"
                          onClick={() => {
                            onNavigate('reader');
                            // We will select the manhua and chapter in the App
                            onClose();
                          }}
                        >
                          <img 
                            src={item.manhuaCover || undefined} 
                            alt={item.manhuaTitle} 
                            className="w-10 h-14 rounded object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-zinc-100 truncate group-hover:text-red-400 transition-colors">
                              {item.manhuaTitle}
                            </h5>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                              {item.chapterTitle}
                            </p>
                            <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                className="bg-red-500 h-full" 
                                style={{ width: `${item.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => {
                        onNavigate('history');
                        onClose();
                      }}
                      className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      id="view-all-history-btn"
                    >
                      عرض السجل بالكامل
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-zinc-500 space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto text-zinc-700 stroke-1" />
                    <p className="text-xs">سجل القراءة فارغ حالياً.</p>
                    <p className="text-[10px] text-zinc-600">ابدأ بقراءة فصول مانهو لتتبع تاريخك!</p>
                  </div>
                )}
              </div>

              {/* SECTION 3: READER CONFIG & SYNC (تعديلات القراءة والمزامنة) */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-bold border-b border-zinc-800 pb-2">
                  <Settings className="w-5 h-5" />
                  <span>3. تعديلات القراءة والمزامنة</span>
                </div>

                {/* Reading Mode */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                    طريقة التصفح والعرض:
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    <button
                      onClick={() => updateReaderSettings({ readingMode: 'webtoon' })}
                      className={`py-1.5 px-2 rounded-md text-[10px] font-bold transition-all ${
                        readerSettings.readingMode === 'webtoon'
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      id="mode-webtoon-btn"
                    >
                      ويبتون (مستمر)
                    </button>
                    <button
                      onClick={() => updateReaderSettings({ readingMode: 'vertical' })}
                      className={`py-1.5 px-2 rounded-md text-[10px] font-bold transition-all ${
                        readerSettings.readingMode === 'vertical'
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      id="mode-vertical-btn"
                    >
                      عمودي صفحة/صفحة
                    </button>
                    <button
                      onClick={() => updateReaderSettings({ readingMode: 'horizontal' })}
                      className={`py-1.5 px-2 rounded-md text-[10px] font-bold transition-all ${
                        readerSettings.readingMode === 'horizontal'
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      id="mode-horizontal-btn"
                    >
                      أفقي (يمين-يسار)
                    </button>
                  </div>
                </div>

                {/* Night Mode Toggle */}
                <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2">
                    {readerSettings.isNightMode ? (
                      <Moon className="w-4 h-4 text-red-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-xs font-bold text-zinc-300">الوضع الليلي فائق العتمة</span>
                  </div>
                  <button
                    onClick={() => updateReaderSettings({ isNightMode: !readerSettings.isNightMode })}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                      readerSettings.isNightMode ? 'bg-red-600' : 'bg-zinc-700'
                    }`}
                    id="nightmode-toggle-btn"
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        readerSettings.isNightMode ? 'transform -translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Zoom Level */}
                <div className="space-y-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-300">تكبير وتصغير صور الفصول:</span>
                    <span className="text-red-400 font-mono font-bold">{readerSettings.zoomLevel}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateReaderSettings({ zoomLevel: Math.max(50, readerSettings.zoomLevel - 10) })}
                      className="p-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded hover:bg-zinc-800 transition-colors"
                      id="zoom-out-btn"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      step="10"
                      value={readerSettings.zoomLevel}
                      onChange={(e) => updateReaderSettings({ zoomLevel: parseInt(e.target.value) })}
                      className="flex-1 accent-red-500 bg-zinc-800 h-1 rounded"
                      id="zoom-slider"
                    />
                    <button
                      onClick={() => updateReaderSettings({ zoomLevel: Math.min(150, readerSettings.zoomLevel + 10) })}
                      className="p-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded hover:bg-zinc-800 transition-colors"
                      id="zoom-in-btn"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Button Color Preset Picker */}
                <div className="space-y-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-red-400" />
                    تخصيص ألوان أزرار التنقل والتصفح:
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => updateReaderSettings({ navColor: preset.value })}
                        className="w-6 h-6 rounded-full border relative transition-transform hover:scale-110 focus:outline-none"
                        style={{ 
                          backgroundColor: preset.value,
                          borderColor: readerSettings.navColor === preset.value ? '#ffffff' : 'rgba(0,0,0,0.3)',
                          borderWidth: readerSettings.navColor === preset.value ? '2px' : '1px'
                        }}
                        title={preset.name}
                        id={`btn-color-${preset.value}`}
                      >
                        {readerSettings.navColor === preset.value && (
                          <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Sync Toggle */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className={`w-4 h-4 text-red-400 ${isSyncing ? 'animate-spin' : ''}`} />
                      <div>
                        <span className="text-xs font-bold text-zinc-300 block">المزامنة التلقائية السحابية</span>
                        <span className="text-[9px] text-zinc-500 block">لمزامنة بياناتك وسجل قراءتك عبر كافة الأجهزة</span>
                      </div>
                    </div>
                    <button
                      onClick={() => updateReaderSettings({ autoSync: !readerSettings.autoSync })}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                        readerSettings.autoSync ? 'bg-red-600' : 'bg-zinc-700'
                      }`}
                      id="autosync-toggle-btn"
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          readerSettings.autoSync ? 'transform -translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {readerSettings.autoSync && (
                    <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        حالة المزامنة: نشطة وتلقائية
                      </span>
                      <button 
                        onClick={triggerSync}
                        disabled={isSyncing}
                        className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded transition-all flex items-center gap-1 active:scale-95"
                        id="sync-now-btn"
                      >
                        {isSyncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 text-center">
              <p className="text-[10px] text-zinc-500 font-display">
                عالم المانهو © 2026 • عش شغف المانهو بجودة خارقة
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
