import { useState, useEffect, useMemo, useRef } from 'react';
import { defaultScraperSources } from './data';
import { UserProfile, ReadingHistoryItem, AnimeWatchHistoryItem, ReaderSettings, Manhua, Chapter, ScraperSource, ReadingListItem, NotificationItem } from './types';
import { updateUserProfile, fetchUserReadingHistory, saveUserReadingHistory, deleteUserHistoryItem, clearUserReadingHistory, fetchUserReadingList, addManhuaToReadingList, removeManhuaFromReadingList, fetchUserAnimeHistory, saveUserAnimeHistory, deleteUserAnimeHistoryItem, clearUserAnimeHistory } from './lib/firebaseDb';
import { subscribeToAuthChanges, logout, loginWithEmail, signupWithEmail, resetPassword, signInWithGoogle } from './lib/firebaseAuth';
import { auth } from './lib/firebaseAuth';
import { Home, Search, Heart, History, FolderDown, User, MessageSquare, Bell, Tv, BookOpen, X, Sparkles } from 'lucide-react';

// Components
import Header from './components/Header';
import SettingsDrawer from './components/SettingsDrawer';
import BypassModal from './components/BypassModal';
import CompanionWidget from './components/CompanionWidget';
import CompanionModal from './components/CompanionModal';
import CompanionEffects from './components/CompanionEffects';
import { CompanionState } from './types';
import { getCompanionState, addReadingProgress } from './utils/companionStorage';

// Views
import HomeView from './views/HomeView';
import ManhuaDetailsView from './views/ManhuaDetailsView';
import ReaderView from './views/ReaderView';
import SearchView from './views/SearchView';
import AccountView from './views/AccountView';
import HistoryView from './views/HistoryView';
import MyListView from './views/MyListView';
import DownloadsView from './views/DownloadsView';
import AnimeDetailsView from './views/AnimeDetailsView';
import AnimePlayerView from './views/AnimePlayerView';
import { fetchAnimeDetails } from './utils/animeScraper';
import { scrapeMangaDetails } from './utils/scraper';


function getUniqueId(url: string): string {
  if (!url) return 'unknown-' + Math.random().toString(36).substring(7);
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.replace(/\/$/, '');
    const slug = path.substring(path.lastIndexOf('/') + 1) || 'manga';
    const urlForHash = url.replace(/\/$/, '');
    let hash = 0;
    for (let i = 0; i < urlForHash.length; i++) {
      const char = urlForHash.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hashStr = Math.abs(hash).toString(36);
    return `${slug}-${hashStr}`;
  } catch (e) {
    return 'unknown-' + Math.random().toString(36).substring(7);
  }
}


export default function App() {
  // Navigation Router state
  const [currentView, setCurrentView] = useState<'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'mylists' | 'downloads' | 'anime-details' | 'anime-player'>('home');
  const [selectedManhuaId, setSelectedManhuaId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  
  // Offline reading states
  const [offlineActiveManhua, setOfflineActiveManhua] = useState<Manhua | null>(null);
  const [offlineActiveChapter, setOfflineActiveChapter] = useState<Chapter | null>(null);
  
  // Search parameters state passed to search view
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<string | null>(null);

  // Companion XP tracking refs
  const lastXpChapterId = useRef<string | null>(null);
  const lastXpEpisodeId = useRef<string | null>(null);

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
        type: s.id === 'witanime' ? 'anime' : (s.type || 'manga')
    }));
  });

  // Scraped Manhua caching mechanism to support seamless reader navigation on dynamic chapters
  const [scrapedManhuaCache, setScrapedManhuaCache] = useState<Manhua | null>(null);

  // Core User Authentication State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('manhua_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.role = 'user'; // Strictly default to user
        return parsed;
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

  // Anime Watch History State
  const [animeHistory, setAnimeHistory] = useState<AnimeWatchHistoryItem[]>(() => {
    const saved = localStorage.getItem('anime_watch_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // User Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('user_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out mock/fake notifications
          return parsed.filter((n: NotificationItem) => 
            n.id !== 'site-welcome-1' && 
            n.id !== 'site-servers-2' && 
            n.id !== 'default-ad-1'
          );
        }
      } catch (e) {}
    }
    return [];
  });

  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  // Download app announcement modal upon entry state
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(() => {
    return !localStorage.getItem('has_seen_download_announcement_v5');
  });

  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
    localStorage.setItem('has_seen_download_announcement_v5', 'true');
  };

  // Reading Companion State
  const [companionState, setCompanionState] = useState<CompanionState>(() => getCompanionState());
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);

  // Save Notifications to LocalStorage
  useEffect(() => {
    localStorage.setItem('user_notifications', JSON.stringify(notifications));
  }, [notifications]);


  const handleNotificationClick = (notif: NotificationItem) => {
    // Mark as read
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isNew: false } : n));
    
    // Auto-dismiss toast if clicked
    if (activeToast?.id === notif.id) {
      setActiveToast(null);
    }

    // Site Notifications direct handling
    if (notif.type === 'site') {
      if (notif.sourceUrl && notif.sourceUrl !== '#') {
        window.open(notif.sourceUrl, '_blank');
      } else {
        setCurrentView('home');
      }
      return;
    }

    // Direct routing for Anime & Manga
    if (notif.type === 'anime') {
      setAppMode('anime');
      setSelectedManhuaId(notif.targetId);
      setScrapedManhuaCache(null);
      if (notif.chapterOrEp) {
        setSelectedChapterId(notif.chapterOrEp ? notif.chapterOrEp.toString() : '');
        setCurrentView('anime-player');
      } else {
        setCurrentView('anime-details');
      }
    } else {
      setAppMode('manga');
      setSelectedManhuaId(notif.targetId);
      if (notif.sourceUrl) {
        setScrapedManhuaCache({
          id: notif.targetId,
          title: notif.title,
          englishTitle: notif.title,
          coverUrl: notif.cover || '',
          rawCoverUrl: notif.cover || '',
          sourceUrl: notif.sourceUrl,
          sourceId: notif.targetId.split('-')[1] || 'azorafly',
          description: notif.content,
          author: 'غير معروف',
          artist: 'غير معروف',
          status: 'مستمر' as any,
          rating: 4.8,
          views: 0,
          categories: ['مانهوا'],
          chapters: [], releaseYear: new Date().getFullYear()
        });
      }
      if (notif.chapterOrEp) {
        setSelectedChapterId(notif.chapterOrEp ? notif.chapterOrEp.toString() : '');
        setCurrentView('reader');
      } else {
        setCurrentView('manhua');
      }
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('user_notifications');
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // User Reading Lists (Favorites, Currently reading, Plan to read)
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);

  // Load User Data (History & Lists) on startup or local user change
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const fetchedHistory = await fetchUserReadingHistory(user.id);
        const fetchedAnimeHistory = await fetchUserAnimeHistory(user.id);
        const fetchedList = await fetchUserReadingList(user.id);
        setHistory(fetchedHistory);
        setAnimeHistory(fetchedAnimeHistory);
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
      autoSync: true,
      continuousMode: true // تفعيل خيار الفصول المسترسلة افتراضياً أو قابلة للتبديل
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
      const allowedViews: ('home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'mylists' | 'downloads')[] = [
        'home', 'manhua', 'reader', 'search', 'account', 'history', 'mylists', 'downloads'
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
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
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

  useEffect(() => {
    if (!user) {
      localStorage.setItem('anime_watch_history', JSON.stringify(animeHistory));
    }
  }, [animeHistory, user]);

  // Dynamic Manhuas State (starts empty as requested)
  const [manhuas, setManhuas] = useState<Manhua[]>(() => {
    const saved = localStorage.getItem('manhua_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Manhua[];
        // Filter out old mock manhuas that have short numeric IDs (1-10)
        return parsed.filter(m => {
          const isOldMockId = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(m.id);
          return !isOldMockId;
        });
      } catch (e) {
        return [];
      }
    }
    return [];
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
    setManhuas([]);
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
    // Award progress to Reading Companion (+10 XP) ONLY if it's a new chapter
    if (lastXpChapterId.current !== item.chapterId) {
      lastXpChapterId.current = item.chapterId;
      const { newState, leveledUp } = addReadingProgress('chapter', 1);
      setCompanionState(newState);

      if (leveledUp) {
        window.dispatchEvent(new CustomEvent('companion-effect', { 
          detail: { type: 'evolve', level: newState.level } 
        }));
      }
    }

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

  // Anime History Functions
  const handleAddAnimeHistory = async (item: Omit<AnimeWatchHistoryItem, 'id' | 'lastWatchedTime'>) => {
    // Award progress to Reading Companion (+15 XP) ONLY if it's a new episode
    const epIdentifier = `${item.animeId}-${item.episodeNumber}`;
    if (lastXpEpisodeId.current !== epIdentifier) {
      lastXpEpisodeId.current = epIdentifier;
      const { newState, leveledUp } = addReadingProgress('episode', 1);
      setCompanionState(newState);

      if (leveledUp) {
        window.dispatchEvent(new CustomEvent('companion-effect', { 
          detail: { type: 'evolve', level: newState.level } 
        }));
      }
    }

    if (user?.id) {
      try {
        const savedItem = await saveUserAnimeHistory(user.id, item);
        setAnimeHistory((prev) => {
          const filtered = prev.filter((h) => h.animeId !== item.animeId);
          return [savedItem, ...filtered];
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setAnimeHistory((prev) => {
        const filtered = prev.filter((h) => h.animeId !== item.animeId);
        const newItem: AnimeWatchHistoryItem = {
          ...item,
          id: 'animehist-' + Date.now(),
          lastWatchedTime: new Date().toISOString()
        };
        return [newItem, ...filtered];
      });
    }
  };

  const handleRemoveAnimeHistoryItem = async (id: string) => {
    if (user?.id) {
      try {
        await deleteUserAnimeHistoryItem(user.id, id);
        setAnimeHistory((prev) => prev.filter((h) => h.id !== id));
      } catch (err) {
        console.error(err);
      }
    } else {
      setAnimeHistory((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const handleClearAnimeHistory = async () => {
    if (user?.id) {
      try {
        await clearUserAnimeHistory(user.id);
        setAnimeHistory([]);
      } catch (err) {
        console.error(err);
      }
    } else {
      setAnimeHistory([]);
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
    const isAnime = id.startsWith('series-') || 
                    id.startsWith('scr-witanime-') || 
                    id.startsWith('scr-anime4up-') || 
                    id.includes('anime') ||
                    id.includes('witanime') ||
                    optionalMangaShell?.type === 'anime' ||
                    appMode === 'anime';

    if (optionalMangaShell) {
      setScrapedManhuaCache(optionalMangaShell);
    } else {
      setScrapedManhuaCache(null);
    }
    setSelectedManhuaId(id);
    if (isAnime) {
      setCurrentView('anime-details');
    } else {
      setCurrentView('manhua');
    }
  };

  const handleSelectChapter = (manhuaId: string, chapterId: string, pageIndex: number = 0, historyItem?: ReadingHistoryItem) => {
    setSelectedManhuaId(manhuaId);
    setSelectedChapterId(chapterId);
    
    // Reconstruct scraped manhua shell if navigating from history and it's a scraped source
    if (historyItem && manhuaId.startsWith('scr-')) {
      const reconstructed: Manhua = {
        id: manhuaId,
        title: historyItem.manhuaTitle,
        description: 'جاري جلب التفاصيل من المصدر...',
        author: 'غير معروف',
        artist: 'غير معروف',
        status: 'مستمر',
        rating: 4.8,
        views: 0,
        coverUrl: historyItem.manhuaCover,
        categories: ['مانهوا'],
        chapters: [{
           id: chapterId,
           manhuaId: manhuaId,
           title: historyItem.chapterTitle,
           chapterNumber: historyItem.chapterNumber,
           releaseDate: historyItem.lastReadTime || new Date().toISOString(),
           views: 0,
           pages: historyItem.chapterUrl ? [historyItem.chapterUrl] : []
        }],
        releaseYear: 2026,
        sourceUrl: historyItem.sourceUrl,
      };
      setScrapedManhuaCache(reconstructed);

      // Prefetch manhua details in background to load all chapters
      if (historyItem.sourceUrl) {
        const source = defaultScraperSources.find(s => historyItem.sourceUrl?.includes(new URL(s.baseUrl).hostname)) || defaultScraperSources[0];
        scrapeMangaDetails(source, historyItem.sourceUrl).then(details => {
          if (details) {
            details.id = manhuaId; // Ensure ID matches perfectly
            // Ensure the currently reading chapter is in the list
            const chapterExists = details.chapters.find(c => c.id === chapterId);
            if (!chapterExists) {
               details.chapters.push(reconstructed.chapters[0]);
            }
            setScrapedManhuaCache(details);
          }
        }).catch(err => {
          console.warn('Failed to prefetch manhua details:', err);
        });
      }
    }
    
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
  const handleNavigate = (view: 'home' | 'manhua' | 'reader' | 'search' | 'account' | 'history' | 'mylists' | 'downloads') => {
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
  const filteredSources = useMemo(() => {
    return sources.filter((s) => s.type === appMode);
  }, [sources, appMode]);

  return (
    <div className={`min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between ${currentView !== 'reader' && homeLayout === 'modern' ? 'pb-20 md:pb-0' : ''}`}>
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      {currentView !== 'reader' && (
        <Header 
          onOpenSettings={() => setIsDrawerOpen(true)}
          onOpenCompanionModal={() => setIsCompanionModalOpen(true)}
          user={user}
          onNavigate={handleNavigate}
          currentView={currentView}
          onSearch={handleSearchTrigger}
          homeLayout={homeLayout}
          appMode={appMode}
          onToggleAppMode={handleToggleAppMode}
          isNightMode={readerSettings.isNightMode}
          onToggleNightMode={() => setReaderSettings(prev => ({ ...prev, isNightMode: !prev.isNightMode }))}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onDeleteNotification={handleDeleteNotification}
        />
      )}

      {/* 2. LATERAL SETTINGS CURTAIN (SettingsDrawer) */}
      <SettingsDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenCompanionModal={() => setIsCompanionModalOpen(true)}
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
            onSelectManhua={(id, optionalMangaShell) => {
              if (appMode === 'anime' && optionalMangaShell) {
                // Navigate to anime details
                setSelectedManhuaId(optionalMangaShell.sourceUrl || '');
                setScrapedManhuaCache(optionalMangaShell);
                setCurrentView('anime-details');
              } else {
                handleSelectManhua(id, optionalMangaShell);
              }
            }}
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

        {currentView === 'anime-details' && (
          <AnimeDetailsView 
            animeUrl={selectedManhuaId || ''} 
            scrapedManhuaCache={scrapedManhuaCache}
            onBack={() => setCurrentView('home')} 
            onSelectEpisode={(epNum) => {
              setSelectedChapterId(epNum !== null && epNum !== undefined ? epNum.toString() : '1');
              setCurrentView('anime-player');
            }}
            setAnime={(anime: any) => setScrapedManhuaCache(anime)}
            user={user}
            readingList={readingList}
            onAddToList={handleAddToList}
            onRemoveFromList={handleRemoveFromList}
            onNavigate={handleNavigate}
            onSelectAnimeUrl={(url) => {
              setSelectedManhuaId(url);
              setScrapedManhuaCache(null);
              setCurrentView('anime-details');
            }}
          />
        )}
        
        {currentView === 'anime-player' && (
          <AnimePlayerView 
            anime={scrapedManhuaCache as any}
            episodeNumber={parseInt(selectedChapterId || '1') || 1}
            onNavigateEpisode={(id, ep) => {
              setSelectedChapterId(ep !== null && ep !== undefined && !isNaN(ep) ? ep.toString() : '1');
            }}
            onBack={() => setCurrentView('anime-details')}
            onAddAnimeHistory={handleAddAnimeHistory}
            initialStoppedSeconds={
              animeHistory.find(
                (h) => h.animeId === selectedManhuaId && h.episodeNumber === (parseInt(selectedChapterId || '1') || 1)
              )?.stoppedAtSeconds || 0
            }
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
            animeHistory={animeHistory}
            onSelectChapter={handleSelectChapter}
            onSelectEpisode={async (animeId, episodeNumber) => {
              setSelectedManhuaId(animeId);
              setAppMode('anime');
              setSelectedChapterId(episodeNumber !== null && episodeNumber !== undefined ? episodeNumber.toString() : '1');
              setCurrentView('anime-player');
              
              // Prefetch anime details in the background so player can load
              try {
                const details = await fetchAnimeDetails(animeId);
                if (details) {
                  setScrapedManhuaCache(details as any);
                }
              } catch (e) {
                console.error("Failed to prefetch anime details:", e);
              }
            }}
            onRemoveItem={handleRemoveHistoryItem}
            onRemoveAnimeItem={handleRemoveAnimeHistoryItem}
            onClearAll={handleClearHistory}
            onClearAllAnime={handleClearAnimeHistory}
            onNavigateToManhua={(manhuaId) => {
              const histItem = history.find(h => h.manhuaId === manhuaId);
              if (histItem && manhuaId.startsWith('scr-')) {
                setScrapedManhuaCache({
                  id: manhuaId,
                  title: histItem.manhuaTitle,
                  englishTitle: histItem.manhuaTitle,
                  description: 'جاري تحميل التفاصيل من المصدر...',
                  author: 'غير معروف',
                  artist: 'غير معروف',
                  status: 'مستمر' as any,
                  rating: 4.8,
                  views: 0,
                  coverUrl: histItem.manhuaCover || '',
                  rawCoverUrl: histItem.manhuaCover || '',
                  sourceUrl: histItem.sourceUrl || '',
                  sourceId: manhuaId.split('-')[1] || 'azorafly',
                  categories: ['مانهوا'],
                  chapters: [],
                  releaseYear: 2026
                });
              }
              handleSelectManhua(manhuaId);
            }}
            onNavigateToAnime={(animeId) => {
              setSelectedManhuaId(animeId);
              setAppMode('anime');
              setScrapedManhuaCache(null);
              setCurrentView('anime-details');
            }}
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
        <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 space-y-3">
            <p className="font-display font-bold text-zinc-400 text-sm">
              {appMode === 'anime' ? (
                <>عالم <span className="text-amber-500">الأنمي</span> •</>
              ) : (
                <>عالم <span className="text-rose-500">المانهو</span> •</>
              )}
            </p>
            <p className="font-sans max-w-2xl mx-auto">
              منصة تجمع عشاق المانهو وانمي في تجربة قراءة مريحة وممتعة. جميع الحقوق محفوظة © 2026.
            </p>
            <div className="pt-2 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-4 text-zinc-400">
                <a href="https://discord.gg/NM59xtZtX3" target="_blank" rel="noopener noreferrer" className="hover:text-[#5865F2] underline cursor-pointer font-bold transition-colors flex items-center gap-1.5">
                  ديسكورد المنصة 💬
                </a>
              </div>
            </div>
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
          <div className="grid grid-cols-6 items-center justify-items-center max-w-xl mx-auto" dir="rtl">
            
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

      {/* Real-time Dynamic Toast Notification popup */}
      {activeToast && (
        <div 
          onClick={() => handleNotificationClick(activeToast)}
          className="fixed bottom-24 left-4 md:bottom-6 md:left-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-96 bg-zinc-950/95 border border-red-500/30 text-white rounded-2xl shadow-2xl p-4 flex gap-3 cursor-pointer select-none animate-fade-in group hover:border-red-500 transition-all duration-300"
          dir="rtl"
        >
          {/* Cover */}
          <div className="w-12 h-16 rounded overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800">
            {activeToast.cover ? (
              <img 
                src={activeToast.cover || undefined} 
                alt={activeToast.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {activeToast.type === 'anime' ? <Tv className="w-5 h-5 text-zinc-600" /> : <BookOpen className="w-5 h-5 text-zinc-600" />}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pr-1 text-right">
            <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black">
              <Bell className="w-3.5 h-3.5 animate-bounce" />
              <span>تحديث جديد متاح الآن!</span>
            </div>
            <h4 className="text-xs font-black text-white truncate mt-0.5">
              {activeToast.title}
            </h4>
            <p className="text-[10px] text-zinc-400 mt-1 leading-snug line-clamp-2">
              {activeToast.content}
            </p>
          </div>

          {/* Close button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveToast(null);
            }}
            className="absolute top-2 left-2 text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-900 transition-all"
            title="إغلاق التنبيه"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* FLOATING READING/WATCHING COMPANION WIDGET */}
      <CompanionWidget
        state={companionState}
        onUpdateState={setCompanionState}
        onOpenModal={() => setIsCompanionModalOpen(true)}
        isReadingOrWatching={currentView === 'reader' || currentView === 'anime-player'}
        contentType={appMode}
      />

      {/* COMPANION MANAGEMENT MODAL */}
      <CompanionModal
        isOpen={isCompanionModalOpen}
        onClose={() => setIsCompanionModalOpen(false)}
        state={companionState}
        onUpdateState={setCompanionState}
      />

      {/* COMPANION GLOBAL PAGE EFFECTS */}
      <CompanionEffects />

      {/* ENTRY ANNOUNCEMENT & DOWNLOAD APP MODAL */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in" dir="rtl">
          <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-red-500/40 rounded-3xl shadow-2xl shadow-red-500/10 overflow-hidden p-6 text-right transition-all transform scale-100 hover:border-red-500/60">
            
            {/* Animated pulsing neon overlays */}
            <div className="absolute -top-16 -left-16 w-40 h-40 bg-gradient-to-br from-red-600 to-rose-600 rounded-full blur-[60px] opacity-40 animate-pulse pointer-events-none"></div>
            <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-gradient-to-tr from-amber-500 to-yellow-500 rounded-full blur-[60px] opacity-40 animate-pulse pointer-events-none"></div>

            {/* Close Button */}
            <button
              onClick={handleCloseDownloadModal}
              className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all cursor-pointer shadow-sm"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Vibrant Festive Header */}
            <div className="flex flex-col items-center text-center mt-3 mb-6">
              <div className="relative mb-4">
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 bg-red-500 rounded-3xl blur-md opacity-50 animate-ping"></div>
                <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-amber-500 flex items-center justify-center shadow-2xl border border-red-400/40">
                  <Sparkles className="w-8 h-8 text-white animate-bounce" />
                </div>
                {/* Small floating sparkles */}
                <span className="absolute -top-1 -right-1 text-base">✨</span>
                <span className="absolute -bottom-2 -left-2 text-base">🚀</span>
              </div>
              
              <span className="text-[11px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full shadow-inner">
                تحديث أسطوري رائع 🎉
              </span>
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-amber-300 mt-2">
                تنزيل تطبيق عالم الانمي والمانهو
              </h3>
            </div>

            {/* Lively, engaging description */}
            <div className="space-y-4 text-center text-zinc-300 text-sm leading-relaxed mb-6 px-1">
              <p className="font-bold text-white text-base">
                أهلاً بك يا بطل! 🌟
              </p>
              <p className="text-xs text-zinc-400">
                لقد وفرنا لك التطبيق الرسمي المستقل لتستمتع بـ <span className="text-amber-400 font-bold">سرعة مضاعفة</span>، <span className="text-red-400 font-bold">وبدون إعلانات مزعجة</span>، مع حفظ تلقائي ومزامنة كاملة لفصولك المفضلة!
              </p>
              <div className="flex justify-center gap-4 py-1.5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl">
                <div className="flex flex-col items-center">
                  <span className="text-lg">🚫</span>
                  <span className="text-[10px] text-zinc-400 font-bold">بدون إعلانات</span>
                </div>
                <div className="w-px bg-zinc-800 my-1"></div>
                <div className="flex flex-col items-center">
                  <span className="text-lg">⚡</span>
                  <span className="text-[10px] text-zinc-400 font-bold">فائق السرعة</span>
                </div>
                <div className="w-px bg-zinc-800 my-1"></div>
                <div className="flex flex-col items-center">
                  <span className="text-lg">💾</span>
                  <span className="text-[10px] text-zinc-400 font-bold">حفظ التقدم</span>
                </div>
              </div>
            </div>

            {/* Clean, high-impact interactive action buttons - Raw URL hidden behind the clean button */}
            <div className="flex flex-col gap-3">
              <a
                href="https://gregarious-crostata-f01961.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm py-3.5 px-4 rounded-2xl shadow-xl shadow-red-600/20 hover:shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-center border-t border-white/20"
              >
                <FolderDown className="w-5 h-5 animate-bounce" />
                <span>تحميل التطبيق الرسمي مجاناً</span>
              </a>
              <button
                onClick={handleCloseDownloadModal}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 font-bold text-xs py-3 rounded-2xl transition-all cursor-pointer text-center"
              >
                دخول الموقع مباشرة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
