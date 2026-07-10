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
