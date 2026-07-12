import { useState, useEffect } from 'react';
import { mockManhuas, defaultScraperSources } from './data';
import { UserProfile, ReadingHistoryItem, ReaderSettings, Manhua, Chapter, ScraperSource, ReadingListItem } from './types';
import { updateUserProfile, fetchUserReadingHistory, saveUserReadingHistory, deleteUserHistoryItem, clearUserReadingHistory, fetchUserReadingList, addManhuaToReadingList, removeManhuaFromReadingList } from './lib/supabase';
import { subscribeToAuthChanges, logout, signInWithGoogle } from './lib/firebaseAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebaseAuth';

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

export default function App() {
  // Navigation Router state
  const [currentView, setCurrentView] = useState<'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists'>('home');
  const [selectedManhuaId, setSelectedManhuaId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  
  // Search parameters state passed to search view
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<string | null>(null);

  // Dynamic Scraper Sources State
  const [sources, setSources] = useState<ScraperSource[]>(() => {
    const saved = localStorage.getItem('manhua_scraper_sources');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ScraperSource[];
        // Automatically filter out old removed default sources
        const filtered = parsed.filter((s) => s.id !== 'mangafire' && s.id !== 'manganelo' && s.id !== 'olympustaff');
        // Ensure new defaults are added if missing
        const finalSources = [...filtered];
        defaultScraperSources.forEach(defSource => {
          if (!finalSources.some(s => s.id === defSource.id)) {
            finalSources.push(defSource);
          }
        });
        return finalSources.length > 0 ? finalSources : defaultScraperSources;
      } catch (e) {
        // Fallback
      }
    }
    return defaultScraperSources;
  });

  // Scraped Manhua caching mechanism to support seamless reader navigation on dynamic chapters
  const [scrapedManhuaCache, setScrapedManhuaCache] = useState<Manhua | null>(null);

  // Core User Authentication State
  const [user, setUser] = useState<UserProfile | null>(() => {
    // We'll rely on onAuthStateChanged to set the user
    return null;
  });

  // Auth listener
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        // Create or fetch profile
        const profile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'مستخدم جديد',
          avatarUrl: firebaseUser.photoURL || '',
          role: firebaseUser.email === 'rkieeamne@gmail.com' ? 'admin' : 'user',
          joinedAt: new Date().toLocaleDateString('ar-EG'),
          bio: '',
          xp: 0,
          totalXp: 0
        };
        setUser(profile);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

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

  // Load User Data (History & Lists) on login or change
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.id) {
        try {
          const fetchedHistory = await fetchUserReadingHistory(user.id);
          const fetchedList = await fetchUserReadingList(user.id);
          setHistory(fetchedHistory);
          setReadingList(fetchedList);
        } catch (err) {
          console.error("Failed to load user cloud data:", err);
        }
      } else {
        // Fallback to anonymous local storage if user is not logged in
        const savedHistory = localStorage.getItem('manhua_reading_history');
        const savedManhuas = localStorage.getItem('manhua_list');
        
        let parsedHistory: ReadingHistoryItem[] = [];
        if (savedHistory) {
          try {
            parsedHistory = JSON.parse(savedHistory);
          } catch (e) {
            parsedHistory = [];
          }
        }
        
        let parsedManhuas: Manhua[] = [];
        if (savedManhuas) {
          try {
            parsedManhuas = JSON.parse(savedManhuas);
          } catch (e) {
            parsedManhuas = mockManhuas;
          }
        } else {
          parsedManhuas = mockManhuas;
        }

        setHistory(parsedHistory);
        setManhuas(parsedManhuas);
        setReadingList([]);
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
      const allowedViews: ('home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists')[] = [
        'home', 'manhua', 'reader', 'search', 'account', 'history', 'admin', 'mylists'
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
  const handleNavigate = (view: 'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'admin' | 'mylists') => {
    setCurrentView(view);
  };

  const updateReaderSettings = (settings: Partial<ReaderSettings>) => {
    setReaderSettings((prev) => ({ ...prev, ...settings }));
  };

  // Find active data objects for detail views safely
  const activeManhua = (scrapedManhuaCache?.id === selectedManhuaId && scrapedManhuaCache)
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
  const activeChapter = activeManhua?.chapters?.find((c) => c.id === selectedChapterId) || activeManhua?.chapters?.[0];

  const handleRestoreSources = () => {
    setSources(defaultScraperSources);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      {currentView !== 'reader' && (
        <Header 
          onOpenSettings={() => setIsDrawerOpen(true)}
          user={user}
          onNavigate={handleNavigate}
          currentView={currentView}
          onSearch={handleSearchTrigger}
        />
      )}

      {/* 2. LATERAL SETTINGS CURTAIN (SettingsDrawer) */}
      <SettingsDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        onLogin={signInWithGoogle}
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
            sources={sources}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            user={user}
            readingList={readingList}
            onAddToList={handleAddToList}
            onRemoveFromList={handleRemoveFromList}
            onNavigate={handleNavigate}
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
          />
        )}

        {currentView === 'search' && (
          <SearchView 
            manhuas={manhuas}
            initialQuery={searchQuery}
            initialCategory={searchCategory}
            onSelectManhua={handleSelectManhua}
            sources={sources}
            user={user}
            readingList={readingList}
            onAddToList={handleAddToList}
            onRemoveFromList={handleRemoveFromList}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'account' && (
          <AccountView 
            user={user}
            history={history}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
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
      </main>

      {/* 4. FOOTER */}
      {currentView !== 'reader' && (
        <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <p className="font-display font-bold text-zinc-400 text-sm">
              عالم المانهو •
            </p>
            <p className="font-sans">
              منصة تجمع عشاق المانهو والمانجا في تجربة قراءة مريحة وممتعة.
              جميع الحقوق محفوظة © 2026.
            </p>
          </div>
        </footer>
      )}

      <BypassModal 
        isOpen={isBypassModalOpen} 
        onClose={() => setIsBypassModalOpen(false)} 
      />

    </div>
  );
}
