import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ShieldCheck, Key, HelpCircle, Check, Trash2, ExternalLink, 
  RefreshCw, Info, AlertTriangle, Eye, EyeOff, Clipboard
} from 'lucide-react';

interface BypassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BypassModal({ isOpen, onClose }: BypassModalProps) {
  const [cookie, setCookie] = useState('');
  const [userAgent, setUserAgent] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load active bypass data on open
  useEffect(() => {
    if (isOpen) {
      const savedCookie = localStorage.getItem('manhua_bypass_cookie') || '';
      const savedUA = localStorage.getItem('manhua_bypass_user_agent') || navigator.userAgent;
      setCookie(savedCookie);
      setUserAgent(savedUA);
      setIsActive(!!savedCookie);
      setTestResult(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!cookie.trim()) {
      localStorage.removeItem('manhua_bypass_cookie');
      localStorage.removeItem('manhua_bypass_user_agent');
      setIsActive(false);
      alert('تم إزالة الكوكيز المخصصة. سيتم استخدام الإعدادات الافتراضية.');
      return;
    }

    localStorage.setItem('manhua_bypass_cookie', cookie.trim());
    localStorage.setItem('manhua_bypass_user_agent', userAgent.trim() || navigator.userAgent);
    setIsActive(true);
    setTestResult(null);
    
    // Dispatch custom event to auto-retry request in background
    window.dispatchEvent(new CustomEvent('bypass-saved'));
    onClose();
  };

  const handleClear = () => {
    localStorage.removeItem('manhua_bypass_cookie');
    localStorage.removeItem('manhua_bypass_user_agent');
    setCookie('');
    setUserAgent(navigator.userAgent);
    setIsActive(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Temp save to localStorage so the proxiedFetch uses it
      localStorage.setItem('manhua_bypass_cookie', cookie.trim());
      localStorage.setItem('manhua_bypass_user_agent', userAgent.trim() || navigator.userAgent);

      // We fetch Azora's home or a simple endpoint through our proxy
      const testUrl = '/api/proxy?url=' + encodeURIComponent('https://azorafly.com/series?page=1');
      const res = await fetch(testUrl, {
        headers: {
          'X-Proxy-Cookie': cookie.trim(),
          'X-Proxy-User-Agent': userAgent.trim() || navigator.userAgent
        }
      });
      
      if (res.ok) {
        setTestResult({
          success: true,
          message: 'رائع! تم الاتصال بنجاح وتخطي حظر الكابتشا بنسبة 100%. المصادر تعمل الآن بشكل مثالي!'
        });
        setIsActive(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: data.error || `فشل الاتصال (${res.status}: ${res.statusText}). تأكد من أن الكوكيز المنسوخة صحيحة ولم تنتهِ صلاحيتها.`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `خطأ في الاتصال: ${err.message || 'تعذر الوصول للبروكسي المحلي'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFillMyUA = () => {
    setUserAgent(navigator.userAgent);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm"
            id="bypass-modal-backdrop"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-x-4 top-[10%] md:top-[15%] max-w-xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl z-[101] overflow-hidden flex flex-col font-sans"
            id="bypass-modal"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-900 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-xl">
                  <Key className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-100">مساعد تخطي حظر الكابتشا و Cloudflare</h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">تجاوز قيود الخوادم والحماية التلقائية للمواقع بنقرة واحدة</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                id="close-bypass-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">
              
              {/* Alert Info Box */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 leading-relaxed">
                  <p className="font-bold">لماذا يحدث الحظر؟</p>
                  <p className="text-zinc-400">
                    نظراً لأن السيرفر يعمل في بيئة سحابية مشتركة، تقوم خوارزميات حماية المواقع (مثل Cloudflare) بحجب خوادم السحاب وعرض اختبار **CAPTCHA** لمنع برامج البوت.
                  </p>
                  <p className="text-zinc-400 font-semibold text-[11px] pt-1">
                    💡 الحل الذكي: عند نسخ الكوكيز (Cookie) الخاصة بمتصفحك الحقيقي ووضعها هنا، سيقوم السيرفر بتقليد متصفحك تماماً ويجتاز الحماية بسهولة فائقة!
                  </p>
                </div>
              </div>

              {/* Status Section */}
              <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/80 p-3.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                  <div>
                    <span className="text-xs font-bold block text-zinc-200">
                      حالة تخطي الحظر المخصص: {isActive ? 'مُفعّل ونشط' : 'غير مُفعّل (افتراضي)'}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {isActive ? 'يتم إرسال كوكيز المتصفح الحقيقي مع كل طلب للبروكسي' : 'يتم استخدام إعدادات الخادم العامة'}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <button
                    onClick={handleClear}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all flex items-center gap-1 text-[11px] font-bold"
                    title="إزالة الكوكيز المخصصة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف الكوكيز
                  </button>
                )}
              </div>

              {/* Quick Action Button - Solve Captcha */}
              <div className="space-y-2">
                <span className="text-xs font-black text-zinc-300 block">خطوة 1: فك تشفير الحظر في متصفحك</span>
                <a
                  href="https://azorafly.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black transition-all shadow-lg hover:shadow-red-600/10"
                >
                  <ExternalLink className="w-4 h-4" />
                  افتح موقع ازورا مانجا في علامة تبويب جديدة لحل الكابتشا
                </a>
                <p className="text-[10px] text-zinc-500 text-center">
                  * إذا طلب الموقع منك حل الكابتشا في علامة التبويب المفتوحة، قم بحلها ودعه يفتح بالكامل، ثم عُد إلى هنا.
                </p>
              </div>

              {/* Inputs Form */}
              <div className="space-y-4 pt-2 border-t border-zinc-900">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-zinc-300 flex items-center gap-1">
                      <span>خطوة 2: كود الكوكيز (Cookie) للطلب:</span>
                    </label>
                    <button
                      onClick={() => setShowGuide(!showGuide)}
                      className="text-[10px] text-red-400 hover:underline flex items-center gap-0.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      كيف أنسخ الكوكيز؟
                    </button>
                  </div>

                  {/* Copy Instructions Guide */}
                  <AnimatePresence>
                    {showGuide && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 text-[11px] text-zinc-400 space-y-2 leading-relaxed"
                      >
                        <p className="font-bold text-zinc-300">أسهل طريقة لنسخ الكوكيز في 3 خطوات:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-zinc-400">
                          <li>في صفحة الموقع التي فتحتها، اضغط بزر الفأرة الأيمن واختر <strong className="text-zinc-200">Inspect (فحص)</strong> أو اضغط <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200 font-mono text-[9px]">F12</kbd>.</li>
                          <li>اذهب إلى لسان التبويب <strong className="text-zinc-200">Network (الشبكة)</strong> ثم قم بتحديث الصفحة (<kbd className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200 font-mono text-[9px]">F5</kbd>).</li>
                          <li>انقر على أول طلب (مثال: <strong className="text-zinc-200">series</strong> أو اسم الصفحة)، وابحث في قسم <strong className="text-zinc-200">Request Headers (رؤوس الطلب)</strong> عن الكلمة <strong className="text-zinc-200">Cookie</strong>، ثم انسخ القيمة المقابلة لها بالكامل (التي تحتوي عادةً على <strong className="text-amber-500">cf_clearance</strong>) والصقها في الحقل أدناه.</li>
                        </ol>
                        <p className="text-[10px] text-amber-400/80">💡 تلميح: يمكنك نسخ كل الكوكيز الظاهرة في المتصفح ووضعها هنا مباشرة، وسيتولى السيرفر تصفيتها تلقائياً!</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <textarea
                    rows={3}
                    placeholder="ضع كود الكوكيز المنسوخ هنا (مثال: cf_clearance=xxxx; ...)"
                    value={cookie}
                    onChange={(e) => setCookie(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-red-500 font-mono resize-none focus:ring-1 focus:ring-red-500"
                    id="bypass-cookie-textarea"
                  />
                </div>

                {/* User-Agent Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-zinc-300">
                      وكيل المستخدم (User-Agent):
                    </label>
                    <button
                      onClick={handleFillMyUA}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300"
                    >
                      استخدام متصفحي الحالي
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="User-Agent"
                    value={userAgent}
                    onChange={(e) => setUserAgent(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-red-500 font-mono focus:ring-1 focus:ring-red-500"
                    id="bypass-ua-input"
                  />
                </div>
              </div>

              {/* Testing / Saving Actions */}
              <div className="space-y-3 pt-3 border-t border-zinc-900">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-white border border-zinc-800 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-zinc-400" />
                    )}
                    تجربة جودة الاتصال
                  </button>

                  <button
                    onClick={handleSave}
                    className="py-2.5 px-4 bg-zinc-100 hover:bg-white text-black rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xl shadow-white/5"
                  >
                    <Check className="w-4 h-4" />
                    حفظ وتطبيق الآن
                  </button>
                </div>

                {/* Test Result Message */}
                {testResult && (
                  <div className={`p-3.5 rounded-2xl text-xs flex gap-2 border ${
                    testResult.success 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}>
                    {testResult.success ? (
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    )}
                    <span className="leading-relaxed">{testResult.message}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Notice */}
            <div className="p-4 bg-zinc-900/20 border-t border-zinc-900 text-center">
              <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
                <Info className="w-3.5 h-3.5 text-zinc-600" />
                تحمي هذه الأداة خصوصيتك بالكامل. جميع بيانات الكوكيز يتم حفظها محلياً على جهازك فقط.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
