import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Sparkles, Plus, Trash2, 
  Globe, Check, Settings, RefreshCw, Loader2,
  Megaphone, Lock, ExternalLink, Cloud, Save, KeyRound, Unlock
} from 'lucide-react';
import { NotificationItem } from '../types';
import { 
  getStoredAppwriteConfig, saveAppwriteConfig, 
  fetchAppwriteAds, createAppwriteAd, deleteAppwriteAd,
  AppwriteConfig, AppwriteAd 
} from '../lib/appwrite';

const SECRET_PIN = '28429625';

interface AdminViewProps {
  manhuas?: any[];
  onAddManhua?: (manhua: any) => void;
  onUpdateManhua?: (manhua: any) => void;
  onDeleteManhua?: (id: string) => void;
  onRestoreDefaults?: () => void;
  onClearAllManhuas?: () => void;
  sources?: any[];
  onAddSource?: (newSource: any) => void;
  onDeleteSource?: (sourceId: string) => void;
  onRestoreSources?: () => void;
  onAddNotification?: (notif: NotificationItem) => void;
}

export default function AdminView({ onAddNotification }: AdminViewProps) {
  // Authentication PIN State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_unlocked') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Tab: 'ads' | 'notifications' | 'appwrite'
  const [activeTab, setActiveTab] = useState<'ads' | 'notifications' | 'appwrite'>('ads');

  // Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Notifications Form State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifType, setNotifType] = useState<'site' | 'manga' | 'anime'>('site');
  const [notifLink, setNotifLink] = useState('');

  // Appwrite & Ads State
  const [appwriteConfig, setAppwriteConfig] = useState<AppwriteConfig>(getStoredAppwriteConfig);
  const [adsList, setAdsList] = useState<AppwriteAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);

  // New Ad Form State
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdImageUrl, setNewAdImageUrl] = useState('');
  const [newAdLinkUrl, setNewAdLinkUrl] = useState('');
  const [newAdPosition, setNewAdPosition] = useState<'top_banner' | 'reader_bottom' | 'sidebar' | 'popup'>('top_banner');

  const triggerToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === SECRET_PIN) {
      sessionStorage.setItem('admin_unlocked', 'true');
      setIsAuthenticated(true);
      setPinError(false);
      setPinInput('');
      triggerToast('تم فتح لوحة التحكم بنجاح!');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem('admin_unlocked');
    setIsAuthenticated(false);
  };

  // Load Ads from Appwrite / Local
  const loadAds = async () => {
    setLoadingAds(true);
    try {
      const ads = await fetchAppwriteAds();
      setAdsList(ads);
    } catch (err: any) {
      console.error('Failed to load ads:', err);
    } finally {
      setLoadingAds(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAds();
    }
  }, [isAuthenticated]);

  const handleSaveAppwriteConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveAppwriteConfig(appwriteConfig);
    triggerToast('تم حفظ إعدادات Appwrite بنجاح! جاري اختبار الاتصال...');
    loadAds();
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim() || !newAdImageUrl.trim()) {
      triggerError('يرجى كتابة عنوان الإعلان ووضع رابط الصورة.');
      return;
    }

    setLoadingAds(true);
    try {
      await createAppwriteAd({
        title: newAdTitle.trim(),
        imageUrl: newAdImageUrl.trim(),
        linkUrl: newAdLinkUrl.trim() || '#',
        position: newAdPosition,
        isActive: true
      });

      setNewAdTitle('');
      setNewAdImageUrl('');
      setNewAdLinkUrl('');
      triggerToast('تم نشر الإعلان بنجاح في Appwrite!');
      await loadAds();
    } catch (err: any) {
      triggerError(`فشل نشر الإعلان: ${err.message || 'خطأ في الشبكة'}`);
    } finally {
      setLoadingAds(false);
    }
  };

  const handleDeleteAd = async (id?: string) => {
    if (!id) return;
    setLoadingAds(true);
    try {
      await deleteAppwriteAd(id);
      triggerToast('تم حذف الإعلان بنجاح');
      await loadAds();
    } catch (err: any) {
      triggerError('حدث خطأ أثناء حذف الإعلان');
    } finally {
      setLoadingAds(false);
    }
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifContent.trim()) {
      triggerError('يرجى إدخال عنوان ومحتوى الإشعار.');
      return;
    }
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: notifTitle.trim(),
      type: notifType,
      content: notifContent.trim(),
      time: 'الآن',
      isNew: true,
      targetId: 'site',
      sourceUrl: notifLink.trim() || undefined
    };
    if (onAddNotification) {
      onAddNotification(newNotif);
    }
    setNotifTitle('');
    setNotifContent('');
    setNotifLink('');
    triggerToast('تم إرسال الإشعار لجميع مستخدمي الموقع بنجاح!');
  };

  // PIN Lock View
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-white">لوحة الإدارة والأدمن</h2>
            <p className="text-xs text-zinc-400">أدخل الرمز السري الخاص بالمدير للوصول للوحة التحكم</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                maxLength={10}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="أدخل الرمز السري هنا..."
                className={`w-full bg-zinc-950 border ${
                  pinError ? 'border-red-500' : 'border-zinc-800 focus:border-pink-500'
                } rounded-2xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white outline-none transition-all`}
                autoFocus
                required
              />
              <KeyRound className="w-5 h-5 text-zinc-500 absolute left-4 top-3.5" />
            </div>

            {pinError && (
              <p className="text-xs font-bold text-red-400 animate-bounce">
                الرمز السري غير صحيح! يرجى المحاولة مرة أخرى.
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-98"
            >
              <Unlock className="w-4 h-4" />
              <span>فتح لوحة التحكم</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Messages */}
      {successMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-950/80 border border-red-500/50 text-red-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-zinc-900/60 border border-zinc-850 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-right">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-950/50 border border-pink-800/40 rounded-2xl">
            <Sparkles className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <h1 className="text-base font-black text-white flex items-center gap-2">
              <span>لوحة تحكم الأدمن والرسائل</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                نشط
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              إدارة إعلانات Appwrite وإرسال إشعارات وتحديثات الموقع بمرونة وسهولة
            </p>
          </div>
        </div>

        <button
          onClick={handleLock}
          className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
        >
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span>قفل اللوحة</span>
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 bg-zinc-900/40 p-1.5 border border-zinc-850 rounded-2xl">
        <button
          onClick={() => setActiveTab('ads')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'ads'
              ? 'bg-pink-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>إدارة ونشر الإعلانات ({adsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>إرسال إشعار للمستخدمين</span>
        </button>

        <button
          onClick={() => setActiveTab('appwrite')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'appwrite'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>إعدادات Appwrite</span>
        </button>
      </div>

      {/* TAB 1: ADS MANAGEMENT */}
      {activeTab === 'ads' && (
        <div className="space-y-6 text-right">
          {/* Create New Ad Form */}
          <form onSubmit={handleCreateAd} className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 space-y-4">
            <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
              <span className="text-[10px] text-amber-400 font-mono bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                Appwrite Cloud Ads
              </span>
              <h3 className="text-xs font-black text-zinc-200 flex items-center gap-1.5">
                <span>نشر إعلان جديد</span>
                <Megaphone className="w-4 h-4 text-pink-500" />
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">عنوان الإعلان</label>
                <input
                  type="text"
                  value={newAdTitle}
                  onChange={e => setNewAdTitle(e.target.value)}
                  placeholder="مثال: خصم 50% على اشتراك VIP"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">موضع ظهور الإعلان</label>
                <select
                  value={newAdPosition}
                  onChange={e => setNewAdPosition(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="top_banner">شريط علوي (Top Banner)</option>
                  <option value="reader_bottom">أسفل صفحات قارئ الفصول (Reader Bottom)</option>
                  <option value="sidebar">القائمة الجانبية (Sidebar)</option>
                  <option value="popup">نافذة منبثقة (Popup Modal)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">رابط صورة الإعلان (Banner Image URL)</label>
                <input
                  type="url"
                  value={newAdImageUrl}
                  onChange={e => setNewAdImageUrl(e.target.value)}
                  placeholder="https://i.imgur.com/...png"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-pink-500 text-left"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">رابط التوجيه عند النقر (Target Link)</label>
                <input
                  type="text"
                  value={newAdLinkUrl}
                  onChange={e => setNewAdLinkUrl(e.target.value)}
                  placeholder="https://t.me/your_channel"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-pink-500 text-left"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loadingAds}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {loadingAds ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>نشر الإعلان الآن</span>
              </button>
            </div>
          </form>

          {/* Published Ads Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <button
                onClick={loadAds}
                disabled={loadingAds}
                className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${loadingAds ? 'animate-spin text-pink-500' : ''}`} />
                <span>تحديث القائمة</span>
              </button>
              <h3 className="text-xs font-black text-zinc-200">الإعلانات المنشورة حالياً ({adsList.length})</h3>
            </div>

            {adsList.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950/40 border border-zinc-850 rounded-2xl space-y-2">
                <Megaphone className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-bold text-zinc-400">لا توجد إعلانات منشورة حالياً</p>
                <p className="text-[10px] text-zinc-500">قم بتعبئة النموذج أعلاه لنشر إعلان حقيقي في التطبيق.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adsList.map((ad) => (
                  <div key={ad.$id || Math.random().toString()} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex gap-3.5 items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={ad.imageUrl} 
                        alt={ad.title} 
                        className="w-16 h-12 rounded-xl object-cover border border-zinc-800 shrink-0 bg-zinc-950" 
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <div className="min-w-0 text-right">
                        <h4 className="text-xs font-black text-zinc-100 truncate">{ad.title}</h4>
                        <span className="text-[9px] text-amber-400 font-mono inline-block px-1.5 py-0.5 bg-amber-950/40 border border-amber-800/40 rounded mt-1">
                          {ad.position}
                        </span>
                        {ad.linkUrl && ad.linkUrl !== '#' && (
                          <a 
                            href={ad.linkUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[9px] text-blue-400 hover:underline block truncate mt-0.5 font-mono dir-ltr text-right"
                          >
                            {ad.linkUrl}
                          </a>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAd(ad.$id)}
                      className="p-2 rounded-xl bg-red-950/40 text-red-400 hover:bg-red-600 hover:text-white transition-all border border-red-900/40 shrink-0 cursor-pointer"
                      title="حذف الإعلان"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SITE NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 text-right">
          <form onSubmit={handleSendNotification} className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 space-y-4">
            <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
              <span className="text-[10px] text-purple-400 font-mono bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded-full">
                البث المباشر
              </span>
              <h3 className="text-xs font-black text-zinc-200 flex items-center gap-1.5">
                <span>إرسال إشعار وتحديث للمستخدمين</span>
                <Globe className="w-4 h-4 text-purple-400" />
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">عنوان الإشعار</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  placeholder="مثال: تم إضافة خوادم مشاهدة سريعة جديدة"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">تبويب الإشعار</label>
                <select
                  value={notifType}
                  onChange={e => setNotifType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="site">إشعار موقع (Site)</option>
                  <option value="manga">إشعار مانهو (Manga)</option>
                  <option value="anime">إشعار أنمي (Anime)</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] text-zinc-400 block font-bold">محتوى الإشعار والتفاصيل</label>
                <textarea
                  value={notifContent}
                  onChange={e => setNotifContent(e.target.value)}
                  placeholder="اكتب رسالتك للمستخدمين هنا..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-purple-500 resize-none"
                  required
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] text-zinc-400 block font-bold">رابط التوجيه عند النقر (اختياري)</label>
                <input
                  type="text"
                  value={notifLink}
                  onChange={e => setNotifLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-purple-500 text-left"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إرسال الإشعار لجميع المستلمين</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: APPWRITE CONFIG */}
      {activeTab === 'appwrite' && (
        <div className="space-y-6 text-right">
          <form onSubmit={handleSaveAppwriteConfig} className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Appwrite REST SDK v1</span>
              </span>
              <h3 className="text-xs font-black text-zinc-200 flex items-center gap-1.5">
                <span>إعدادات قاعدة بيانات Appwrite</span>
                <Settings className="w-4 h-4 text-blue-400" />
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">رابط الخادم (Appwrite Endpoint)</label>
                <input
                  type="url"
                  value={appwriteConfig.endpoint}
                  onChange={e => setAppwriteConfig({ ...appwriteConfig, endpoint: e.target.value })}
                  placeholder="https://cloud.appwrite.io/v1"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-blue-500 text-left"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">معرّف المشروع (Project ID)</label>
                <input
                  type="text"
                  value={appwriteConfig.projectId}
                  onChange={e => setAppwriteConfig({ ...appwriteConfig, projectId: e.target.value })}
                  placeholder="6a61447d..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-blue-500 text-left"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">معرّف قاعدة البيانات (Database ID)</label>
                <input
                  type="text"
                  value={appwriteConfig.databaseId}
                  onChange={e => setAppwriteConfig({ ...appwriteConfig, databaseId: e.target.value })}
                  placeholder="6a6149de..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-blue-500 text-left"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 block font-bold">معرّف مجموعة الإعلانات (Ads Collection ID)</label>
                <input
                  type="text"
                  value={appwriteConfig.adsCollectionId}
                  onChange={e => setAppwriteConfig({ ...appwriteConfig, adsCollectionId: e.target.value })}
                  placeholder="6a614a50..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-blue-500 text-left"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وإجراء اختبار الاتصال</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
