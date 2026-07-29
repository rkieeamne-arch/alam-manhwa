export type ManhuaStatus = 'مستمر' | 'مكتمل' | 'متوقف مؤقتاً';

export interface Chapter {
  id: string;
  manhuaId: string;
  title: string;
  chapterNumber: number;
  releaseDate: string;
  pages: (string | Blob)[];
  views: number;
  isLocked?: boolean;
}

export interface Manhua {
  id: string;
  title: string;
  englishTitle?: string;
  coverUrl: string;
  rawCoverUrl?: string;
  bannerUrl?: string;
  description: string;
  rating: number; // out of 5
  views: number;
  status: ManhuaStatus;
  author: string;
  artist: string;
  categories: string[];
  releaseYear: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  type?: 'manga' | 'anime';
  chapters: Chapter[];
  latestChapter?: string;
  sourceUrl?: string;
  sourceId?: string;
  relatedSeasons?: any[];
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  bannerUrl?: string;
  bio?: string;
  role: 'user';
  joinedAt: string;
  xp?: number;
  totalXp?: number;
}

export interface ReadingListItem {
  id: string;
  userId: string;
  manhuaId: string;
  manhuaTitle: string;
  manhuaCover: string;
  listType: 'favorite' | 'reading' | 'plan';
  addedAt: string;
}

export interface ReadingHistoryItem {
  id: string; // unique history entry id
  manhuaId: string;
  manhuaTitle: string;
  manhuaCover: string;
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  lastReadTime: string;
  progressPercent: number; // e.g., page 5 of 10 -> 50%
  pageIndex: number;
  sourceUrl?: string;
  chapterUrl?: string;
}

export interface AnimeWatchHistoryItem {
  id: string; // unique history entry id
  animeId: string;
  animeTitle: string;
  animeCover: string;
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number;
  lastWatchedTime: string;
  stoppedAtSeconds: number; // e.g. 750 seconds (12:30)
}

export interface ReaderSettings {
  readingMode: 'webtoon' | 'vertical' | 'horizontal';
  zoomLevel: number; // 50 to 150 %
  isNightMode: boolean;
  navColor: string; // hex color for navigation buttons
  autoSync: boolean;
  continuousMode?: boolean; // قراءة الفصول بشكل مسترسل متتالي
  enhanceImages?: boolean; // تحسين دقة الصور (Super Resolution)
}

export interface ManhuaComment {
  id: string;
  manhuaId: string;
  chapterId?: string; // Optional if comment on the main page
  userEmail: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  hasLiked?: boolean;
}

export interface ScraperSource {
  id: string;
  name: string;
  baseUrl: string;
  enabled?: boolean;
  popularPath: string;
  lang?: string;
  icon?: string;
  type?: 'manga' | 'anime'; // Added
  
  // 1. CSS Selectors for list page
  listCardSelector: string;
  listTitleSelector: string;
  listLinkSelector: string;
  listCoverSelector: string;
  listCoverAttr: string; // usually 'src' or 'data-src'
  listChapterSelector?: string; // selectors for latest chapter text
  
  // 2. CSS Selectors for details page
  detailTitleSelector: string;
  detailDescSelector: string;
  detailAuthorSelector: string;
  detailArtistSelector: string;
  detailStatusSelector: string;
  detailGenreSelector: string;
  
  // 3. CSS Selectors for chapter list on details page
  detailChapterItemSelector: string;
  detailChapterLinkSelector: string;
  detailChapterTitleSelector: string;
  
  // 4. CSS Selectors for reader pages page
  pageImgSelector: string;
  pageImgAttr: string; // usually 'src' or 'data-src' or 'data-cdn'
}

export interface NotificationItem {
  id: string;
  title: string;
  type: 'manga' | 'anime' | 'site';
  content: string;
  time: string;
  isNew: boolean;
  targetId: string;
  chapterOrEp?: string | number;
  cover?: string;
  sourceUrl?: string;
}

export type CompanionType = 'wolf' | 'dragon' | 'fox' | 'spirit';
export type CompanionStage = 'egg' | 'baby' | 'teen' | 'adult';
export type CompanionMood = 'happy' | 'sleepy' | 'reading' | 'coffee' | 'sad' | 'excited';

export interface CosmeticItem {
  id: string;
  name: string;
  category: 'hat' | 'prop' | 'aura' | 'background';
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  levelRequired?: number;
}

export interface CompanionState {
  enabled: boolean;
  hatched: boolean;
  type: CompanionType;
  name: string;
  stage: CompanionStage;
  level: number;
  xp: number;
  maxXp: number;
  chaptersRead: number;
  episodesWatched: number;
  unopenedChests: number;
  happiness: number; // 0 - 100
  lastCareTime: string;
  lastInteractionTime: string;
  inventory: string[]; // unlocked item IDs
  equipped: {
    hat?: string;
    prop?: string;
    aura?: string;
    background?: string;
  };
  minimized: boolean;
  hidden: boolean;
  resetRequestedAt?: string;
}

