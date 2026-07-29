import React, { useState, useRef } from 'react';
import { 
  Database, ArrowLeft, Download, FileJson, AlertCircle, Trash2, 
  FileText, Check, ShieldAlert, Upload, ChevronDown, ChevronUp,
  MessageSquare, Send, Image as ImageIcon, Mail, ExternalLink,
  HelpCircle, Lightbulb, AlertTriangle, MessageCircle, RefreshCw
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
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  
  // Navigation for Support & Contact sub-screens
  const [activeSubView, setActiveSubView] = useState<'none' | 'contact' | 'ticket'>('none');

  // Contact Info Link states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ticketFileInputRef = useRef<HTMLInputElement>(null);

  // Ticket Form States
  const [ticketName, setTicketName] = useState<string>(user?.displayName || '');
  const [ticketEmail, setTicketEmail] = useState<string>(user?.email || '');
  const [ticketType, setTicketType] = useState<'complaint' | 'suggestion' | 'question'>('suggestion');
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketImage, setTicketImage] = useState<File | null>(null);
  const [ticketImagePreview, setTicketImagePreview] = useState<string | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState<boolean>(false);
  const [ticketSubmitted, setTicketSubmitted] = useState<boolean>(false);

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

  // Handle Ticket Image Attachment Selection
  const handleTicketImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTicketImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTicketImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove attached ticket image
  const removeTicketImage = () => {
    setTicketImage(null);
    setTicketImagePreview(null);
    if (ticketFileInputRef.current) {
      ticketFileInputRef.current.value = '';
    }
  };

  // Handle Ticket Submission
  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketName.trim() || !ticketEmail.trim() || !ticketSubject.trim()) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة (الاسم، البريد الإلكتروني، والموضوع)');
      return;
    }

    setIsSubmittingTicket(true);

    try {
      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: ticketName,
          email: ticketEmail,
          type: ticketType,
          subject: ticketSubject,
          imageBase64: ticketImagePreview || undefined,
          imageName: ticketImage?.name || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTicketSubmitted(true);
      } else {
        alert(data.error || 'حدث خطأ أثناء إرسال تذكرتك. يرجى المحاولة لاحقاً.');
      }
    } catch (err: any) {
      console.error('Error submitting support ticket:', err);
      alert('حدث خطأ في الاتصال بالسيرفر. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Reset ticket form state
  const resetTicketForm = () => {
    setTicketSubject('');
    setTicketImage(null);
    setTicketImagePreview(null);
    setTicketSubmitted(false);
    if (ticketFileInputRef.current) {
      ticketFileInputRef.current.value = '';
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

      {/* Main View Screen */}
      {activeSubView === 'none' && (
        <div className="space-y-6">
          
          {/* Header section with back button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-600/10 text-red-500">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-zinc-100 font-display">حسابي وإعدادات البيانات</h1>
                <p className="text-xs text-zinc-400">إدارة سجلاتك الاحتياطية والدعم الفني المباشر</p>
              </div>
            </div>
            <button 
              onClick={() => window.history.back()} 
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Compact Data Management Card */}
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-5 space-y-4 shadow-xl">
            
            {/* Minimal Title Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-black text-zinc-100 font-display">إدارة بيانات التطبيق والنسخ الاحتياطية</h2>
              </div>
              
              {/* Expandable Instructions Button */}
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-400 font-bold transition-all px-2 py-1 rounded-lg bg-zinc-900/50 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20"
              >
                <span>{showInstructions ? "إخفاء الإرشادات" : "مزيد من الإرشادات"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showInstructions ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Error Alert */}
            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Compact Instructions Toggleable Area */}
            {showInstructions && (
              <div className="bg-zinc-950/40 border border-zinc-800/40 rounded-xl p-4 text-[11px] text-zinc-300 leading-relaxed space-y-2 animate-fade-in">
                <p>
                  • <strong className="text-zinc-100">خصوصية تامة:</strong> تطبيق "عالم المانهو" يحفظ كافة سجلات قراءتك، فصولك المفضلة، والمصادر المخصصة <span className="text-red-400 font-bold">محلياً وآمنة 100% داخل متصفح جهازك</span>. لا يتم مشاركتها مع أي جهة خارجية.
                </p>
                <p>
                  • <strong className="text-zinc-100">تجنب فقدان البيانات:</strong> عند حذف كاش المتصفح أو ملفات الكوكيز، قد يقوم المتصفح بمسح سجلاتك. ننصح <span className="text-red-400 font-bold">بتصدير نسخة احتياطية بشكل دوري</span> لتجنب ذلك.
                </p>
                <p>
                  • <strong className="text-zinc-100">نقل السجلات:</strong> يمكنك استيراد ملف النسخة الاحتياطية (.json) المستخرج على أي هاتف آخر لاستكمال القراءة مجاناً.
                </p>
              </div>
            )}

            {/* Compact Export & Import Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Compact Export action */}
              <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-700 transition">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">نسخة احتياطية</h4>
                  <p className="text-[10px] text-zinc-500">حفظ المفضلات والسجلات على جهازك</p>
                </div>
                <button
                  onClick={handleExportData}
                  className="py-1.5 px-3 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 text-[11px] font-bold rounded-lg transition flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>تصدير</span>
                </button>
              </div>

              {/* Compact Import action */}
              <div className="p-3 bg-zinc-950/40 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-700 transition">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">استعادة البيانات</h4>
                  <p className="text-[10px] text-zinc-500">رفع ملف JSON محفوظ لاستعادة السجلات</p>
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
                    className="py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-600 text-[11px] font-bold rounded-lg transition flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>استيراد</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Destructive reset area */}
            <div className="pt-3 border-t border-zinc-800/50 flex justify-between items-center gap-4">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-zinc-300">مسح كامل البيانات</h4>
                <p className="text-[9px] text-zinc-500">سيتم مسح كافّة المفضلات، السجلات، والرجوع للبداية.</p>
              </div>
              <button
                onClick={handleResetLocalStorage}
                className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/15 hover:border-red-600 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف كل البيانات</span>
              </button>
            </div>

          </div>

          {/* New Contact & Support Section */}
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-black text-zinc-100 font-display">التواصل والدعم الفني</h2>
            </div>
            <p className="text-xs text-zinc-400">
              تواصل معنا مباشرة عبر وسائل التواصل الاجتماعي أو قم بفتح تذكرة دعم فني مباشرة لإرسال الشكاوى والاقتراحات.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Contact Us Card Button */}
              <button
                onClick={() => setActiveSubView('contact')}
                className="p-4 bg-zinc-950/60 border border-zinc-800/80 hover:border-red-500/40 rounded-xl text-right transition group cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-zinc-100 group-hover:text-red-400 transition-colors">تواصل معنا ✉️</h3>
                  <p className="text-[10px] text-zinc-500">افتح روابط ديسكورد وحساب تيك توك الرسمي</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-red-400 group-hover:bg-red-500/10 transition">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </button>

              {/* Suggestions & Complaints Ticket Button */}
              <button
                onClick={() => setActiveSubView('ticket')}
                className="p-4 bg-zinc-950/60 border border-zinc-800/80 hover:border-red-500/40 rounded-xl text-right transition group cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-zinc-100 group-hover:text-red-400 transition-colors">تذكرة شكوى واقتراحات 📝</h3>
                  <p className="text-[10px] text-zinc-500">إرسال استفسار أو شكوى مع إمكانية إرفاق صورة</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-red-400 group-hover:bg-red-500/10 transition">
                  <FileText className="w-4 h-4" />
                </div>
              </button>

            </div>
          </div>

        </div>
      )}

      {/* Sub-view: Contact Channels Page */}
      {activeSubView === 'contact' && (
        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
          
          {/* Header of SubView */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-600/10 text-red-500">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-zinc-100 font-display">قنوات التواصل الرسمية</h2>
                <p className="text-[10px] text-zinc-500">يسعدنا انضمامك وتواصلك معنا في أي وقت</p>
              </div>
            </div>
            <button
              onClick={() => setActiveSubView('none')}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 text-xs font-bold border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>رجوع</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Discord Link */}
            <a 
              href="https://discord.gg/NM59xtZtX3" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex flex-col justify-between hover:border-[#5865F2]/40 transition group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#5865F2]/10 text-[#5865F2] rounded-lg">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-zinc-200">ديسكورد المنصة الرسمية</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  انضم إلى مجتمعنا في ديسكورد للتحدث مع بقية القراء والمتابعين، ومناقشة آخر الفصول والأخبار الفنية مباشرة.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] font-bold text-[#5865F2] group-hover:underline">
                <span>انضم للمجتمع الآن 💬</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* TikTok Link */}
            <a 
              href="https://www.tiktok.com/@lordofthemysteries3?_r=1&_t=ZS-98QH53zqB9g" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex flex-col justify-between hover:border-red-500/40 transition group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.74-3.94-1.74a6.422 6.422 0 0 1-1.35-1.93c-.01 1.76-.01 3.52-.01 5.28 0 2.22-.52 4.49-1.92 6.18-1.51 1.83-3.92 2.78-6.26 2.66-2.58-.13-5.06-1.55-6.25-3.87-1.44-2.8-1.02-6.57 1.1-8.89 1.73-1.89 4.38-2.67 6.89-1.98v4.16c-1.35-.45-2.91-.18-3.96.79-1.04.97-1.31 2.58-.69 3.86.6 1.25 1.95 2.1 3.32 2.05 1.48-.05 2.79-1.08 3.19-2.51.18-.63.15-1.31.15-1.97 0-3.32.01-6.64.01-9.96-.01-.08-.02-.16-.03-.24z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-black text-zinc-200">حساب تيك توك الرسمي</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  تابع حسابنا على تيك توك لمشاهدة المراجعات والاقتراحات الأسبوعية لأفضل فصول وروايات المانهو الحصرية والمثيرة.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-[10px] font-bold text-red-500 group-hover:underline">
                <span>تابع الصفحة الرسمية 🎬</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

          </div>

        </div>
      )}

      {/* Sub-view: Complaints & Suggestions Ticket Form */}
      {activeSubView === 'ticket' && (
        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 shadow-xl animate-fade-in space-y-6">
          
          {/* Header of Ticket SubView */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-600/10 text-red-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-zinc-100 font-display">تذكرة شكاوى واقتراحات جديدة</h2>
                <p className="text-[10px] text-zinc-500">صوتك مسموع! أرسل شكواك أو مقترحك المفضل</p>
              </div>
            </div>
            <button
              onClick={() => { setActiveSubView('none'); resetTicketForm(); }}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 text-xs font-bold border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>رجوع</span>
            </button>
          </div>

          {!ticketSubmitted ? (
            <form onSubmit={handleSendTicket} className="space-y-4">
              
              {/* Grid: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="أدخل اسمك"
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500/50 rounded-xl px-4 py-2.5 text-xs text-zinc-100 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">
                    البريد الإلكتروني للرد (الجيمايل) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={ticketEmail}
                    onChange={(e) => setTicketEmail(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500/50 rounded-xl px-4 py-2.5 text-xs text-zinc-100 outline-none transition-colors text-right"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Ticket Type Selector (Interactive Buttons) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">
                  سبب فتح التذكرة والنوع <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Complaint */}
                  <button
                    type="button"
                    onClick={() => setTicketType('complaint')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      ticketType === 'complaint'
                        ? 'bg-red-500/10 border-red-500 text-red-400 shadow-md shadow-red-500/5'
                        : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 ${ticketType === 'complaint' ? 'text-red-500' : 'text-zinc-500'}`} />
                    <span>شكوى ⚠️</span>
                  </button>

                  {/* Suggestion */}
                  <button
                    type="button"
                    onClick={() => setTicketType('suggestion')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      ticketType === 'suggestion'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/5'
                        : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <Lightbulb className={`w-4 h-4 ${ticketType === 'suggestion' ? 'text-amber-500' : 'text-zinc-500'}`} />
                    <span>اقتراح 💡</span>
                  </button>

                  {/* Question */}
                  <button
                    type="button"
                    onClick={() => setTicketType('question')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                      ticketType === 'question'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/5'
                        : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <HelpCircle className={`w-4 h-4 ${ticketType === 'question' ? 'text-indigo-500' : 'text-zinc-500'}`} />
                    <span>سؤال ❓</span>
                  </button>

                </div>
              </div>

              {/* Message Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  موضوع التذكرة وتفاصيل الرسالة <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="اكتب تفاصيل الشكوى أو الاقتراح بشكل واضح ومفصل..."
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500/50 rounded-xl px-4 py-2.5 text-xs text-zinc-100 outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Upload Image Section (Interactive) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  إرفاق لقطة شاشة أو صورة توضيحية (اختياري)
                </label>
                
                {ticketImagePreview ? (
                  <div className="relative border border-zinc-800 rounded-xl p-2 bg-zinc-950/60 max-w-sm flex items-center gap-3">
                    <img 
                      src={ticketImagePreview} 
                      alt="معاينة المرفق" 
                      className="w-16 h-16 object-cover rounded-lg border border-zinc-800"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-300 truncate">{ticketImage?.name}</p>
                      <p className="text-[10px] text-zinc-500">{(ticketImage!.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeTicketImage}
                      className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition cursor-pointer"
                      title="حذف الصورة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={ticketFileInputRef}
                      onChange={handleTicketImageChange}
                      className="hidden"
                    />
                    <div 
                      onClick={() => ticketFileInputRef.current?.click()}
                      className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/30 hover:bg-zinc-950/50 rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-6 h-6 text-zinc-500" />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-zinc-400 block">اضغط هنا لإرفاق صورة أو اسحبها هنا</span>
                        <span className="text-[9px] text-zinc-600">بصيغ PNG، JPG (أقصى حجم 5 ميجابايت)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit & Reset Button area */}
              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveSubView('none'); resetTicketForm(); }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-400 transition"
                >
                  إلغاء التذكرة
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-xs font-black text-white transition flex items-center gap-1.5 active:scale-95 shadow-lg shadow-red-600/15 cursor-pointer"
                >
                  {isSubmittingTicket ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>جاري إرسال تذكرتك...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>إرسال التذكرة للإدارة 🚀</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            /* Successful Submission Confirmation Card */
            <div className="p-6 bg-zinc-950/60 border border-emerald-500/20 rounded-2xl text-center space-y-4 max-w-md mx-auto py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black text-emerald-400">تم إرسال التذكرة بنجاح!</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  لقد استلمنا تذكرتك وتم إرسال نسخة منها بنجاح إلى البريد الإلكتروني <strong className="text-amber-400">rkieeamne@gmail.com</strong>. سيقوم فريق الإدارة بمراجعتها والتواصل معك عبر بريدك الإلكتروني في أقرب وقت ممكن.
                </p>
              </div>

              <div className="pt-4 flex gap-2 justify-center">
                <button
                  onClick={resetTicketForm}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[11px] font-bold text-zinc-300 rounded-xl transition cursor-pointer"
                >
                  إرسال تذكرة أخرى 📝
                </button>
                <button
                  onClick={() => { setActiveSubView('none'); resetTicketForm(); }}
                  className="px-4 py-2 bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                >
                  العودة للحساب الشخصي
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
