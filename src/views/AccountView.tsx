import React, { useState, useRef } from 'react';
import { 
  Database, ArrowLeft, Download, FileJson, AlertCircle, Trash2, 
  FileText, Check, ShieldAlert, Award, Clock, Upload
} from 'lucide-react';
import { UserProfile, ReadingHistoryItem } from '../types';

interface AccountViewProps {
  user: UserProfile | null;
  history: ReadingHistoryItem[];
  onLogout?: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<{ success: boolean; error: string | null }>;
  onLogin?: (email: string, password: string) => Promise<any>;
  onSignup?: (email: string, password: string) => Promise<any>;
  onResetPassword?: (email: string) => Promise<any>;
  onLoginWithGoogle?: () => Promise<any>;
}

export default function AccountView({
  user,
  history = [],
}: AccountViewProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export local storage databases
  const handleExportData = () => {
    try {
      const backupData = {
        manhua_user_profile: localStorage.getItem('manhua_user_profile'),
        manhua_reading_history: localStorage.getItem('manhua_reading_history'),
        manhua_reading_list: localStorage.getItem('manhua_reading_list'),
        manhua_scraper_sources: localStorage.getItem('manhua_scraper_sources'),
        manhua_list: localStorage.getItem('manhua_list'),
        manhua_reader_settings: localStorage.getItem('manhua_reader_settings'),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', `manhua_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      setFormError('فشل تصدير البيانات: ' + err.message);
    }
  };

  // Import local storage databases
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Simple validation check
        if (!parsed.exportedAt && !parsed.manhua_user_profile && !parsed.manhua_reading_history) {
          throw new Error('ملف النسخة الاحتياطية غير صالح أو تالف.');
        }

        // Write loaded keys back to localStorage
        if (parsed.manhua_user_profile) localStorage.setItem('manhua_user_profile', parsed.manhua_user_profile);
        if (parsed.manhua_reading_history) localStorage.setItem('manhua_reading_history', parsed.manhua_reading_history);
        if (parsed.manhua_reading_list) localStorage.setItem('manhua_reading_list', parsed.manhua_reading_list);
        if (parsed.manhua_scraper_sources) localStorage.setItem('manhua_scraper_sources', parsed.manhua_scraper_sources);
        if (parsed.manhua_list) localStorage.setItem('manhua_list', parsed.manhua_list);
        if (parsed.manhua_reader_settings) localStorage.setItem('manhua_reader_settings', parsed.manhua_reader_settings);

        setImportSuccess('تم استيراد واسترجاع جميع سجلاتك بنجاح! سيتم تحديث الصفحة لتطبيق التغييرات.');
        setFormError(null);

        // Reload the page to refresh all React states from localStorage
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (err: any) {
        setFormError('فشل استيراد الملف: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Reset local storage database to clear everything
  const handleResetLocalStorage = () => {
    if (window.confirm('هل أنت متأكد من حذف كافة سجلات القراءة، المفضلة، والإعدادات نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 px-4 sm:px-6 animate-fade-in" id="account-view-container" dir="rtl">
      
      {importSuccess && (
        <div className="fixed bottom-6 left-6 bg-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 text-xs font-bold max-w-sm border border-indigo-500">
          <Check className="w-5 h-5 text-indigo-200 animate-pulse" />
          <span>{importSuccess}</span>
        </div>
      )}

      {/* Header section with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-600/10 text-red-500">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-100 font-display">إدارة بيانات التطبيق والنسخ الاحتياطية</h1>
            <p className="text-xs text-zinc-400">تحكم كامل بسجلاتك ومفضلتك المخزنة محلياً</p>
          </div>
        </div>
        <button 
          onClick={() => window.history.back()} 
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl overflow-hidden shadow-xl p-6 space-y-6">
        
        {/* Error Alert */}
        {formError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Local Storage Instructions Block */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-red-500 font-black text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>تعليمات وإرشادات هامة حول تخزين البيانات</span>
          </div>

          <div className="bg-zinc-950/40 border border-zinc-800/40 rounded-xl p-5 text-xs text-zinc-300 leading-relaxed space-y-3">
            <p>
              • <strong className="text-zinc-100">خصوصية تامة:</strong> تطبيق "عالم المانهو" يحفظ كافة سجلات قراءتك، فصولك المفضلة، والمصادر المخصصة <span className="text-red-400 font-bold">محلياً وآمنة 100% داخل متصفح جهازك</span>. لا يتم إرسال أو مزامنة أي بيانات شخصية مع أي خوادم خارجية.
            </p>
            <p>
              • <strong className="text-zinc-100">تجنب فقدان البيانات:</strong> عند حذف كاش المتصفح أو ملفات الكوكيز، قد يقوم المتصفح بمسح سجلاتك. لذا ننصح <span className="text-red-400 font-bold">بتصدير نسخة احتياطية بشكل دوري</span> وتنزيلها على جهازك.
            </p>
            <p>
              • <strong className="text-zinc-100">التنقل بين الأجهزة:</strong> يمكنك بكل سهولة تحميل ملف النسخة الاحتياطية المصدرة ورفعه على أي هاتف آخر أو متصفح آخر لاستكمال القراءة من حيث توقفت فوراً وبشكل مجاني تماماً.
            </p>
          </div>
        </div>

        {/* Quick Statistics Counter */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-950/40 border border-zinc-800/40 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold">فصول تمت قراءتها</p>
              <p className="text-sm font-black text-zinc-100 font-mono mt-0.5">{history.length}</p>
            </div>
          </div>

          <div className="p-4 bg-zinc-950/40 border border-zinc-800/40 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold">حالة الحساب المحلي</p>
              <p className="text-xs font-black text-emerald-500 mt-1">نشط ومستقر (Offline)</p>
            </div>
          </div>
        </div>

        {/* Export & Import Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Export card */}
          <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-4 flex flex-col justify-between hover:border-zinc-700 transition">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-xs">
                <Download className="w-4 h-4 text-red-500" />
                <span>تصدير نسخة احتياطية</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                تنزيل ملف بصيغة JSON يحتوي على كافة المفضلات وسجلات الفصول والمصادر لحفظها بشكل آمن على جهازك.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="w-full py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 hover:border-red-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>تحميل ملف النسخة الاحتياطية</span>
            </button>
          </div>

          {/* Import card */}
          <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-4 flex flex-col justify-between hover:border-zinc-700 transition">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-xs">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>استيراد واستعادة السجلات</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                رفع ملف النسخة الاحتياطية (.json) المستخرج مسبقاً لاسترجاع كافة المفضلات وسجلات القراءة فوراً.
              </p>
            </div>
            
            <div>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleImportData}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>رفع واستعادة الملف الاحتياطي</span>
              </button>
            </div>
          </div>
        </div>

        {/* Destructive reset area */}
        <div className="pt-6 border-t border-zinc-800/60 flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-zinc-300">إعادة تعيين كامل التطبيق</h4>
            <p className="text-[10px] text-zinc-500">سيتم مسح كافّة المفضلات، السجلات، والمصادر المخصصة والعودة كأنك تفتح التطبيق لأول مرة.</p>
          </div>
          <button
            onClick={handleResetLocalStorage}
            className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 hover:border-red-600 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف ومسح كافة البيانات</span>
          </button>
        </div>

      </div>

    </div>
  );
}
