export interface Manga {
  id: string;
  title: string;
  cover: string;
  url: string;
  description?: string;
  chapters?: Chapter[];
  sourceId?: string;
  latestChapter?: string;
}

export interface Chapter {
  id: string;
  name: string;
  url: string;
  isLocked?: boolean;
}

export interface ChapterPage {
  url: string;
}

export interface SourceHandler {
  id: string;
  name: string;
  lang: string;
  baseUrl: string;
  parsePopularList(page?: number, query?: string, source?: any): Promise<Manga[]>;
  parseMangaDetails(mangaUrl: string, source?: any): Promise<Manga>;
  parseChapterPages(chapterUrl: string, source?: any): Promise<ChapterPage[]>;
  parseMangaChapters?(mangaUrl: string, page: number, source?: any): Promise<Chapter[]>;
}

export const CATEGORY_ENGLISH_MAP: Record<string, string[]> = {
  'أكشن': ['action'],
  'مغامرة': ['adventure'],
  'خيال': ['fantasy', 'fiction'],
  'فنون قتالية': ['martial', 'cultivation'],
  'زراعة (Cultivation)': ['cultivation', 'martial'],
  'إيسيكاي (Isekai)': ['isekai'],
  'إيسيكاي': ['isekai'],
  'نظام (System)': ['system'],
  'زمن (Regression)': ['regression', 'regress'],
  'كوميديا': ['comedy'],
  'دراما': ['drama'],
  'رومنسي': ['romance', 'romantic'],
  'إثارة': ['thriller'],
  'غموض': ['mystery'],
  'نفسي': ['psychological'],
  'قوة خارقة': ['supernatural', 'superpower'],
  'تاريخي': ['historical', 'history'],
  'خارق للطبيعة': ['supernatural'],
  'حياة مدرسية': ['school'],
  'سحر': ['magic'],
  'شياطين': ['demon', 'demons'],
  'ويب تون': ['webtoon'],
  'شريحة من الحياة': ['slice-of-life', 'slice'],
  'تشويق': ['suspense', 'thriller'],
  'رعب': ['horror'],
  'حريم': ['harem'],
  'إعادة تجسيد': ['reincarnation', 'reincarnated'],
  'سفر عبر الزمن': ['time-travel', 'time'],
  'ألعاب': ['game', 'gamer'],
  'ميكا': ['mecha', 'mech'],
  'خيال علمي': ['sci-fi', 'science'],
  'رياضة': ['sports', 'sport'],
  'شوجو': ['shoujo'],
  'شونين': ['shounen'],
  'سينين': ['seinen'],
  'مأساة': ['tragedy'],
  'حياة يومية': ['slice', 'daily'],
  'موسيقى': ['music'],
  'فضاء': ['space'],
  'عسكري': ['military']
};

