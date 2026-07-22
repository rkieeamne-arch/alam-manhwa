import React, { useState, useEffect } from 'react';
import { 
  Download, Trash2, Play, BookOpen, AlertCircle, RefreshCw, FolderDown, ArrowRight, WifiOff 
} from 'lucide-react';
import { 
  getOfflineManhuas, 
  getOfflineChaptersForManhua, 
  deleteChapterOffline, 
  deleteManhuaOffline,
  OfflineManhua,
  OfflineChapter
} from '../utils/offlineDb';
import { Manhua, Chapter } from '../types';

interface DownloadsViewProps {
  onSelectChapterOffline: (manhua: Manhua, chapter: Chapter) => void;
  onNavigate: (view: 'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists' | 'downloads') => void;
}

export default function DownloadsView({
  onSelectChapterOffline,
  onNavigate
}: DownloadsViewProps) {
  const [offlineManhuas, setOfflineManhuas] = useState<OfflineManhua[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedManhuaId, setExpandedManhuaId] = useState<string | null>(null);
  const [chaptersMap, setChaptersMap] = useState<Record<string, OfflineChapter[]>>({});
  const [loadingChapters, setLoadingChapters] = useState<Record<string, boolean>>({});

  // Custom confirmation modal state
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'chapter' | 'manhua';
    id: string;
    manhuaId?: string;
    title: string;
  } | null>(null);

  const loadOfflineData = async () => {
    setLoading(true);
    try {
      const data = await getOfflineManhuas();
      // Sort offline manhuas by downloadedAt descending
      data.sort((a, b) => b.downloadedAt - a.downloadedAt);
      setOfflineManhuas(data);
    } catch (err) {
      console.error('Failed to load offline manhuas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineData();
  }, []);

  const handleToggleManhua = async (manhuaId: string) => {
    if (expandedManhuaId === manhuaId) {
      setExpandedManhuaId(null);
      return;
    }

    setExpandedManhuaId(manhuaId);
    if (!chaptersMap[manhuaId]) {
      setLoadingChapters(prev => ({ ...prev, [manhuaId]: true }));
      try {
        const chapters = await getOfflineChaptersForManhua(manhuaId);
        setChaptersMap(prev => ({ ...prev, [manhuaId]: chapters }));
      } catch (err) {
        console.error(`Failed to load offline chapters for ${manhuaId}:`, err);
      } finally {
        setLoadingChapters(prev => ({ ...prev, [manhuaId]: false }));
      }
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { type, id, manhuaId } = confirmDelete;

    try {
      if (type === 'chapter' && manhuaId) {
        await deleteChapterOffline(id, manhuaId);
        // Refresh chapters for this manhua
        const updatedChapters = await getOfflineChaptersForManhua(manhuaId);
        setChaptersMap(prev => ({ ...prev, [manhuaId]: updatedChapters }));

        // If no chapters left, refresh the main manhua list
        if (updatedChapters.length === 0) {
          setExpandedManhuaId(null);
          await loadOfflineData();
        }
      } else if (type === 'manhua') {
        await deleteManhuaOffline(id);
        setExpandedManhuaId(null);
        await loadOfflineData();
      }
    } catch (err) {
      console.error('Error executing delete offline:', err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleReadChapter = (offlineM: OfflineManhua, offlineC: OfflineChapter) => {
    // Construct standard Manhua & Chapter objects so they fit perfectly into the ReaderView
    const manhuaObj: Manhua = {
      id: offlineM.id,
      title: offlineM.title,
      description: offlineM.description,
      coverUrl: offlineM.coverUrl,
      author: offlineM.author,
      artist: offlineM.artist || 'غير معروف',
      status: offlineM.status as any,
      categories: offlineM.categories,
      views: 0,
      rating: 5,
      chapters: [], // We'll fill this on select
      releaseYear: 2026
    };

    const chapterObj: Chapter = {
      id: offlineC.id,
      manhuaId: offlineM.id,
      title: offlineC.title,
      chapterNumber: offlineC.chapterNumber,
      releaseDate: 'محمل',
      pages: offlineC.pages, // This has base64 data URLs!
      views: 0,
      isLocked: false
    };

    // Include sibling downloaded chapters for next/prev buttons in ReaderView
    const siblingChapters = chaptersMap[offlineM.id] || [];
    manhuaObj.chapters = siblingChapters.map(sc => ({
      id: sc.id,
      manhuaId: offlineM.id,
      title: sc.title,
      chapterNumber: sc.chapterNumber,
      releaseDate: 'محمل',
      pages: sc.pages,
      views: 0,
      isLocked: false
    }));

    onSelectChapterOffline(manhuaObj, chapterObj);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-fade-in" id="downloads-view-container" dir="rtl">
      
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
        <div className="flex items-center gap-2 border-r-4 border-red-500 pr-3">
          <FolderDown className="w-5 h-5 text-red-500" />
          <h1 className="text-xl font-bold text-zinc-100 font-display">الفصول المحملة على جهازك</h1>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-red-500 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
        >
          <span>تصفح المانهو</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      <div className="flex items-center gap-2 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60 mb-6 text-zinc-300">
        <WifiOff className="w-5 h-5 text-amber-500 shrink-0" />
        <p className="text-xs leading-relaxed">
          جميع هذه الفصول تم حفظها بأمان على متصفح جهازك. يمكنك الاستمتاع بقراءتها بالكامل وتصفح صورها بشكل مثالي وسريع <span className="text-red-500 font-bold">دون الحاجة لأي اتصال بالإنترنت (Offline Mode)</span>.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-10 h-10 text-red-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-500">جاري تحميل الفصول المحفوظة...</p>
        </div>
      ) : offlineManhuas.length > 0 ? (
        <div className="space-y-4">
          {offlineManhuas.map((manhua) => {
            const isExpanded = expandedManhuaId === manhua.id;
            const chapters = chaptersMap[manhua.id] || [];
            const isLoadingCh = loadingChapters[manhua.id];

            return (
              <div 
                key={manhua.id}
                className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* Manhua Header Row */}
                <div 
                  onClick={() => handleToggleManhua(manhua.id)}
                  className="p-4 flex gap-4 items-center justify-between cursor-pointer hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="flex gap-4 items-center min-w-0">
                    <img 
                      src={manhua.coverUrl || undefined} 
                      alt={manhua.title} 
                      className="w-12 h-16 rounded-lg object-cover border border-zinc-800 bg-zinc-950 shadow-md shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 text-right">
                      <h2 className="text-sm font-black text-white truncate max-w-[250px] sm:max-w-[400px]">
                        {manhua.title}
                      </h2>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        الكاتب: {manhua.author} • المصدر: {manhua.sourceId || 'عام'}
                      </p>
                      <span className="inline-block text-[9px] font-bold text-red-400 bg-red-950/15 border border-red-950 px-2 py-0.5 rounded-full mt-1.5">
                        تم تنزيل الفصول
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({
                          type: 'manhua',
                          id: manhua.id,
                          title: manhua.title
                        });
                      }}
                      className="p-2 bg-red-950/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg border border-red-900/20 transition-all cursor-pointer"
                      title="حذف المانهو كاملة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-zinc-400 font-bold bg-zinc-900/80 border border-zinc-800 px-2.5 py-1.5 rounded-lg">
                      {isExpanded ? 'إخلاق' : 'عرض الفصول 📁'}
                    </span>
                  </div>
                </div>

                {/* Chapters Drawer Section */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-zinc-950/40 p-4 space-y-2">
                    {isLoadingCh ? (
                      <div className="py-4 text-center">
                        <RefreshCw className="w-5 h-5 text-red-500 animate-spin mx-auto" />
                      </div>
                    ) : chapters.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {chapters.map((ch) => (
                          <div
                            key={ch.id}
                            className="flex items-center justify-between p-3 bg-zinc-900/30 border border-zinc-800 hover:border-red-500/30 rounded-xl transition-all"
                          >
                            <div className="flex items-center gap-3 text-right">
                              <div className="w-8 h-8 rounded bg-red-600/10 text-red-500 border border-red-500/20 flex items-center justify-center font-black text-xs font-mono">
                                {ch.chapterNumber}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-zinc-200">
                                  {ch.title}
                                </h4>
                                <span className="text-[9px] text-zinc-500 font-mono">
                                  {ch.pages.some(p => p instanceof Blob) ? 'محتوى فيديو (جاهز للمشاهدة بدون نت)' : `سعة التحميل: ${ch.pages.length} صورة متوفرة`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReadChapter(manhua, ch)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-white text-white" />
                                <span>قراءة</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDelete({
                                    type: 'chapter',
                                    id: ch.id,
                                    manhuaId: manhua.id,
                                    title: ch.title
                                  });
                                }}
                                className="p-1.5 bg-zinc-900 hover:bg-red-600/10 text-zinc-500 hover:text-red-400 rounded-lg border border-zinc-800 hover:border-red-500/20 transition-all cursor-pointer"
                                title="حذف الفصل"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-2">لا توجد فصول محملة لهذه المانهو.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl py-20 text-center space-y-4">
          <WifiOff className="w-14 h-14 mx-auto text-zinc-800 stroke-1" />
          <h3 className="text-sm font-bold text-zinc-300">لم تقم بتحميل أي فصول بعد!</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            انقر على زر التحميل المتواجد بجانب الفصول في واجهة المانهو لحفظها وقراءتها في أي وقت دون اتصال بالإنترنت.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            الذهاب لتصفح المانهو المتوفرة
          </button>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-100 font-display">تأكيد عملية الحذف</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {confirmDelete.type === 'manhua' 
                  ? `هل أنت متأكد من حذف هذه المانهو "${confirmDelete.title}" وجميع فصولها المحملة بالكامل من جهازك؟`
                  : `هل أنت متأكد من حذف الفصل "${confirmDelete.title}" من جهازك؟`
                }
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                نعم، احذف الآن
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-800 transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
