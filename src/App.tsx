import { useState, useEffect } from 'react';
import { mockManhuas, defaultScraperSources } from './data';
import { UserProfile, ReadingHistoryItem, ReaderSettings, Manhua, Chapter, ScraperSource, ReadingListItem } from './types';
import { updateUserProfile, fetchUserReadingHistory, saveUserReadingHistory, deleteUserHistoryItem, clearUserReadingHistory, fetchUserReadingList, addManhuaToReadingList, removeManhuaFromReadingList } from './lib/firebaseDb';
import { subscribeToAuthChanges, logout, loginWithEmail, signupWithEmail, resetPassword, signInWithGoogle } from './lib/firebaseAuth';
import { auth } from './lib/firebaseAuth';
import { Home, Search, Heart, History, FolderDown, User } from 'lucide-react';

// Components
import Header from './components/Header';
import SettingsDrawer from './components/SettingsDrawer';
import BypassModal from './components/BypassModal';

// Views
import HomeView from './views/HomeView';
import ManhuaDetailsView from './views/ManhuaDetailsView';
import ReaderView from './views/ReaderView';
import SearchView from './views/SearchView';
import AccountView from './views/AccountView';
import HistoryView from './views/HistoryView';
import AdminView from './views/AdminView';
import MyListView from './views/MyListView';
import DownloadsView from './views/DownloadsView';

export default function App() {
  // Navigation Router state
  const [currentView, setCurrentView] = useState<'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists' | 'downloads'>('home');
  const [selectedManhuaId, setSelectedManhuaId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  
  // Offline reading states
  const [offlineActiveManhua, setOfflineActiveManhua] = useState<Manhua | null>(null);
  const [offlineActiveChapter, setOfflineActiveChapter] = useState<Chapter | null>(null);
  
  // Search parameters state passed to search view
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<string | null>(null);

  // Dynamic Scraper Sources State
  const [sources, setSources] = useState<ScraperSource[]>(() => {
    const saved = localStorage.getItem('manhua_scraper_sources');
    let sourcesToUse = defaultScraperSources;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ScraperSource[];
        // Automatically filter out old removed default sources
        const filtered = parsed.filter((s) => s.id !== 'mangafire' && s.id !== 'manganelo' && s.id !== 'olympustaff');
        // Ensure new defaults are added if missing
        const finalSources = [...filtered];
        defaultScraperSources.forEach(defSource => {
          const index = finalSources.findIndex(s => s.id === defSource.id);
          if (index === -1) {
            finalSources.push(defSource);
          } else {
            // Force update existing default sources to get new baseUrl/type/selectors/etc
            finalSources[index] = { ...finalSources[index], ...defSource };
          }
        });
        sourcesToUse = finalSources.length > 0 ? finalSources : defaultScraperSources;
      } catch (e) {
        // Fallback
      }
    }
    // Ensure 'type' is present for all sources
    return sourcesToUse.map(s => ({
        ...s,
        type: s.type || (s.id === 'witanime' ? 'anime' : 'manga')
    }));
  });

  // Scraped Manhua caching mechanism to support seamless reader navigation on dynamic chapters
  const [scrapedManhuaCache, setScrapedManhuaCache] = useState<Manhua | null>(null);

  // Core User Authentication State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('manhua_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const defaultProfile: UserProfile = {
      id: 'local-user',
      email: 'local@user.com',
      displayName: 'قارئ مخلص',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&auto=format&fit=crop&q=80',
      role: 'user',
      joinedAt: new Date().toLocaleDateString('ar-EG'),
      bio: 'عاشق للمانهو والمانجا',
      xp: 15,
      totalXp: 100
    };
    localStorage.setItem('manhua_user_profile', JSON.stringify(defaultProfile));
    return defaultProfile;
  });

  // Reading History State
  const [history, setHistory] = useState<ReadingHistoryItem[]>(() => {
    const saved = localStorage.getItem('manhua_reading_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // User Reading Lists (Favorites, Currently reading, Plan to read)
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);

  // Load User Data (History & Lists) on startup or local user change
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const fetchedHistory = await fetchUserReadingHistory(user.id);
        const fetchedList = await fetchUserReadingList(user.id);
        setHistory(fetchedHistory);
        setReadingList(fetchedList);
      } catch (err) {
        console.error("Failed to load user local data:", err);
      }
    };
    loadUserData();
  }, [user]);

  // Reader Custom Settings
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => {
    const saved = localStorage.getItem('manhua_reader_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to defaults
      }
    }
    return {
      readingMode: 'webtoon',
      zoomLevel: 100,
      isNightMode: true,
      navColor: '#ef4444', // default crimson red
      autoSync: true
    };
  });

  // Settings Drawer Toggle State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBypassModalOpen, setIsBypassModalOpen] = useState(false);

  // Home Layout State (Modern vs Classic)
  const [homeLayout, setHomeLayout] = useState<'classic' | 'modern'>(() => {
    return (localStorage.getItem('homeLayout') as any) || 'modern';
  });

  const handleToggleLayout = () => {
    const next = homeLayout === 'modern' ? 'classic' : 'modern';
    setHomeLayout(next);
    localStorage.setItem('homeLayout', next);
  };

  // App Mode State (manga vs anime)
  const [appMode, setAppMode] = useState<'manga' | 'anime'>(() => {
    return (localStorage.getItem('appMode') as any) || 'manga';
  });

  const handleToggleAppMode = () => {
    const next = appMode === 'manga' ? 'anime' : 'manga';
    setAppMode(next);
    localStorage.setItem('appMode', next);
  };

  useEffect(() => {
    if (appMode === 'anime') {
      document.body.style.setProperty('--primary-color', '#f59e0b');
    } else {
      document.body.style.setProperty('--primary-color', '#ef4444');
    }
  }, [appMode]);

  // Parse URL query params on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mangaId = params.get('manga');
    const chapterId = params.get('chapter');
    const view = params.get('view');

    if (mangaId && chapterId) {
      setSelectedManhuaId(mangaId);
      setSelectedChapterId(chapterId);
      setCurrentView('reader');
    } else if (mangaId) {
      setSelectedManhuaId(mangaId);
      setCurrentView('manhua');
    } else if (view) {
      const allowedViews: ('home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists' | 'downloads')[] = [
        'home', 'manhua', 'reader', 'search', 'account', 'history', 'admin', 'mylists', 'downloads'
      ];
      if (allowedViews.includes(view as any)) {
        setCurrentView(view as any);
      }
    }
  }, []);

  // Synchronize App state to browser URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentView === 'reader' && selectedManhuaId && selectedChapterId) {
      params.set('manga', selectedManhuaId);
      params.set('chapter', selectedChapterId);
    } else if (currentView === 'manhua' && selectedManhuaId) {
      params.set('manga', selectedManhuaId);
    } else if (currentView !== 'home') {
      params.set('view', currentView);
    }

    const newQuery = params.toString();
    const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
    
    // Check if the URL actually changed to prevent loops or extra history states
    if (window.location.search !== `?${newQuery}` && (window.location.search || newQuery)) {
      window.history.pushState(null, '', newUrl);
    }
  }, [currentView, selectedManhuaId, selectedChapterId]);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const mangaId = params.get('manga');
      const chapterId = params.get('chapter');
      const view = params.get('view');

      if (mangaId && chapterId) {
        setSelectedManhuaId(mangaId);
        setSelectedChapterId(chapterId);
        setCurrentView('reader');
      } else if (mangaId) {
        setSelectedManhuaId(mangaId);
        setCurrentView('manhua');
      } else if (view) {
        setCurrentView(view as any);
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleOpenBypass = () => {
      setIsBypassModalOpen(true);
    };
    window.addEventListener('open-bypass-modal', handleOpenBypass);
    return () => {
      window.removeEventListener('open-bypass-modal', handleOpenBypass);
    };
  }, []);

  // Persistence triggers
  useEffect(() => {
    localStorage.setItem('manhua_scraper_sources', JSON.stringify(sources));
  }, [sources]);

  // Persistence triggers
  useEffect(() => {
    localStorage.setItem('manhua_reader_settings', JSON.stringify(readerSettings));
    
    // Apply night mode to document body for total immersion
    if (readerSettings.isNightMode) {
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#09090b'; // zinc-950
      document.body.style.color = '#fafafa'; // zinc-50
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#fafafa'; // light slate
      document.body.style.color = '#18181b'; // zinc-900
    }
  }, [readerSettings]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('manhua_user_profile', JSON.stringify(user));
    } else {
      localStorage.removeItem('manhua_user_profile');
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('manhua_reading_history', JSON.stringify(history));
    }
  }, [history, user]);

  // Dynamic Manhuas State (starts empty as requested)
  const [manhuas, setManhuas] = useState<Manhua[]>(() => {
    const saved = localStorage.getItem('manhua_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return mockManhuas;
      }
    }
    return mockManhuas;
  });

  // Persist manhuas to localStorage
  useEffect(() => {
    localStorage.setItem('manhua_list', JSON.stringify(manhuas));
  }, [manhuas]);

  const handleAddManhua = (newManhua: Manhua) => {
    setManhuas((prev) => [...prev, newManhua]);
  };

  const handleUpdateManhua = (updatedManhua: Manhua) => {
    if (updatedManhua.id.startsWith('scr-')) {
      setScrapedManhuaCache(updatedManhua);
    }
    setManhuas((prev) => prev.map((m) => m.id === updatedManhua.id ? updatedManhua : m));
  };

  const handleDeleteManhua = (manhuaId: string) => {
    setManhuas((prev) => prev.filter((m) => m.id !== manhuaId));
  };

  const handleRestoreDefaults = () => {
    setManhuas(mockManhuas);
  };

  const handleClearAllManhuas = () => {
    setManhuas([]);
  };

  const handleAddSource = (newSource: ScraperSource) => {
    setSources((prev) => [...prev, newSource]);
  };

  const handleDeleteSource = (sourceId: string) => {
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

  // Auth Functions
  const handleLogout = async () => {
    await logout();
    setCurrentView('home');
    setIsDrawerOpen(false);
  };

  const handleUpdateProfile = async (updated: Partial<UserProfile>): Promise<{ success: boolean; error: string | null }> => {
    if (user?.id) {
      const res = await updateUserProfile(user.id, updated);
      if (res.user) {
        setUser(res.user);
        return { success: true, error: null };
      }
      return { success: false, error: res.error };
    }
    return { success: false, error: 'المستخدم غير متصل' };
  };

  // History Functions
  const handleAddHistory = async (item: Omit<ReadingHistoryItem, 'id' | 'lastReadTime'>) => {
    if (user?.id) {
      try {
        const savedItem = await saveUserReadingHistory(user.id, item);
        setHistory((prev) => {
          const filtered = prev.filter((h) => h.manhuaId !== item.manhuaId);
          return [savedItem, ...filtered];
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.manhuaId !== item.manhuaId);
        const newItem: ReadingHistoryItem = {
          ...item,
          id: 'hist-' + Date.now(),
          lastReadTime: new Date().toISOString()
        };
        return [newItem, ...filtered];
      });
    }
  };

  const handleRemoveHistoryItem = async (id: string) => {
    if (user?.id) {
      try {
        await deleteUserHistoryItem(user.id, id);
        setHistory((prev) => prev.filter((h) => h.id !== id));
      } catch (err) {
        console.error(err);
      }
    } else {
      setHistory((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const handleClearHistory = async () => {
    if (user?.id) {
      try {
        await clearUserReadingHistory(user.id);
        setHistory([]);
      } catch (err) {
        console.error(err);
      }
    } else {
      setHistory([]);
    }
  };

  // Reading List Functions
  const handleAddToList = async (manhua: Manhua, type: 'favorite' | 'reading' | 'plan') => {
    if (!user?.id) return;
    try {
      const newItem = await addManhuaToReadingList(user.id, manhua, type);
      setReadingList((prev) => {
        const filtered = prev.filter((item) => item.manhuaId !== manhua.id);
        return [newItem, ...filtered];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromList = async (manhuaId: string) => {
    if (!user?.id) return;
    try {
      await removeManhuaFromReadingList(user.id, manhuaId);
      setReadingList((prev) => prev.filter((item) => item.manhuaId !== manhuaId));
    } catch (err) {
      console.error(err);
    }
  };

  // Nav Handlers
  const handleSelectManhua = (id: string, optionalMangaShell?: Manhua) => {
    if (optionalMangaShell) {
      setScrapedManhuaCache(optionalMangaShell);
    }
    setSelectedManhuaId(id);
    setCurrentView('manhua');
  };

  const handleSelectChapter = (manhuaId: string, chapterId: string, pageIndex: number = 0) => {
    setSelectedManhuaId(manhuaId);
    setSelectedChapterId(chapterId);
    setCurrentView('reader');
  };

  const handleSelectCategory = (category: string) => {
    setSearchCategory(category);
    setSearchQuery('');
    setCurrentView('search');
  };

  const handleSearchTrigger = (query: string) => {
    setSearchQuery(query);
    setSearchCategory(null);
    setCurrentView('search');
  };

  // Navigation targets
  const handleNavigate = (view: 'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists' | 'downloads') => {
    setCurrentView(view);
  };

  const handleSelectChapterOffline = (manhua: Manhua, chapter: Chapter) => {
    setOfflineActiveManhua(manhua);
    setOfflineActiveChapter(chapter);
    setSelectedManhuaId(manhua.id);
    setSelectedChapterId(chapter.id);
    setCurrentView('reader');
  };

  useEffect(() => {
    if (currentView !== 'reader') {
      setOfflineActiveManhua(null);
      setOfflineActiveChapter(null);
    }
  }, [currentView]);

  const updateReaderSettings = (settings: Partial<ReaderSettings>) => {
    setReaderSettings((prev) => ({ ...prev, ...settings }));
  };

  // Find active data objects for detail views safely
  const activeManhua = (offlineActiveManhua && currentView === 'reader') 
    ? offlineActiveManhua 
    : (scrapedManhuaCache?.id === selectedManhuaId && scrapedManhuaCache)
      ? scrapedManhuaCache 
      : (manhuas.find((m) => m.id === selectedManhuaId) || (selectedManhuaId?.startsWith('scr-') ? ({
          id: selectedManhuaId,
          title: 'جاري التحميل...',
          description: 'جاري جلب التفاصيل مباشرة من المصدر...',
          author: 'غير معروف',
          artist: 'غير معروف',
          status: 'مستمر' as any,
          rating: 4.8,
          views: 0,
          coverUrl: '',
          categories: ['مانهوا'],
          chapters: [],
          releaseYear: 2026,
        } as Manhua) : manhuas[0]));
  const activeChapter = (offlineActiveChapter && currentView === 'reader') 
    ? offlineActiveChapter 
    : activeManhua?.chapters?.find((c) => c.id === selectedChapterId) || activeManhua?.chapters?.[0];

  const handleRestoreSources = () => {
    setSources(defaultScraperSources);
  };

  // Filter sources based on appMode
  const filteredSources = sources.filter((s) => s.type === appMode);

  return (
    <div className={`min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between ${currentView !== 'reader' && homeLayout === 'modern' ? 'pb-20 md:pb-0' : ''}`}>
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      {currentView !== 'reader' && (
        <Header 
          onOpenSettings={() => setIsDrawerOpen(true)}
          user={user}
          onNavigate={handleNavigate}
          currentView={currentView}
          onSearch={handleSearchTrigger}
          homeLayout={homeLayout}
          appMode={appMode}
          onToggleAppMode={handleToggleAppMode}
        />
      )}

      {/* 2. LATERAL SETTINGS CURTAIN (SettingsDrawer) */}
      <SettingsDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        onLogin={loginWithEmail}
        onSignup={signupWithEmail}
        onResetPassword={resetPassword}
        onLoginWithGoogle={signInWithGoogle}
        onLogout={handleLogout}
        history={history}
        onClearHistory={handleClearHistory}
        readerSettings={readerSettings}
        updateReaderSettings={updateReaderSettings}
        onNavigate={handleNavigate}
        currentView={currentView}
      />

      {/* 3. MAIN CORE CONTENT VIEW STAGE */}
      <main className={`flex-grow w-full ${currentView === 'reader' ? '' : 'max-w-7xl mx-auto px-4 py-6 sm:px-6'}`}>
        {currentView === 'home' && (
          <HomeView 
            manhuas={manhuas}
            onSelectManhua={handleSelectManhua}
            onSelectChapter={handleSelectChapter}
            onSelectCategory={handleSelectCategory}
            sources={filteredSources}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            user={user}
            readingList={readingList}
            onAddToList={handleAddToList}
            onRemoveFromList={handleRemoveFromList}
            onNavigate={handleNavigate}
            homeLayout={homeLayout}
            onToggleLayout={handleToggleLayout}
            appMode={appMode}
            onToggleAppMode={handleToggleAppMode}
          />
        )}

        {currentView === 'manhua' && activeManhua && (
          <ManhuaDetailsView 
            manhua={activeManhua}
            onBack={() => setCurrentView('home')}
            onSelectChapter={(chapterId, updatedManhua) => {
              if (updatedManhua) {
                setScrapedManhuaCache(updatedManhua);
              }
              setSelectedChapterId(chapterId);
              setCurrentView('reader');
            }}
            onSelectCategory={handleSelectCategory}
            onSearch={handleSearchTrigger}
            sources={sources}
            onUpdateManhua={handleUpdateManhua}
            user={user}
            readingList={readingList}
            onAddToList={handleAddToList}
            onRemoveFromList={handleRemoveFromList}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'reader' && activeManhua && activeChapter && (
          <ReaderView 
            manhua={activeManhua}
            chapter={activeChapter}
            readerSettings={readerSettings}
            updateReaderSettings={updateReaderSettings}
            onBackToManhua={() => setCurrentView('manhua')}
            onSelectChapter={(chapterId) => setSelectedChapterId(chapterId)}
            onAddHistory={handleAddHistory}
            user={user}
            sources={sources}
            appMode={appMode}
          />
        )}

        {currentView === 'search' && (
          <SearchView 
            manhuas={manhuas}
            initialQuery={searchQuery}
            initialCategory={searchCategory}
            onSelectManhua={handleSelectManhua}
            sources={filteredSources}
            user={user}
            readingList={readingList}
            onAddToList={handleAddToList}
            onRemoveFromList={handleRemoveFromList}
            onNavigate={handleNavigate}
            appMode={appMode}
          />
        )}

        {currentView === 'account' && (
          <AccountView 
            user={user}
            history={history}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
            onLogin={loginWithEmail}
            onSignup={signupWithEmail}
            onResetPassword={resetPassword}
            onLoginWithGoogle={signInWithGoogle}
          />
        )}

        {currentView === 'mylists' && (
          <MyListView 
            user={user}
            readingList={readingList}
            onRemoveFromList={handleRemoveFromList}
            onSelectManhua={handleSelectManhua}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'history' && (
          <HistoryView 
            history={history}
            onSelectChapter={handleSelectChapter}
            onRemoveItem={handleRemoveHistoryItem}
            onClearAll={handleClearHistory}
          />
        )}

        {currentView === 'admin' && (
          <AdminView 
            manhuas={manhuas}
            onAddManhua={handleAddManhua}
            onUpdateManhua={handleUpdateManhua}
            onDeleteManhua={handleDeleteManhua}
            onRestoreDefaults={handleRestoreDefaults}
            onClearAllManhuas={handleClearAllManhuas}
            sources={sources}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            onRestoreSources={handleRestoreSources}
          />
        )}

        {currentView === 'downloads' && (
          <DownloadsView 
            onSelectChapterOffline={handleSelectChapterOffline}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* 4. FOOTER */}
      {currentView !== 'reader' && (
        <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <p className="font-display font-bold text-zinc-400 text-sm">
              {appMode === 'anime' ? (
                <>عالم <span className="text-amber-500">الأنمي</span> •</>
              ) : (
                <>عالم <span className="text-rose-500">المانهو</span> •</>
              )}
            </p>
            <p className="font-sans">
              {appMode === 'anime' ? (
                <>منصة تجمع عشاق الأنمي في تجربة مشاهدة مريحة وممتعة لآخر الحلقات المترجمة. جميع الحقوق محفوظة © 2026.</>
              ) : (
                <>منصة تجمع عشاق المانهو والمانجا في تجربة قراءة مريحة وممتعة. جميع الحقوق محفوظة © 2026.</>
              )}
            </p>
          </div>
        </footer>
      )}

      <BypassModal 
        isOpen={isBypassModalOpen} 
        onClose={() => setIsBypassModalOpen(false)} 
      />

      {/* 5. MOBILE BOTTOM NAVIGATION BAR (Modern Interface Only) */}
      {currentView !== 'reader' && homeLayout === 'modern' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-900 px-2 pt-2 pb-safe shadow-2xl md:hidden">
          <div className="grid grid-cols-6 items-center justify-items-center max-w-lg mx-auto" dir="rtl">
            
            {/* Tab 1: الرئيسية */}
            <button
              onClick={() => handleNavigate('home')}
              className="flex flex-col items-center justify-center py-1 focus:outline-none cursor-pointer group"
              id="mobile-nav-home"
            >
              <div className={`w-11 h-7.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentView === 'home'
                  ? appMode === 'anime' 
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' 
                    : 'bg-rose-600/90 text-white shadow-lg shadow-rose-600/20'
                  : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                <Home className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[9px] font-bold mt-1 transition-colors duration-300 ${
                currentView === 'home' 
                  ? appMode === 'anime' ? 'text-amber-500' : 'text-rose-500' 
                  : 'text-zinc-500'
              }`}>
                الرئيسية
              </span>
            </button>

            {/* Tab 2: قائمة المانهو */}
            <button
              onClick={() => handleNavigate('search')}
              className="flex flex-col items-center justify-center py-1 focus:outline-none cursor-pointer group"
              id="mobile-nav-search"
            >
              <div className={`w-11 h-7.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentView === 'search'
                  ? appMode === 'anime' 
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' 
                    : 'bg-rose-600/90 text-white shadow-lg shadow-rose-600/20'
                  : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                <Search className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[9px] font-bold mt-1 transition-colors duration-300 ${
                currentView === 'search' 
                  ? appMode === 'anime' ? 'text-amber-500' : 'text-rose-500' 
                  : 'text-zinc-500'
              }`}>
                {appMode === 'anime' ? 'الأنمي' : 'المانهو'}
              </span>
            </button>

            {/* Tab 3: السجل */}
            <button
              onClick={() => handleNavigate('history')}
              className="flex flex-col items-center justify-center py-1 focus:outline-none cursor-pointer group"
              id="mobile-nav-history"
            >
              <div className={`w-11 h-7.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentView === 'history'
                  ? appMode === 'anime' 
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' 
                    : 'bg-rose-600/90 text-white shadow-lg shadow-rose-600/20'
                  : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                <History className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[9px] font-bold mt-1 transition-colors duration-300 ${
                currentView === 'history' 
                  ? appMode === 'anime' ? 'text-amber-500' : 'text-rose-500' 
                  : 'text-zinc-500'
              }`}>
                {appMode === 'anime' ? 'سجل المشاهدة' : 'السجل'}
              </span>
            </button>

            {/* Tab 4: قائمتي */}
            <button
              onClick={() => handleNavigate('mylists')}
              className="flex flex-col items-center justify-center py-1 focus:outline-none cursor-pointer group"
              id="mobile-nav-mylists"
            >
              <div className={`w-11 h-7.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentView === 'mylists'
                  ? appMode === 'anime' 
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' 
                    : 'bg-rose-600/90 text-white shadow-lg shadow-rose-600/20'
                  : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                <Heart className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[9px] font-bold mt-1 transition-colors duration-300 ${
                currentView === 'mylists' 
                  ? appMode === 'anime' ? 'text-amber-500' : 'text-rose-500' 
                  : 'text-zinc-500'
              }`}>
                قائمتي
              </span>
            </button>

            {/* Tab 5: تحميل */}
            <button
              onClick={() => handleNavigate('downloads')}
              className="flex flex-col items-center justify-center py-1 focus:outline-none cursor-pointer group"
              id="mobile-nav-downloads"
            >
              <div className={`w-11 h-7.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentView === 'downloads'
                  ? appMode === 'anime' 
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' 
                    : 'bg-rose-600/90 text-white shadow-lg shadow-rose-600/20'
                  : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                <FolderDown className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[9px] font-bold mt-1 transition-colors duration-300 ${
                currentView === 'downloads' 
                  ? appMode === 'anime' ? 'text-amber-500' : 'text-rose-500' 
                  : 'text-zinc-500'
              }`}>
                {appMode === 'anime' ? 'التحميل' : 'تحميل'}
              </span>
            </button>

            {/* Tab 6: حسابي */}
            <button
              onClick={() => handleNavigate('account')}
              className="flex flex-col items-center justify-center py-1 focus:outline-none cursor-pointer group"
              id="mobile-nav-account"
            >
              <div className={`w-11 h-7.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentView === 'account'
                  ? appMode === 'anime' 
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' 
                    : 'bg-rose-600/90 text-white shadow-lg shadow-rose-600/20'
                  : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                <User className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[9px] font-bold mt-1 transition-colors duration-300 ${
                currentView === 'account' 
                  ? appMode === 'anime' ? 'text-amber-500' : 'text-rose-500' 
                  : 'text-zinc-500'
              }`}>
                حسابي
              </span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
