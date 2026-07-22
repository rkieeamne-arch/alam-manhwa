import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Terminal, Sparkles, Plus, Trash2, 
  BookOpen, Database, RotateCcw, FilePlus, Globe, Check, Eye, Layers, Settings, HelpCircle, Code, RefreshCw, Loader2,
  Megaphone, Lock, ExternalLink, Cloud, Save
} from 'lucide-react';
import { Manhua, Chapter, ManhuaStatus, ScraperSource, NotificationItem } from '../types';
import { testSelector } from '../utils/scraper';
import { 
  getStoredAppwriteConfig, saveAppwriteConfig, 
  fetchAppwriteAds, createAppwriteAd, deleteAppwriteAd,
  AppwriteConfig, AppwriteAd 
} from '../lib/appwrite';

interface AdminViewProps {
  manhuas: Manhua[];
  onAddManhua: (manhua: Manhua) => void;
  onUpdateManhua: (manhua: Manhua) => void;
  onDeleteManhua: (id: string) => void;
  onRestoreDefaults: () => void;
  onClearAllManhuas: () => void;
  // Scraper Sources props
  sources?: ScraperSource[];
  onAddSource?: (newSource: ScraperSource) => void;
  onDeleteSource?: (sourceId: string) => void;
  onRestoreSources?: () => void;
  onAddNotification?: (notif: NotificationItem) => void;
}

const AVAILABLE_CATEGORIES = [
  'أكشن', 'مغامرة', 'خيال', 'رومانسية', 'كوميدي', 
  'دراما', 'فنون قتالية', 'شياطين', 'أنمي', 'إثارة',
  'علمي', 'رعب', 'سحر', 'تاريخي', 'غموض'
];

export default function AdminView({
  manhuas,
  onAddManhua,
  onUpdateManhua,
  onDeleteManhua,
  onRestoreDefaults,
  onClearAllManhuas,
  sources = [],
  onAddSource,
  onDeleteSource,
  onRestoreSources,
  onAddNotification
}: AdminViewProps) {
  
  const [activeTab, setActiveTab] = useState<'add-manhua' | 'add-chapter' | 'manage' | 'advanced' | 'sources' | 'appwrite'>('add-manhua');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Site Notification State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifType, setNotifType] = useState<'site' | 'manga' | 'anime'>('site');
  const [notifLink, setNotifLink] = useState('');

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

  // Appwrite & Ads state
  const [appwriteConfig, setAppwriteConfig] = useState<AppwriteConfig>(getStoredAppwriteConfig);
  const [adsList, setAdsList] = useState<AppwriteAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdImageUrl, setNewAdImageUrl] = useState('');
  const [newAdLinkUrl, setNewAdLinkUrl] = useState('');
  const [newAdPosition, setNewAdPosition] = useState<'top_banner' | 'reader_bottom' | 'sidebar' | 'popup'>('top_banner');

  // Load Ads on mount or tab change
  useEffect(() => {
    if (activeTab === 'appwrite') {
      loadAds();
    }
  }, [activeTab]);

  const loadAds = async () => {
    setLoadingAds(true);
    try {
      const fetched = await fetchAppwriteAds();
      setAdsList(fetched);
    } catch (e) {
      console.warn('Failed to load ads:', e);
    } finally {
      setLoadingAds(false);
    }
  };

  const handleSaveAppwriteConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveAppwriteConfig(appwriteConfig);
    triggerToast('تم حفظ إعدادات خادم Appwrite بنجاح!');
    loadAds();
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim() || !newAdImageUrl.trim()) {
      triggerError('يرجى إدخال عنوان الإعلان ورابط الصورة.');
      return;
    }
    try {
      setLoadingAds(true);
      const created = await createAppwriteAd({
        title: newAdTitle.trim(),
        imageUrl: newAdImageUrl.trim(),
        linkUrl: newAdLinkUrl.trim() || '#',
        position: newAdPosition,
        isActive: true
      });
      setAdsList(prev => [created, ...prev]);
      setNewAdTitle('');
      setNewAdImageUrl('');
      setNewAdLinkUrl('');
      triggerToast('تم نشر الإعلان بنجاح في Appwrite!');
    } catch (err: any) {
      triggerError(err.message || 'فشل إضافة الإعلان إلى Appwrite');
    } finally {
      setLoadingAds(false);
    }
  };

  const handleDeleteAd = async (id?: string) => {
    if (!id) return;
    askConfirmation('حذف الإعلان', 'هل أنت تأكد من رغبتك في حذف هذا الإعلان النهائي؟', async () => {
      setLoadingAds(true);
      await deleteAppwriteAd(id);
      setAdsList(prev => prev.filter(a => a.$id !== id));
      triggerToast('تم حذف الإعلان بنجاح.');
      setLoadingAds(false);
    });
  };

  const handleLockAdminMode = () => {
    localStorage.removeItem('admin_secret_unlocked');
    window.location.href = window.location.pathname;
  };

  // Custom iframe-safe confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      title,
      message,
      onConfirm
    });
  };

  // Preset Template State
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  // 1. New Manhua Form State
  const [manhuaTitle, setManhuaTitle] = useState('');
  const [manhuaEnglishTitle, setManhuaEnglishTitle] = useState('');
  const [manhuaCoverUrl, setManhuaCoverUrl] = useState('');
  const [manhuaBannerUrl, setManhuaBannerUrl] = useState('');
  const [manhuaDescription, setManhuaDescription] = useState('');
  const [manhuaRating, setManhuaRating] = useState(4.5);
  const [manhuaStatus, setManhuaStatus] = useState<ManhuaStatus>('مستمر');
  const [manhuaAuthor, setManhuaAuthor] = useState('');
  const [manhuaArtist, setManhuaArtist] = useState('');
  const [manhuaReleaseYear, setManhuaReleaseYear] = useState(2026);
  const [manhuaIsFeatured, setManhuaIsFeatured] = useState(false);
  const [manhuaIsTrending, setManhuaIsTrending] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  // 2. New Chapter Form State
  const [selectedManhuaId, setSelectedManhuaId] = useState('');
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterPagesText, setChapterPagesText] = useState('');

  // 3. New Scraper Source Form State
  const [newSrcId, setNewSrcId] = useState('');
  const [newSrcName, setNewSrcName] = useState('');
  const [newSrcBaseUrl, setNewSrcBaseUrl] = useState('');
  const [newSrcPopularPath, setNewSrcPopularPath] = useState('');
  
  const [newSrcListCard, setNewSrcListCard] = useState('');
  const [newSrcListTitle, setNewSrcListTitle] = useState('');
  const [newSrcListLink, setNewSrcListLink] = useState('');
  const [newSrcListCover, setNewSrcListCover] = useState('');
  const [newSrcListCoverAttr, setNewSrcListCoverAttr] = useState('src');
  const [newSrcListChapter, setNewSrcListChapter] = useState('');
  
  const [newSrcDetailTitle, setNewSrcDetailTitle] = useState('');
  const [newSrcDetailDesc, setNewSrcDetailDesc] = useState('');
  const [newSrcDetailAuthor, setNewSrcDetailAuthor] = useState('');
  const [newSrcDetailArtist, setNewSrcDetailArtist] = useState('');
  const [newSrcDetailStatus, setNewSrcDetailStatus] = useState('');
  const [newSrcDetailGenre, setNewSrcDetailGenre] = useState('');
  
  const [newSrcChItem, setNewSrcChItem] = useState('');
  const [newSrcChLink, setNewSrcChLink] = useState('');
  const [newSrcChTitle, setNewSrcChTitle] = useState('');
  
  const [newSrcPageImg, setNewSrcPageImg] = useState('');
  const [newSrcPageImgAttr, setNewSrcPageImgAttr] = useState('src');

  // Selector Tester State
  const [testUrl, setTestUrl] = useState('');
  const [testSelectorStr, setTestSelectorStr] = useState('');
  const [testAttr, setTestAttr] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  // Handle Create Scraper Source submit
  const handleCreateSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrcId.trim() || !newSrcName.trim() || !newSrcBaseUrl.trim()) {
      triggerError('يرجى إدخال اسم المصدر ومعرّفه ورابط الموقع الأساسي.');
      return;
    }

    const cleanId = newSrcId.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const newSource: ScraperSource = {
      id: cleanId,
      name: newSrcName.trim(),
      baseUrl: newSrcBaseUrl.trim().replace(/\/$/, ''), // strip trailing slash
      popularPath: newSrcPopularPath.trim() || '/',
      listCardSelector: newSrcListCard.trim() || '.item',
      listTitleSelector: newSrcListTitle.trim() || 'h3',
      listLinkSelector: newSrcListLink.trim() || 'a',
      listCoverSelector: newSrcListCover.trim() || 'img',
      listCoverAttr: newSrcListCoverAttr.trim() || 'src',
      listChapterSelector: newSrcListChapter.trim() || undefined,
      
      detailTitleSelector: newSrcDetailTitle.trim() || 'h1',
      detailDescSelector: newSrcDetailDesc.trim() || 'p',
      detailAuthorSelector: newSrcDetailAuthor.trim() || 'span',
      detailArtistSelector: newSrcDetailArtist.trim() || 'span',
      detailStatusSelector: newSrcDetailStatus.trim() || 'span',
      detailGenreSelector: newSrcDetailGenre.trim() || 'a',
      
      detailChapterItemSelector: newSrcChItem.trim() || 'li',
      detailChapterLinkSelector: newSrcChLink.trim() || 'a',
      detailChapterTitleSelector: newSrcChTitle.trim() || 'span',
      
      pageImgSelector: newSrcPageImg.trim() || 'img',
      pageImgAttr: newSrcPageImgAttr.trim() || 'src'
    };

    if (onAddSource) {
      onAddSource(newSource);
      triggerToast(`تم بنجاح تثبيت المصدر البرمجي الجديد "${newSrcName}"!`);
      
      // Reset Form
      setNewSrcId('');
      setNewSrcName('');
      setNewSrcBaseUrl('');
      setNewSrcPopularPath('');
      setNewSrcListCard('');
      setNewSrcListTitle('');
      setNewSrcListLink('');
      setNewSrcListCover('');
      setNewSrcListCoverAttr('src');
      setNewSrcListChapter('');
      setNewSrcDetailTitle('');
      setNewSrcDetailDesc('');
      setNewSrcDetailAuthor('');
      setNewSrcDetailArtist('');
      setNewSrcDetailStatus('');
      setNewSrcDetailGenre('');
      setNewSrcChItem('');
      setNewSrcChLink('');
      setNewSrcChTitle('');
      setNewSrcPageImg('');
      setNewSrcPageImgAttr('src');
    }
  };

  // Run tester query
  const handleTestSelector = async () => {
    if (!testUrl.trim() || !testSelectorStr.trim()) {
      triggerError('يرجى إدخال رابط الصفحة ومحدد CSS المراد فحصه.');
      return;
    }
    setTesting(true);
    setTestResults([]);
    try {
      const results = await testSelector(testUrl.trim(), testSelectorStr.trim(), testAttr.trim() || undefined);
      setTestResults(results);
    } catch (err: any) {
      setTestResults([`حدث خطأ أثناء فحص المحدد: ${err.message}`]);
    } finally {
      setTesting(false);
    }
  };

  // Toast notifier helper
  const triggerToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Error Toast notifier helper
  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Smart Pre-configured presets for common manga web structures
  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey === 'custom') {
      return;
    }
    
    if (presetKey === 'azorafly') {
      setNewSrcId('azorafly');
      setNewSrcName('Azora Manga (الرسمي)');
      setNewSrcBaseUrl('https://azorafly.com');
      setNewSrcPopularPath('/series/');
      setNewSrcListCard('div.bg-card.text-card-foreground, div.rounded-xl.border');
      setNewSrcListTitle('a.font-bold, a.text-sm');
      setNewSrcListLink('a.font-bold, a.text-sm');
      setNewSrcListCover('img');
      setNewSrcListCoverAttr('src');
      setNewSrcListChapter('a[href*="/chapter-"]');
      
      setNewSrcDetailTitle('h1[itemProp="name"], h1');
      setNewSrcDetailDesc('div[itemProp="description"], [itemProp="description"]');
      setNewSrcDetailAuthor('[itemprop="author"]');
      setNewSrcDetailArtist('[itemprop="artist"]');
      setNewSrcDetailStatus('[itemprop="status"]');
      setNewSrcDetailGenre('[itemProp="genre"], a[href*="/genre/"]');
      
      setNewSrcChItem('a[href*="/chapter-"]:not(:has(button))');
      setNewSrcChLink('a');
      setNewSrcChTitle('span.font-medium, span');
      setNewSrcPageImg('img[data-reader-page-image]');
      setNewSrcPageImgAttr('src');
    } else if (presetKey === 'madara') {
      setNewSrcId('madara-src');
      setNewSrcName('موقع بنظام ووردبريس مادارا');
      setNewSrcBaseUrl('https://example.com');
      setNewSrcPopularPath('/manga/');
      setNewSrcListCard('.manga-entry, .page-item-detail');
      setNewSrcListTitle('.post-title a');
      setNewSrcListLink('.post-title a');
      setNewSrcListCover('img');
      setNewSrcListCoverAttr('src');
      setNewSrcListChapter('.chapter-item a');
      
      setNewSrcDetailTitle('.post-title h1, .post-content h1');
      setNewSrcDetailDesc('.description-summary, .manga-about');
      setNewSrcDetailAuthor('.author-content a');
      setNewSrcDetailArtist('.artist-content a');
      setNewSrcDetailStatus('.summary-content');
      setNewSrcDetailGenre('.genres-content a');
      
      setNewSrcChItem('li.wp-manga-chapter');
      setNewSrcChLink('a');
      setNewSrcChTitle('a');
      setNewSrcPageImg('.page-break img, .wp-manga-chapter-img');
      setNewSrcPageImgAttr('src');
    } else if (presetKey === 'mangareader') {
      setNewSrcId('mangareader-src');
      setNewSrcName('موقع بنظام مانجا ريدر');
      setNewSrcBaseUrl('https://example.com');
      setNewSrcPopularPath('/');
      setNewSrcListCard('.bs, .utao');
      setNewSrcListTitle('.tt, h3');
      setNewSrcListLink('a');
      setNewSrcListCover('img');
      setNewSrcListCoverAttr('src');
      setNewSrcListChapter('.epxs a');
      
      setNewSrcDetailTitle('.entry-title');
      setNewSrcDetailDesc('.entry-content');
      setNewSrcDetailAuthor('.author');
      setNewSrcDetailArtist('.artist');
      setNewSrcDetailStatus('.status');
      setNewSrcDetailGenre('.genres a');
      
      setNewSrcChItem('#cl li, #chapterlist li');
      setNewSrcChLink('a');
      setNewSrcChTitle('.chaptext');
      setNewSrcPageImg('#readerarea img');
      setNewSrcPageImgAttr('src');
    }
  };

  // Category toggle helper
  const handleCategoryToggle = (cat: string) => {
    setSelectedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Handle Add Manhua submit
  const handleCreateManhua = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manhuaTitle.trim() || !manhuaCoverUrl.trim() || !manhuaDescription.trim()) {
      triggerError('يرجى ملء الحقول الأساسية: العنوان، رابط الغلاف، والوصف.');
      return;
    }

    const newId = 'manhua-' + Date.now();
    const newManhua: Manhua = {
      id: newId,
      title: manhuaTitle.trim(),
      englishTitle: manhuaEnglishTitle.trim() || undefined,
      coverUrl: manhuaCoverUrl.trim(),
      bannerUrl: manhuaBannerUrl.trim() || undefined,
      description: manhuaDescription.trim(),
      rating: Number(manhuaRating),
      views: Math.floor(Math.random() * 500) + 10, // start with some default organic views
      status: manhuaStatus,
      author: manhuaAuthor.trim() || 'غير معروف',
      artist: manhuaArtist.trim() || 'غير معروف',
      categories: selectedCats.length > 0 ? selectedCats : ['عام'],
      releaseYear: Number(manhuaReleaseYear),
      isFeatured: manhuaIsFeatured,
      isTrending: manhuaIsTrending,
      chapters: []
    };

    onAddManhua(newManhua);
    triggerToast(`تمت إضافة مانهو "${manhuaTitle}" بنجاح!`);
    
    // Clear Form
    setManhuaTitle('');
    setManhuaEnglishTitle('');
    setManhuaCoverUrl('');
    setManhuaBannerUrl('');
    setManhuaDescription('');
    setManhuaRating(4.5);
    setManhuaStatus('مستمر');
    setManhuaAuthor('');
    setManhuaArtist('');
    setManhuaReleaseYear(2026);
    setManhuaIsFeatured(false);
    setManhuaIsTrending(false);
    setSelectedCats([]);
  };

  // Handle Add Chapter submit
  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManhuaId) {
      triggerError('يرجى اختيار المانهو التي ترغب في إضافة الفصل إليها أولاً.');
      return;
    }
    if (!chapterTitle.trim()) {
      triggerError('يرجى إدخال عنوان للفصل.');
      return;
    }
    if (!chapterPagesText.trim()) {
      triggerError('يرجى إدخال روابط صور الصفحات.');
      return;
    }

    // Split pasted lines to extract clean image URLs
    const pageUrls = chapterPagesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('http://') || line.startsWith('https://') || line.length > 5);

    if (pageUrls.length === 0) {
      triggerError('لم يتم العثور على أي روابط صور صالحة. يرجى إدخال رابط واحد في كل سطر.');
      return;
    }

    const targetManhua = manhuas.find(m => m.id === selectedManhuaId);
    if (!targetManhua) return;

    const newChapterId = 'chapter-' + Date.now();
    const newChapter: Chapter = {
      id: newChapterId,
      manhuaId: selectedManhuaId,
      title: chapterTitle.trim(),
      chapterNumber: Number(chapterNumber),
      releaseDate: new Date().toISOString(),
      pages: pageUrls,
      views: 0
    };

    // Add chapter and sort chapters by chapter number ascending
    const updatedChapters = [...targetManhua.chapters, newChapter].sort(
      (a, b) => a.chapterNumber - b.chapterNumber
    );

    const updatedManhua = {
      ...targetManhua,
      chapters: updatedChapters
    };

    onUpdateManhua(updatedManhua);
    triggerToast(`تمت إضافة "${chapterTitle}" بنجاح إلى مانهو ${targetManhua.title}!`);

    // Reset Form
    setChapterNumber(prev => prev + 1);
    setChapterTitle('');
    setChapterPagesText('');
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 pt-4 animate-fade-in space-y-6" id="admin-view-container">
      
      {/* Toast Alert */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border-2 border-emerald-500 text-emerald-200 px-5 py-3 rounded-2xl flex items-center gap-2 shadow-2xl animate-fade-in font-semibold text-xs">
          <Check className="w-5 h-5 text-emerald-500 animate-bounce" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Admin Title Banner */}
      <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 text-right">
          <div className="w-12 h-12 bg-red-600/10 border border-red-500/30 rounded-xl flex items-center justify-center text-red-500 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-100 font-display">لوحة الإدارة الفنية</h1>
            <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
              <Terminal className="w-3 h-3 text-red-500" />
              <span>المشرف الحالي: rkieeamne@gmail.com</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('add-manhua')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'add-manhua' 
                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/20' 
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مانهو</span>
          </button>

          <button
            onClick={() => setActiveTab('add-chapter')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'add-chapter' 
                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/20' 
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <FilePlus className="w-4 h-4" />
            <span>إضافة فصل قراءة</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'manage' 
                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/20' 
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>إدارة الأعمال ({manhuas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'sources' 
                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/20' 
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>إدارة المصادر البرمجية ({sources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('appwrite')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'appwrite' 
                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/20' 
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4 text-pink-400" />
            <span>ربط Appwrite والإعلانات</span>
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'advanced' 
                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/20' 
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>الخيارات المتقدمة</span>
          </button>

          <button
            onClick={handleLockAdminMode}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border bg-zinc-900/80 border-red-900/60 text-red-400 hover:bg-red-950 hover:text-white"
            title="قفل وإخفاء لوحة الأدمن من العرض"
          >
            <Lock className="w-4 h-4" />
            <span>قفل الأدمن</span>
          </button>
        </div>
      </div>

      {/* CORE TAB WORKSPACE PANEL */}
      <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl p-6">

        {/* TAB 1: ADD NEW MANHUA FORM */}
        {activeTab === 'add-manhua' && (
          <form onSubmit={handleCreateManhua} className="space-y-6 text-right">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-black text-zinc-200 flex items-center gap-2 justify-end">
                <span>تعبئة بيانات عمل مانهو جديد</span>
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              </h2>
              <p className="text-[10px] text-zinc-500 mt-1">
                املأ الحقول التالية بعناية ليتم إدراج العمل فوراً في الصفحة الرئيسية والبحث.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">رابط صورة الغلاف (Cover URL) *</label>
                  <input 
                    type="url" 
                    required
                    placeholder="https://images.unsplash.com/photo-..." 
                    value={manhuaCoverUrl}
                    onChange={(e) => setManhuaCoverUrl(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all text-left dir-ltr"
                  />
                  <p className="text-[9px] text-zinc-500">صورة ذات أبعاد طولية للغلاف الرئيسي للمانهو.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">رابط صورة الخلفية (Banner URL - اختياري)</label>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/photo-..." 
                    value={manhuaBannerUrl}
                    onChange={(e) => setManhuaBannerUrl(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all text-left dir-ltr"
                  />
                  <p className="text-[9px] text-zinc-500">صورة عريضة ذات جودة عالية تظهر كخلفية لصفحة تفاصيل المانهو.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">التقييم (1 - 5) *</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="1" 
                      max="5"
                      required
                      value={manhuaRating}
                      onChange={(e) => setManhuaRating(Number(e.target.value))}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all text-center"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">سنة الإصدار *</label>
                    <input 
                      type="number" 
                      required
                      value={manhuaReleaseYear}
                      onChange={(e) => setManhuaReleaseYear(Number(e.target.value))}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-3 bg-zinc-900/20 border border-zinc-800/80 rounded-xl cursor-pointer hover:bg-zinc-900/40 select-none justify-end">
                    <span className="text-xs text-zinc-300 font-bold">تثبيت كعمل مميز رئيسي</span>
                    <input 
                      type="checkbox" 
                      checked={manhuaIsFeatured}
                      onChange={(e) => setManhuaIsFeatured(e.target.checked)}
                      className="rounded accent-red-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-zinc-900/20 border border-zinc-800/80 rounded-xl cursor-pointer hover:bg-zinc-900/40 select-none justify-end">
                    <span className="text-xs text-zinc-300 font-bold">تثبيت في الرائج (Trending)</span>
                    <input 
                      type="checkbox" 
                      checked={manhuaIsTrending}
                      onChange={(e) => setManhuaIsTrending(e.target.checked)}
                      className="rounded accent-red-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Right Column Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">العنوان باللغة العربية *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: بداية جديدة بعد الموت" 
                    value={manhuaTitle}
                    onChange={(e) => setManhuaTitle(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">العنوان باللغة الإنجليزية (اختياري)</label>
                  <input 
                    type="text" 
                    placeholder="مثال: The Beginning After The End" 
                    value={manhuaEnglishTitle}
                    onChange={(e) => setManhuaEnglishTitle(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">الكاتب (Author)</label>
                    <input 
                      type="text" 
                      placeholder="مثال: TurtleMe" 
                      value={manhuaAuthor}
                      onChange={(e) => setManhuaAuthor(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">الرسام (Artist)</label>
                    <input 
                      type="text" 
                      placeholder="مثال: Fuyuki23" 
                      value={manhuaArtist}
                      onChange={(e) => setManhuaArtist(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">حالة العمل *</label>
                  <select 
                    value={manhuaStatus}
                    onChange={(e) => setManhuaStatus(e.target.value as ManhuaStatus)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all"
                  >
                    <option value="مستمر">مستمر (Ongoing)</option>
                    <option value="مكتمل">مكتمل (Completed)</option>
                    <option value="متوقف مؤقتاً">متوقف مؤقتاً (Hiatus)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">قصة المانهو / الوصف *</label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="اكتب هنا ملخصاً تشويقياً لقصة المانهو..." 
                    value={manhuaDescription}
                    onChange={(e) => setManhuaDescription(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Categories Select Multi Cloud */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 block">تصنيفات العمل (اختر تصنيفاً واحداً أو أكثر)</label>
              <div className="flex flex-wrap gap-2 justify-end">
                {AVAILABLE_CATEGORIES.map((cat) => {
                  const isSelected = selectedCats.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-red-600/20 border-red-500 text-red-400 font-extrabold' 
                          : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-4 flex justify-start">
              <button 
                type="submit"
                className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-lg hover:shadow-red-950/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء المانهو وحفظها</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ADD NEW CHAPTER FORM */}
        {activeTab === 'add-chapter' && (
          <form onSubmit={handleCreateChapter} className="space-y-6 text-right">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-black text-zinc-200 flex items-center gap-2 justify-end">
                <span>إضافة فصل قراءة لعمل مضاف مسبقاً</span>
                <FilePlus className="w-4 h-4 text-red-500 animate-pulse" />
              </h2>
              <p className="text-[10px] text-zinc-500 mt-1">
                اختر المانهو المطلوبة، ثم حدد رقم الفصل وعنوانه، والصق روابط صور الصفحات المكونة للفصل.
              </p>
            </div>

            {manhuas.length === 0 ? (
              <div className="bg-zinc-950/50 border border-dashed border-zinc-800 rounded-2xl py-12 text-center space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-zinc-700" />
                <h3 className="text-xs font-bold text-zinc-300">لا يوجد أي مانهو مضافة حتى الآن!</h3>
                <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">
                  يجب عليك أولاً إنشاء عمل مانهو واحد على الأقل في التبويب الأول قبل أن تتمكن من إضافة فصول قراءة إليه.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('add-manhua')}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                >
                  الذهاب لإضافة مانهو الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Images pasted text area (Left side) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 block">روابط صور صفحات الفصل (رابط واحد في كل سطر) *</label>
                  <textarea 
                    rows={12}
                    required
                    placeholder="https://images.unsplash.com/photo-1541963463532-d68292c34b19&#10;https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1&#10;https://images.unsplash.com/photo-1516259762381-22954d7d3ad2" 
                    value={chapterPagesText}
                    onChange={(e) => setChapterPagesText(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-[10px] font-mono outline-none transition-all text-left dir-ltr"
                  />
                  <p className="text-[9px] text-zinc-500 leading-relaxed text-right">
                    💡 <strong>تلميح:</strong> الصق روابط صور الفصل بشكل متسلسل، رابط صورة كامل لكل سطر (مباشر).
                  </p>
                </div>

                {/* Chapter details fields (Right side) */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">اختر المانهو المستهدفة *</label>
                    <select 
                      required
                      value={selectedManhuaId}
                      onChange={(e) => setSelectedManhuaId(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all"
                    >
                      <option value="">-- اختر من القائمة --</option>
                      {manhuas.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">رقم الفصل (Chapter Number) *</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={chapterNumber}
                      onChange={(e) => setChapterNumber(Number(e.target.value))}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all text-center"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">عنوان الفصل بالكامل *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: الفصل 1: بداية الأسطورة" 
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-xl px-3.5 py-2 text-xs outline-none transition-all"
                    />
                    <p className="text-[9px] text-zinc-500">سيتم عرض هذا العنوان في لوحة القراءة والفصول.</p>
                  </div>

                  <div className="p-4 bg-zinc-900/20 border border-zinc-800 rounded-xl text-xs space-y-1.5 text-zinc-400 leading-relaxed">
                    <p className="font-bold text-zinc-300">📌 ملاحظات النشر السريع:</p>
                    <p>• تاريخ النشر يتم تعيينه تلقائياً ليكون التاريخ الحالي.</p>
                    <p>• سيتم ترتيب فصول المانهو تصاعدياً طبقاً لرقم الفصل.</p>
                  </div>
                </div>
              </div>
            )}

            {manhuas.length > 0 && (
              <div className="border-t border-zinc-900 pt-4 flex justify-start">
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow-lg hover:shadow-red-950/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة الفصل ونشره فوراً</span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* TAB 3: MANAGE EXISTING MANHUAS */}
        {activeTab === 'manage' && (
          <div className="space-y-6 text-right">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-black text-zinc-200 flex items-center gap-2 justify-end">
                <span>التحكم في المانهوات المنشورة وتعديلها</span>
                <BookOpen className="w-4 h-4 text-red-500" />
              </h2>
              <p className="text-[10px] text-zinc-500 mt-1">
                فيما يلي قائمة بكافة الأعمال النشطة المخزنة في النظام حالياً. يمكنك حذفها أو استعراض فصولها.
              </p>
            </div>

            {manhuas.length === 0 ? (
              <div className="bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl py-20 text-center space-y-4">
                <Database className="w-12 h-12 mx-auto text-zinc-800 stroke-1" />
                <h3 className="text-sm font-bold text-zinc-400">قاعدة البيانات خالية تماماً!</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  لم تضف أي مانهو بعد. استخدم تبويب "إضافة مانهو" في الأعلى لملء الموقع بقصصك الفريدة.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-850">
                <table className="w-full text-xs text-zinc-400 border-collapse">
                  <thead className="bg-zinc-900/50 text-zinc-300 font-bold border-b border-zinc-800">
                    <tr>
                      <th className="p-3 text-center w-16">إجراءات</th>
                      <th className="p-3 text-center">الفصول</th>
                      <th className="p-3 text-center">المشاهدات</th>
                      <th className="p-3 text-center">سنة الإصدار</th>
                      <th className="p-3 text-center">التقييم</th>
                      <th className="p-3 text-center">الحالة</th>
                      <th className="p-3 text-right">عنوان العمل والكاتب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {manhuas.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-900/30 transition-colors">
                        
                        {/* Actions */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              askConfirmation(
                                'حذف المانهو',
                                `هل أنت متأكد من رغبتك في حذف مانهو "${m.title}" وجميع فصولها بالكامل؟ الإجراء غير قابل للتراجع.`,
                                () => {
                                  onDeleteManhua(m.id);
                                  triggerToast(`تم حذف مانهو "${m.title}" بنجاح!`);
                                }
                              );
                            }}
                            className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-600 border border-red-900/30 hover:border-red-500 text-red-400 hover:text-white transition-all cursor-pointer"
                            title="حذف المانهو"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>

                        {/* Chapters Count */}
                        <td className="p-3 text-center font-bold text-red-400">
                          {m.chapters.length} فصول
                        </td>

                        {/* Views */}
                        <td className="p-3 text-center font-mono">
                          {m.views.toLocaleString()}
                        </td>

                        {/* Year */}
                        <td className="p-3 text-center font-mono">
                          {m.releaseYear}
                        </td>

                        {/* Rating */}
                        <td className="p-3 text-center font-bold text-amber-400">
                          ⭐ {m.rating}
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'مستمر' 
                              ? 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-400' 
                              : m.status === 'مكتمل'
                                ? 'bg-indigo-950/30 border border-indigo-900/50 text-indigo-400'
                                : 'bg-amber-950/30 border border-amber-900/50 text-amber-400'
                          }`}>
                            {m.status}
                          </span>
                        </td>

                        {/* Title and cover info */}
                        <td className="p-3 text-right">
                          <div className="flex items-center gap-3 justify-end">
                            <div>
                              <h3 className="font-bold text-zinc-100">{m.title}</h3>
                              <p className="text-[10px] text-zinc-500 mt-0.5">الكاتب: {m.author} | {m.categories.join('، ')}</p>
                            </div>
                            <img 
                              src={m.coverUrl || undefined} 
                              alt={m.title} 
                              className="w-8 h-10 object-cover rounded border border-zinc-800"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ADVANCED OPTIONS */}
        {activeTab === 'advanced' && (
          <div className="space-y-6 text-right max-w-xl mx-auto">
            <div className="border-b border-zinc-800 pb-3 text-center">
              <Database className="w-10 h-10 mx-auto text-red-500 mb-2 animate-bounce" />
              <h2 className="text-sm font-black text-zinc-200">
                أدوات التحكم بقاعدة البيانات وتخزين المتصفح
              </h2>
              <p className="text-[10px] text-zinc-500 mt-1">
                هذه الإجراءات تمكنك من مسح كافة التعديلات أو استعادة البيانات التوضيحية الافتراضية للتجربة والتحقق.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Reset to Default */}
              <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex items-center justify-between gap-4">
                <button
                  onClick={() => {
                    askConfirmation(
                      'استعادة البيانات الافتراضية',
                      'هل أنت متأكد من رغبتك في استعادة المانهوات والفصول التجريبية الافتراضية؟ سيتم دمجها مع أعمالك أو استبدالها.',
                      () => {
                        onRestoreDefaults();
                        triggerToast('تمت استعادة المانهوات الافتراضية والفصول بنجاح!');
                      }
                    );
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>استعادة المانهو الافتراضية</span>
                </button>
                <div className="text-right">
                  <h4 className="text-xs font-bold text-zinc-300">تعبئة تلقائية توضيحية</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    يقوم بتحميل 3 أعمال مانهو مميزة مع فصول قراءة جاهزة وصفحات بجودة فائقة السرعة لاختبار المظهر العام.
                  </p>
                </div>
              </div>

              {/* Clear All Database */}
              <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-2xl flex items-center justify-between gap-4">
                <button
                  onClick={() => {
                    askConfirmation(
                      'حذف وتصفير كافة البيانات',
                      '⚠️ تحذير: هل أنت متأكد من مسح جميع المانهوات والفصول بالكامل؟ هذا الإجراء لا يمكن التراجع عنه.',
                      () => {
                        onClearAllManhuas();
                        triggerToast('تم تصفير وحذف جميع المانهوات بنجاح!');
                      }
                    );
                  }}
                  className="px-4 py-2 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/30 hover:border-red-500 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف كافة البيانات وتصفيرها</span>
                </button>
                <div className="text-right">
                  <h4 className="text-xs font-bold text-red-400">تفريغ قاعدة البيانات (كامل)</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    يحذف جميع المانهو والفصول والصفحات من الذاكرة المحلية لتبدأ بلوحة فارغة تماماً لرفع أعمالك الخاصة.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: SCRAPER SOURCES & SCRAPERS */}
        {activeTab === 'sources' && (
          <div className="space-y-8 text-right">
            
            {/* Guide header */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <Globe className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-zinc-200">إضافات Mihon و كواشط الويب الديناميكية (Web Scraping)</h2>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    يعتمد الموقع على محرك كشط ويب مرن مستوحى من نظام إضافات Mihon (Tachiyomi سابقاً). بدلاً من تخزين وتوليد الفصول والصور محلياً، يمكنك تحديد موقع ويب كمصدر، وإدخال محددات CSS (CSS Selectors) الدقيقة لتقوم لوحتنا وقنوات البروكسي بجلب الفصول، الغلاف، والصفحات المصورة عالية الجودة لحظياً من الموقع المصدر مباشرة دون تخزينها في الخادم!
                  </p>
                </div>
              </div>
            </div>

            {/* Grid layout: Active list vs. Create Source form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form panel to create dynamic sources (8 columns) */}
              <div className="lg:col-span-8 bg-zinc-900/20 border border-zinc-850 rounded-2xl p-6 space-y-6">
                <div className="border-b border-zinc-800 pb-2">
                  <h3 className="text-xs font-black text-zinc-300 flex items-center gap-1.5 justify-end">
                    <span>إضافة مصدر كاشط مخصص</span>
                    <Plus className="w-4 h-4 text-red-500" />
                  </h3>
                  <p className="text-[9px] text-zinc-500">
                    أدخل معلومات المصدر مع محددات CSS المطابقة لبنية الموقع المراد استهدافه.
                  </p>
                </div>

                <form onSubmit={handleCreateSource} className="space-y-6">
                  
                  {/* Preset Templates */}
                  <div className="bg-zinc-950/60 p-4 border border-zinc-850 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-black text-amber-500 flex items-center gap-1 justify-end">
                      <span>⚡ الإعداد الذكي الفوري (قوالب المواقع الجاهزة)</span>
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    </h4>
                    <p className="text-[9px] text-zinc-500 leading-relaxed">
                      التعامل مع المحددات معقد؟ لا تقلق! اختر أحد القوالب الشائعة أدناه لتعبئة محددات الـ CSS ومسارات الكشط تلقائياً، ثم قم فقط بتغيير رابط الموقع والاسم ليناسب الموقع المستهدف!
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => applyPreset('azorafly')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          selectedPreset === 'azorafly'
                            ? 'bg-red-950/30 border-red-500 text-red-400'
                            : 'bg-zinc-900/30 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-[10px] font-bold">قالب ازورا مانجا الرسمي</span>
                        <span className="text-[8px] opacity-75 font-mono">azorafly.com</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => applyPreset('madara')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          selectedPreset === 'madara'
                            ? 'bg-amber-950/30 border-amber-500 text-amber-400'
                            : 'bg-zinc-900/30 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-[10px] font-bold">قالب ووردبريس مادارا (Madara WP)</span>
                        <span className="text-[8px] opacity-75">معظم المواقع بنظام Madara</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPreset('mangareader')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          selectedPreset === 'mangareader'
                            ? 'bg-blue-950/30 border-blue-500 text-blue-400'
                            : 'bg-zinc-900/30 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-[10px] font-bold">قالب مانجا ريدر (MangaReader)</span>
                        <span className="text-[8px] opacity-75">المواقع ذات القوالب الكلاسيكية الخفيفة</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Basic settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400">اسم المصدر (مثال: مانجا سلاير) *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="MangaFire (Dynamic)"
                        value={newSrcName}
                        onChange={e => setNewSrcName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-lg px-3 py-1.5 text-xs outline-none transition-all text-right"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400">معرّف المصدر الفريد (بأحرف إنجليزية صغيرة) *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="mangafire"
                        value={newSrcId}
                        onChange={e => setNewSrcId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-lg px-3 py-1.5 text-xs outline-none transition-all text-left font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400">المسار الشائع للأعمال الأكثر مشاهدة (Popular Path)</label>
                      <input 
                        type="text" 
                        placeholder="/filter?sort=views (اتركه فارغاً للمسار الرئيسي)"
                        value={newSrcPopularPath}
                        onChange={e => setNewSrcPopularPath(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-lg px-3 py-1.5 text-xs outline-none transition-all text-left font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400">رابط الموقع الأساسي (Base URL) *</label>
                      <input 
                        type="url" 
                        required
                        placeholder="https://mangafire.to"
                        value={newSrcBaseUrl}
                        onChange={e => setNewSrcBaseUrl(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 text-zinc-200 rounded-lg px-3 py-1.5 text-xs outline-none transition-all text-left font-mono"
                      />
                    </div>
                  </div>

                  {/* Section 1: List View */}
                  <div className="space-y-3 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
                    <h4 className="text-[10px] font-black text-red-500 flex items-center gap-1 justify-end">
                      <span>1. إعدادات قائمة الأعمال (الصفحة الرئيسية / الفهرس)</span>
                      <Settings className="w-3.5 h-3.5" />
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">كرت العمل (Card Selector)</label>
                        <input 
                          type="text" 
                          placeholder="div.manga-box" 
                          value={newSrcListCard}
                          onChange={e => setNewSrcListCard(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">محدد عنوان العمل (Title)</label>
                        <input 
                          type="text" 
                          placeholder="a.manga-title" 
                          value={newSrcListTitle}
                          onChange={e => setNewSrcListTitle(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">محدد رابط العمل (Link)</label>
                        <input 
                          type="text" 
                          placeholder="a.manga-title" 
                          value={newSrcListLink}
                          onChange={e => setNewSrcListLink(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">محدد صورة الغلاف (Cover)</label>
                        <input 
                          type="text" 
                          placeholder="img.lazy" 
                          value={newSrcListCover}
                          onChange={e => setNewSrcListCover(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">خاصية الغلاف (Cover Attribute)</label>
                        <input 
                          type="text" 
                          placeholder="src أو data-src" 
                          value={newSrcListCoverAttr}
                          onChange={e => setNewSrcListCoverAttr(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">محدد الفصل الأخير (اختياري)</label>
                        <input 
                          type="text" 
                          placeholder="a.chapter-link" 
                          value={newSrcListChapter}
                          onChange={e => setNewSrcListChapter(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Detail View */}
                  <div className="space-y-3 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
                    <h4 className="text-[10px] font-black text-red-500 flex items-center gap-1 justify-end">
                      <span>2. إعدادات صفحة تفاصيل المانهو وفصولها</span>
                      <Settings className="w-3.5 h-3.5" />
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">عنوان العمل بالصفحة</label>
                        <input 
                          type="text" 
                          placeholder="h1.title" 
                          value={newSrcDetailTitle}
                          onChange={e => setNewSrcDetailTitle(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">الوصف أو القصة (Description)</label>
                        <input 
                          type="text" 
                          placeholder="div.summary" 
                          value={newSrcDetailDesc}
                          onChange={e => setNewSrcDetailDesc(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">محدد المؤلف (Author)</label>
                        <input 
                          type="text" 
                          placeholder="span.author" 
                          value={newSrcDetailAuthor}
                          onChange={e => setNewSrcDetailAuthor(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">محدد الرسام (Artist)</label>
                        <input 
                          type="text" 
                          placeholder="span.artist" 
                          value={newSrcDetailArtist}
                          onChange={e => setNewSrcDetailArtist(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">محدد حالة النشر (Status)</label>
                        <input 
                          type="text" 
                          placeholder="span.status" 
                          value={newSrcDetailStatus}
                          onChange={e => setNewSrcDetailStatus(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">محدد التصنيفات (Genres)</label>
                        <input 
                          type="text" 
                          placeholder="div.genres a" 
                          value={newSrcDetailGenre}
                          onChange={e => setNewSrcDetailGenre(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-900 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">سطر الفصل (Chapter Row Selector)</label>
                        <input 
                          type="text" 
                          placeholder="li.chapter-item" 
                          value={newSrcChItem}
                          onChange={e => setNewSrcChItem(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">محدد رابط الفصل داخل السطر</label>
                        <input 
                          type="text" 
                          placeholder="a.chapter-link" 
                          value={newSrcChLink}
                          onChange={e => setNewSrcChLink(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">محدد عنوان ورقم الفصل داخل السطر</label>
                        <input 
                          type="text" 
                          placeholder="span.chapter-title" 
                          value={newSrcChTitle}
                          onChange={e => setNewSrcChTitle(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Reader Pages View */}
                  <div className="space-y-3 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
                    <h4 className="text-[10px] font-black text-red-500 flex items-center gap-1 justify-end">
                      <span>3. إعدادات صفحات القراءة والمشاهد (الصور)</span>
                      <Settings className="w-3.5 h-3.5" />
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">محدد صور صفحات الفصل (Page Image Selector)</label>
                        <input 
                          type="text" 
                          placeholder="div.container-images img" 
                          value={newSrcPageImg}
                          onChange={e => setNewSrcPageImg(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500">الخاصية التي تحتوي على رابط الصورة الحقيقي</label>
                        <input 
                          type="text" 
                          placeholder="src أو data-src" 
                          value={newSrcPageImgAttr}
                          onChange={e => setNewSrcPageImgAttr(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 text-xs outline-none font-mono text-left"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="text-left pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-950/30"
                    >
                      <Check className="w-4 h-4" />
                      <span>حفظ وتثبيت المصدر البرمجي</span>
                    </button>
                  </div>

                </form>

              </div>

              {/* Sidebar: Active Sources list & Selector tester (4 columns) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Active Sources */}
                <div className="bg-zinc-900/20 border border-zinc-850 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h3 className="text-xs font-black text-zinc-300 flex items-center gap-1.5 justify-end">
                      <span>المصادر المثبتة حالياً</span>
                      <Globe className="w-4 h-4 text-emerald-500" />
                    </h3>
                    <button
                      onClick={() => {
                        askConfirmation(
                          'استعادة المصادر الافتراضية',
                          'هل أنت متأكد من رغبتك في استعادة جميع مصادر الكشط الافتراضية؟ سيؤدي هذا إلى حذف المصادر المضافة يدوياً.',
                          () => {
                            if (onRestoreSources) {
                              onRestoreSources();
                              triggerToast('تمت استعادة مصادر الكشط الافتراضية بنجاح!');
                            }
                          }
                        );
                      }}
                      className="text-[9px] font-bold text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      استعادة الافتراضي
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {sources.map(source => {
                      const isDefault = source.id === 'azorafly';
                      return (
                        <div 
                          key={source.id} 
                          className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 text-right"
                        >
                          {/* Actions */}
                          <div>
                            {isDefault ? (
                              <span className="px-2 py-0.5 rounded bg-amber-950/30 border border-amber-900/50 text-amber-500 text-[8px] font-black">
                                تلقائي
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  askConfirmation(
                                    'حذف مصدر الكشط',
                                    `هل أنت متأكد من رغبتك في حذف وإلغاء تثبيت مصدر "${source.name}"؟`,
                                    () => {
                                      if (onDeleteSource) {
                                        onDeleteSource(source.id);
                                        triggerToast(`تم إزالة مصدر "${source.name}"!`);
                                      }
                                    }
                                  );
                                }}
                                className="p-1 rounded-lg bg-red-950/30 text-red-400 hover:bg-red-600 hover:text-white transition-colors border border-red-900/30 hover:border-red-500 cursor-pointer"
                                title="حذف المصدر"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Source Details */}
                          <div>
                            <h4 className="text-[11px] font-black text-zinc-200">{source.name}</h4>
                            <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">{source.baseUrl}</span>
                            <span className="inline-block px-1.5 py-0.2 bg-zinc-900 text-zinc-400 font-mono text-[8px] rounded border border-zinc-800 mt-1">
                              ID: {source.id}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CSS Selector Sandbox Live Tester */}
                <div className="bg-zinc-900/20 border border-zinc-850 rounded-2xl p-5 space-y-4">
                  <div className="border-b border-zinc-800 pb-2">
                    <h3 className="text-xs font-black text-zinc-300 flex items-center gap-1.5 justify-end">
                      <span>صندوق تجربة المحدّدات المباشر</span>
                      <Code className="w-4 h-4 text-amber-500 animate-pulse" />
                    </h3>
                    <p className="text-[9px] text-zinc-500 leading-relaxed">
                      اختبر صحة محددات الـ CSS ومطابقتها قبل كتابتها في النموذج للتأكد من نجاح الكشط.
                    </p>
                  </div>

                  <div className="space-y-3 text-right">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 block">رابط الصفحة للتجربة (Test Target URL)</label>
                      <input 
                        type="url" 
                        placeholder="https://m.manganelo.com/manga-..." 
                        value={testUrl}
                        onChange={e => setTestUrl(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1.5 text-xs outline-none font-mono text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 block">محدّد الـ CSS المطلوب فحصه (CSS Selector)</label>
                      <input 
                        type="text" 
                        placeholder="div.manga-info h1" 
                        value={testSelectorStr}
                        onChange={e => setTestSelectorStr(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1.5 text-xs outline-none font-mono text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 block">خاصية العنصر المستهدفة (مثلاً src أو href أو اتركه للنص)</label>
                      <input 
                        type="text" 
                        placeholder="src أو href (أو اتركه فارغاً لجلب النص الداخلي)" 
                        value={testAttr}
                        onChange={e => setTestAttr(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1.5 text-xs outline-none font-mono text-left"
                      />
                    </div>

                    <button
                      onClick={handleTestSelector}
                      disabled={testing}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري فحص الصفحة البعيدة...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>فحص ومطابقة المحدّد</span>
                        </>
                      )}
                    </button>

                    {testResults.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-zinc-400 block">نتائج المطابقة المباشرة:</span>
                        <div className="bg-black/80 border border-zinc-800 rounded-lg p-2.5 max-h-48 overflow-y-auto font-mono text-[9px] text-zinc-300 space-y-1 text-left dir-ltr">
                          {testResults.map((res, i) => (
                            <div key={i} className="border-b border-zinc-900 pb-1 last:border-0 truncate" title={res}>
                              <span className="text-amber-500 select-none mr-1">[{i + 1}]</span>
                              {res}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 6: APPWRITE & ADS MANAGEMENT */}
        {activeTab === 'appwrite' && (
          <div className="space-y-8 text-right">
            {/* Header & Description */}
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-sm font-black text-zinc-200 flex items-center gap-2 justify-end">
                <span>إدارة خادم Appwrite ونشر الإعلانات</span>
                <Cloud className="w-5 h-5 text-pink-500 animate-pulse" />
              </h2>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                يمكنك ربط تطبيقك بخدمة Appwrite Cloud أو خادمك الخاص لتخزين وتغيير الإعلانات والإشعارات ديناميكياً بدون الحاجة للتعديل في كود التطبيق.
              </p>
            </div>

            {/* Appwrite Credentials Config */}
            <form onSubmit={handleSaveAppwriteConfig} className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>يدعم Appwrite Cloud v1</span>
                </span>
                <h3 className="text-xs font-black text-zinc-200 flex items-center gap-1.5">
                  <span>إعدادات الاتصال بـ Appwrite</span>
                  <Settings className="w-4 h-4 text-pink-400" />
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-pink-500 text-left"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">معرّف المشروع (Project ID)</label>
                  <input
                    type="text"
                    value={appwriteConfig.projectId}
                    onChange={e => setAppwriteConfig({ ...appwriteConfig, projectId: e.target.value })}
                    placeholder="65a7f..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-pink-500 text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">معرّف قاعدة البيانات (Database ID)</label>
                  <input
                    type="text"
                    value={appwriteConfig.databaseId}
                    onChange={e => setAppwriteConfig({ ...appwriteConfig, databaseId: e.target.value })}
                    placeholder="main_db"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-pink-500 text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">معرّف مجموعة الإعلانات (Ads Collection ID)</label>
                  <input
                    type="text"
                    value={appwriteConfig.adsCollectionId}
                    onChange={e => setAppwriteConfig({ ...appwriteConfig, adsCollectionId: e.target.value })}
                    placeholder="ads_collection"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-pink-500 text-left"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وإجراء اختبار الاتصال</span>
                </button>
              </div>
            </form>

            {/* Create New Ad Section */}
            <form onSubmit={handleCreateAd} className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5 space-y-4">
              <div className="border-b border-zinc-800/80 pb-3">
                <h3 className="text-xs font-black text-zinc-200 flex items-center gap-1.5 justify-end">
                  <span>نشر إعلان جديد</span>
                  <Megaphone className="w-4 h-4 text-amber-500" />
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">عنوان الإعلان</label>
                  <input
                    type="text"
                    value={newAdTitle}
                    onChange={e => setNewAdTitle(e.target.value)}
                    placeholder="مثال: خصم 50% على اشتراك السيرفر المميز"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">موضع ظهور الإعلان</label>
                  <select
                    value={newAdPosition}
                    onChange={e => setNewAdPosition(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="top_banner">شريط علوي متصدر (Top Banner)</option>
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-amber-500 text-left"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">رابط التوجيه عند النقر (Target Link URL)</label>
                  <input
                    type="text"
                    value={newAdLinkUrl}
                    onChange={e => setNewAdLinkUrl(e.target.value)}
                    placeholder="https://t.me/your_channel"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-amber-500 text-left"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loadingAds}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {loadingAds ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>نشر الإعلان</span>
                </button>
              </div>
            </form>

            {/* Send Site Notification Form */}
            <form onSubmit={handleSendNotification} className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-5 space-y-4">
              <div className="border-b border-zinc-800/80 pb-3">
                <h3 className="text-xs font-black text-zinc-200 flex items-center gap-1.5 justify-end">
                  <span>إرسال إشعار موقع أو مانهو أو أنمي</span>
                  <Globe className="w-4 h-4 text-pink-500" />
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">عنوان الإشعار</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={e => setNotifTitle(e.target.value)}
                    placeholder="مثال: تحديث خوادم البث المباشر"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 block font-bold">قسم الإشعار</label>
                  <select
                    value={notifType}
                    onChange={e => setNotifType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-pink-500 cursor-pointer"
                  >
                    <option value="site">إشعار موقع (Site)</option>
                    <option value="manga">إشعار مانهو (Manga)</option>
                    <option value="anime">إشعار أنمي (Anime)</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-zinc-400 block font-bold">محتوى الإشعار</label>
                  <textarea
                    value={notifContent}
                    onChange={e => setNotifContent(e.target.value)}
                    placeholder="اكتب تفاصيل الإشعار أو التحديث للمستخدمين..."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-pink-500 resize-none"
                    required
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-zinc-400 block font-bold">رابط خارجي أو صفحة توجيه (اختياري)</label>
                  <input
                    type="text"
                    value={notifLink}
                    onChange={e => setNotifLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-pink-500 text-left"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>إرسال الإشعار لجميع المستخدمين</span>
                </button>
              </div>
            </form>

            {/* Existing Ads List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <button
                  onClick={loadAds}
                  disabled={loadingAds}
                  className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingAds ? 'animate-spin text-pink-500' : ''}`} />
                  <span>تحديث</span>
                </button>
                <h3 className="text-xs font-black text-zinc-200">الإعلانات المنشورة حالياً ({adsList.length})</h3>
              </div>

              {adsList.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950/40 border border-zinc-850 rounded-2xl space-y-2">
                  <Megaphone className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-bold text-zinc-400">لا توجد إعلانات منشورة حالياً</p>
                  <p className="text-[10px] text-zinc-500">قم بتعبئة النموذج أعلاه لنشر أول إعلان لك في التطبيق.</p>
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

      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm text-right">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-red-500">{confirmModal.title}</h3>
              <button 
                onClick={() => setConfirmModal(null)}
                className="text-zinc-500 hover:text-zinc-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                تأكيد الإجراء
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Toast */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-950 border-2 border-red-500 text-red-200 px-5 py-3 rounded-2xl flex items-center gap-2 shadow-2xl font-semibold text-xs animate-bounce">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

    </div>
  );
}
