import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Calendar, Edit, Save, CheckCircle2, ShieldAlert, Sparkles, 
  RefreshCw, LogIn, Award, Heart, Lock, LogOut, Upload, FileText, Check, Database
} from 'lucide-react';
import { UserProfile } from '../types';
import { hasSupabase } from '../lib/supabase';

interface AccountViewProps {
  user: UserProfile | null;
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error: string | null }>;
  onRegister: (email: string, pass: string, name: string) => Promise<{ success: boolean; error: string | null }>;
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
  onLogin,
  onRegister,
  onLogout,
  onUpdateProfile
}: AccountViewProps) {
  // Navigation inside AccountView
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarUrl || presetAvatars[0]);
  
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio || '');
      setSelectedAvatar(user.avatarUrl);
    }
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (!emailInput.trim() || !passwordInput) {
      setFormError('يرجى ملء جميع الحقول المطلوبة');
      setSubmitting(false);
      return;
    }

    try {
      if (isRegistering) {
        const name = nameInput.trim() || emailInput.split('@')[0];
        const res = await onRegister(emailInput, passwordInput, name);
        if (!res.success) {
          setFormError(res.error);
        }
      } else {
        const res = await onLogin(emailInput, passwordInput);
        if (!res.success) {
          setFormError(res.error);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await onUpdateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl: selectedAvatar
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

  // Image upload handler converting to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError('حجم الصورة كبير جداً! يرجى اختيار صورة أقل من 2 ميغابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setSelectedAvatar(base64String);
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
              {isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </h1>
            <p className="text-xs text-zinc-400">
              {isRegistering 
                ? 'قم بإنشاء حسابك لحفظ مانهواتك المفضلة ومتابعة فصولك عبر السحاب.'
                : 'يرجى تسجيل الدخول للوصول إلى بروفايلك وسجل قراءاتك الشخصي.'}
            </p>
          </div>


          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold">
              {formError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">الاسم المستعار:</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="أدخل اسمك المفضل"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pr-10 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                  <User className="w-4 h-4 text-zinc-500 absolute right-3 top-3.5" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 block">البريد الإلكتروني:</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pr-10 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                />
                <Mail className="w-4 h-4 text-zinc-500 absolute right-3 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 block">كلمة المرور:</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pr-10 text-xs text-zinc-100 focus:outline-none focus:border-red-500 text-left"
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute right-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-red-950/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{isRegistering ? 'تسجيل حساب جديد' : 'تسجيل الدخول'}</span>
            </button>
          </form>

          {/* Toggle register */}
          <div className="text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setFormError(null);
              }}
              className="text-xs text-red-500 hover:text-red-400 font-bold transition-colors"
            >
              {isRegistering ? 'لديك حساب بالفعل؟ سجل دخولك الآن' : 'ليس لديك حساب؟ سجل حساباً جديداً مجاناً'}
            </button>
          </div>

        </div>
      ) : (
        
        // 2. LOGGED IN STATE (Profile Dashboard)
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Profile overview left side */}
          <div className="md:col-span-4 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/80 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <img 
                src={user.avatarUrl} 
                alt={user.displayName}
                className="w-24 h-24 rounded-full border-4 border-red-500 shadow-2xl object-cover bg-zinc-950"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-zinc-900 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-zinc-100 font-display flex items-center gap-1 justify-center">
                {user.displayName}
                <Sparkles className="w-4 h-4 text-red-500" />
              </h2>
              <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
            </div>

            {/* Badge role */}
            <div className="flex flex-col gap-1 w-full pt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border mx-auto ${
                user.role === 'admin' 
                  ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-md shadow-red-950/20' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}>
                {user.role === 'admin' ? 'مدير عام الموقع (مسؤول)' : 'عضو فضي'}
              </span>
            </div>

            {/* Meta info */}
            <div className="w-full border-t border-zinc-900/60 pt-4 space-y-2.5 text-right text-xs text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-zinc-600" />
                  تاريخ الانضمام:
                </span>
                <span className="font-bold text-zinc-300 font-mono">{user.joinedAt}</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="w-full py-2.5 px-4 mt-2 bg-zinc-950 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 border border-zinc-850 hover:border-red-900/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

          {/* Profile custom edit settings right side */}
          <div className="md:col-span-8 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/80 space-y-6">
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-red-500" />
                <h1 className="text-lg font-bold text-zinc-100 font-display">تخصيص الحساب وتعديل البيانات</h1>
              </div>
              
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  id="edit-profile-btn"
                >
                  تعديل الملف
                </button>
              )}
            </div>

            {/* Saved indicator Toast */}
            {showSavedToast && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم حفظ تعديلات حسابك ومزامنتها بنجاح مع السيرفر!</span>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold">
                {formError}
              </div>
            )}

            {/* Edit / View Form */}
            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">الاسم المعروض على الموقع:</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!editMode || submitting}
                    required
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-100 focus:outline-none focus:border-red-500 disabled:bg-zinc-950/20 disabled:text-zinc-400 disabled:cursor-not-allowed"
                    id="profile-displayName-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400">البريد الإلكتروني (غير قابل للتعديل):</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full bg-zinc-950/20 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">النبذة الشخصية (Bio):</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!editMode || submitting}
                  placeholder="مثال: قارئ مانهو شغوف أحب روايات وفنون القتال وزراعة الطاقة السماوية..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-100 h-24 focus:outline-none focus:border-red-500 disabled:bg-zinc-950/20 disabled:text-zinc-400 disabled:cursor-not-allowed resize-none"
                />
              </div>

              {/* Avatar Selector Gallery & Custom Image Upload */}
              {editMode && (
                <div className="space-y-4 pt-4 border-t border-zinc-900/60">
                  <span className="text-xs font-bold text-zinc-300 block flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-500" />
                    اختر صورتك الرمزية (أفاتار) أو ارفع صورة خاصة بك:
                  </span>
                  
                  {/* File Upload Input */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                      <img 
                        src={selectedAvatar} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="text-right w-full">
                      <p className="text-xs text-zinc-300 font-bold">رفع صورة بروفايل مخصصة</p>
                      <p className="text-[10px] text-zinc-500 mt-1">تنسيقات PNG, JPG أو WebP (الحد الأقصى 2 ميغابايت)</p>
                      
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={submitting}
                        className="mt-2.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>اختيار ملف الصورة</span>
                      </button>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Presets Grid */}
                  <div className="space-y-2">
                    <p className="text-[11px] text-zinc-500">أو اختر من الرمزيات الجاهزة:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {presetAvatars.map((avUrl, index) => (
                        <div 
                          key={index}
                          onClick={() => setSelectedAvatar(avUrl)}
                          className={`aspect-square rounded-full overflow-hidden border-3 cursor-pointer transition-all hover:scale-105 relative ${
                            selectedAvatar === avUrl 
                              ? 'border-red-500 ring-2 ring-red-500/20 shadow-lg shadow-red-950/25' 
                              : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <img 
                            src={avUrl} 
                            alt={`Avatar preset ${index}`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {selectedAvatar === avUrl && (
                            <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white bg-red-600 rounded-full" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Save actions */}
              {editMode && (
                <div className="flex gap-2 justify-end pt-4 border-t border-zinc-900/60">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setEditMode(false);
                      setDisplayName(user.displayName);
                      setBio(user.bio || '');
                      setSelectedAvatar(user.avatarUrl);
                      setFormError(null);
                    }}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 border border-zinc-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    إلغاء التعديل
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-md shadow-red-950/25 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              )}

            </form>

            {/* Supabase copyable SQL setup instruction panel if not configured */}
            {!hasSupabase && (
              <div className="p-4 bg-amber-600/10 border border-amber-500/20 rounded-xl space-y-3 pt-4">
                <h4 className="text-amber-400 text-xs font-bold flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  كيفية ربط تطبيقك بقاعدة بيانات Supabase حقيقية:
                </h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  هذا التطبيق مجهز بالكامل للربط المباشر مع Supabase. كل ما تحتاجه هو إدخال المتغيرات التالية في لوحة <b>Secrets</b> بـ AI Studio:
                </p>
                <div className="bg-black/40 p-2 border border-zinc-900 rounded text-[10px] font-mono text-zinc-300 space-y-1 select-all text-left">
                  <div>VITE_SUPABASE_URL="https://your-project.supabase.co"</div>
                  <div>VITE_SUPABASE_ANON_KEY="your-anon-key-here"</div>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  ثم قم بنسخ وتشغيل كود الـ SQL التالي في الـ <b>SQL Editor</b> الخاص بمشروعك في Supabase لإنشاء الجداول اللازمة فوراً:
                </p>
                <textarea
                  readOnly
                  value={`-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  bio text,
  role text default 'user',
  joined_at text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Reading History Table
create table public.reading_history (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  manhua_id text not null,
  manhua_title text not null,
  manhua_cover text not null,
  chapter_id text not null,
  chapter_title text not null,
  chapter_number numeric not null,
  last_read_time text not null,
  progress_percent numeric not null,
  page_index numeric not null
);

-- 3. Reading Lists Table
create table public.reading_lists (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  manhua_id text not null,
  manhua_title text not null,
  manhua_cover text not null,
  list_type text not null check (list_type in ('favorite', 'reading', 'plan')),
  added_at text not null,
  unique (user_id, manhua_id)
);`}
                  className="w-full bg-black/50 border border-zinc-900 text-[10px] font-mono text-zinc-400 h-28 rounded p-2 focus:outline-none focus:border-amber-600/50 resize-none select-all text-left"
                />
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
