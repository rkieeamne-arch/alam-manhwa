import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Calendar, Edit, Save, CheckCircle2, ShieldAlert, Sparkles, 
  RefreshCw, LogIn, Award, Heart, Lock, LogOut, Upload, FileText, Check, Database, ArrowLeft, MoreVertical
} from 'lucide-react';
import { UserProfile, ReadingHistoryItem } from '../types';
import { signInWithGoogle } from '../lib/firebaseAuth';

interface AccountViewProps {
  user: UserProfile | null;
  history: ReadingHistoryItem[];
  onLogout: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<{ success: boolean; error: string | null }>;
}

// Preset cool anime/manhua avatar images
const presetAvatars = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', // cool girl
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', // cool guy
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', // retro portrait
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', // cartoon aesthetic
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', // dark jacket guy
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80', // outdoor portrait
];

export default function AccountView({
  user,
  history = [],
  onLogout,
  onUpdateProfile,
}: AccountViewProps) {
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarUrl || presetAvatars[0]);
  const [selectedBanner, setSelectedBanner] = useState(user?.bannerUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&auto=format&fit=crop&q=80');
  
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio || '');
      setSelectedAvatar(user.avatarUrl);
      setSelectedBanner(user.bannerUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&auto=format&fit=crop&q=80');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await onUpdateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl: selectedAvatar,
        bannerUrl: selectedBanner
      });

      if (res.success) {
        setEditMode(false);
        setShowSavedToast(true);
        setTimeout(() => {
          setShowSavedToast(false);
        }, 3000);
      } else {
        setFormError(res.error);
      }
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ الملف الشخصي');
    } finally {
      setSubmitting(false);
    }
  };

  // Image upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError('حجم الصورة كبير جداً! يرجى اختيار صورة أقل من 2 ميغابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      if (type === 'avatar') setSelectedAvatar(base64String);
      else setSelectedBanner(base64String);
      setFormError(null);
    };
    reader.onerror = () => {
      setFormError('حدث خطأ أثناء قراءة ملف الصورة');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4 sm:px-6" id="account-view-container">
      
      {/* 1. NOT LOGGED IN STATE */}
      {!user ? (
        <div className="max-w-md mx-auto bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-red-600/10 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-inner">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-zinc-100 font-display">
              تسجيل الدخول
            </h1>
            <p className="text-xs text-zinc-400">
              يرجى تسجيل الدخول باستخدام حساب جوجل للوصول إلى بروفايلك وسجل قراءاتك الشخصي.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold">
              {formError}
            </div>
          )}

          <button
            onClick={async () => {
              setSubmitting(true);
              setFormError(null);
              try {
                await signInWithGoogle();
              } catch (err: any) {
                setFormError(err.message || 'فشل تسجيل الدخول باستخدام جوجل');
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="w-full py-3.5 bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>تسجيل الدخول باستخدام جوجل</span>
          </button>
        </div>
      ) : (
        
        // 2. LOGGED IN STATE (Profile Dashboard)
        <div className="bg-zinc-950 min-h-screen text-zinc-100 pb-20">
            {/* Banner & Header Actions */}
          <div className="relative h-48 bg-zinc-800">
            <img 
              src={selectedBanner || undefined} 
              alt="Banner" 
              className="w-full h-full object-cover opacity-60"
            />
            {editMode && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer">
                <Upload className="w-8 h-8 text-white" />
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} className="hidden" />
              </label>
            )}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <button onClick={() => window.history.back()} className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Avatar & Info Section */}
          <div className="px-6 relative">
            <div className="absolute -top-12 left-6">
              <div className="relative">
                <img 
                  src={selectedAvatar || undefined} 
                  alt={displayName}
                  className="w-24 h-24 rounded-full border-4 border-zinc-950 shadow-xl object-cover"
                />
                {editMode && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer">
                    <Upload className="w-6 h-6 text-white" />
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-20">
               <button 
                 type={editMode ? "submit" : "button"}
                 form={editMode ? "profile-form" : undefined}
                 onClick={() => !editMode && setEditMode(true)}
                 className="px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-900/20"
               >
                  {editMode ? 'حفظ التعديلات' : 'تعديل الملف الشخصي'}
               </button>
               {editMode && (
                 <button 
                   type="button"
                   onClick={() => setEditMode(false)}
                   className="ml-2 px-6 py-2 bg-zinc-800 text-zinc-300 rounded-full text-sm font-bold hover:bg-zinc-700 transition"
                 >
                   إلغاء
                 </button>
               )}
            </div>

            <div className="pt-16">
            {editMode ? (
              <form id="profile-form" onSubmit={handleSaveProfile} className="mt-8 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">الاسم المستعار:</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">السيرة الذاتية:</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 h-24" />
                 </div>
              </form>
            ) : (
              <div className="mt-4 space-y-2">
                <h2 className="text-2xl font-black flex items-center gap-2">
                  {user.displayName}
                </h2>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>الخبرة (XP)</span>
                    <span>{user.xp ?? 0} / {user.totalXp ?? 0}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(100, ((user.xp ?? 0) / (user.totalXp || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-zinc-400 font-mono mt-4">@{user.displayName.replace(/\s+/g, '').toLowerCase()}</p>
                <p className="text-zinc-200 mt-2 leading-relaxed">
                  {user.bio || 'لم يتم إضافة سيرة ذاتية بعد.'}
                </p>
              </div>
            )}
            </div>

            <div className="mt-6 flex gap-4 text-zinc-500 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">👀</span> إجمالي سجل القراءات: {history.length}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">🗓️</span> انضمّ في {user.joinedAt}
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="px-6 mt-8">
             <p className="text-center text-zinc-500 mt-4 text-sm">عدد سجلات القراءة: {history.length}</p>
          </div>
        </div>
      )}

    </div>
  );
}
