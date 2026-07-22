import re

with open("src/views/ReaderView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_loading = """        {loadingPages && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4" id="reader-loading-pages">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <h4 className="text-sm font-bold text-zinc-300">جاري تحميل صور صفحات الفصل مباشرة...</h4>
            <p className="text-xs text-zinc-500">
              نقوم الآن بجلب الروابط وفك حظر السيرفرات لتجربة تصفح سريعة وخالية من الإعلانات.
            </p>
          </div>
        )}"""

new_loading = """        {loadingPages && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4" id="reader-loading-pages">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <h4 className="text-sm font-bold text-zinc-300">
              {preloadProgress.total > 0 
                ? `جاري تحميل الصفحات مسبقاً (${preloadProgress.current}/${preloadProgress.total})...`
                : 'جاري تحميل صور صفحات الفصل مباشرة...'}
            </h4>
            <p className="text-xs text-zinc-500">
              {preloadProgress.total > 0 
                ? 'نقوم بتحميل جميع الصور لضمان قراءة سلسة وبدون تقطيع.'
                : 'نقوم الآن بجلب الروابط وفك حظر السيرفرات لتجربة تصفح سريعة وخالية من الإعلانات.'}
            </p>
            {preloadProgress.total > 0 && (
              <div className="w-64 max-w-full bg-zinc-900 rounded-full h-1.5 mt-4 overflow-hidden">
                <div 
                  className="bg-red-500 h-1.5 transition-all duration-300" 
                  style={{ width: `${(preloadProgress.current / preloadProgress.total) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        )}"""

content = content.replace(old_loading, new_loading)

with open("src/views/ReaderView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched loading state")
