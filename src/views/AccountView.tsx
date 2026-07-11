import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Calendar, Edit, Save, CheckCircle2, ShieldAlert, Sparkles, 
  RefreshCw, LogIn, Award, Heart, Lock, LogOut, Upload, FileText, Check, Database, ArrowLeft, MoreVertical
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
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
        <div className="bg-zinc-950 min-h-screen text-zinc-100 pb-20">
          {/* Banner & Header Actions */}
          <div className="relative h-48 bg-zinc-800">
            <img 
              src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&auto=format&fit=crop&q=80" 
              alt="Banner" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <button onClick={() => window.history.back()} className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Avatar & Info Section */}
          <div className="px-6 relative">
            <div className="absolute -top-12 left-6">
              <img 
                src={user.avatarUrl} 
                alt={user.displayName}
                className="w-24 h-24 rounded-full border-4 border-zinc-950 shadow-xl object-cover"
              />
            </div>
            
            <div className="flex justify-end pt-4">
               <button className="px-4 py-1.5 border border-zinc-700 rounded-full text-sm font-semibold hover:bg-zinc-800 transition">
                  تعديل الملف الشخصي
               </button>
            </div>

            <div className="mt-4 space-y-2">
              <h2 className="text-2xl font-black flex items-center gap-2">
                {user.displayName} 🇹🇳
              </h2>
              <p className="text-zinc-400 font-mono">@{user.displayName.replace(/\s+/g, '').toLowerCase()}</p>
              <p className="text-zinc-200 mt-4 leading-relaxed">
                {user.bio || 'مترجم روايات علي موقع مجرة روايات الحاكم الغامض فوق الضباب الاحمق الذي لا ينتمي إلى هذه الحقبه شاهد على تاريخ ممتد ملك الاصفر و الأسود'}
              </p>
            </div>

            <div className="mt-4 flex gap-4 text-zinc-500 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">📍</span> تونس
              </div>
              <div className="flex items-center gap-1">
                <span className="text-zinc-400">📅</span> تاريخ الميلاد 24 يونيو 2006
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1 text-zinc-500 text-sm">
                <span className="text-zinc-400">🗓️</span> انضمّ في مايو 2021
            </div>
          </div>

          {/* Chart Section */}
          <div className="px-6 mt-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'أنمياتي المفضلة', value: 70 },
                      { name: 'اشاهدها حاليا', value: 7 },
                      { name: 'ارغب بمشاهدتها', value: 573 },
                      { name: 'تم مشاهدتها', value: 424 },
                      { name: 'اكملها لاحقا', value: 94 },
                      { name: 'لا ارغب بمشاهدتها', value: 11 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      '#60a5fa', '#22c55e', '#ef4444', '#8b5cf6', '#a855f7', '#d97706'
                    ].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mt-4 text-zinc-300">
              {[
                { name: 'أنمياتي المفضلة', color: '#60a5fa' },
                { name: 'اشاهدها حاليا', color: '#22c55e' },
                { name: 'ارغب بمشاهدتها', color: '#ef4444' },
                { name: 'تم مشاهدتها', color: '#8b5cf6' },
                { name: 'اكملها لاحقا', color: '#a855f7' },
                { name: 'لا ارغب بمشاهدتها', color: '#d97706' },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
             <p className="text-center text-zinc-500 mt-4 text-sm">عدد الحلقات التي تم مشاهدتها : 9575</p>
          </div>
        </div>
      )}

    </div>
  );
}
