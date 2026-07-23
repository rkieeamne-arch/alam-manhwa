import { Manhua, ManhuaComment, ScraperSource } from './types';

// Helper to generate realistic high-quality anime/manga style page images
const getPageImage = (id: number) => {
  // Use curated anime, comic and sketch illustrations
  const urls = [
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80', // Anime gaming scene
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80', // Anime character illustration
    'https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=800&auto=format&fit=crop&q=80', // Neon manga-like art
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80', // Dynamic colorful vector
    'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800&auto=format&fit=crop&q=80', // Japanese background art
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80', // Fantasy landscape art
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80', // Cosmic fantasy warrior
    'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&auto=format&fit=crop&q=80', // Dynamic dark sketch
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', // Dark energy swirls
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', // Neon Japanese street
  ];
  return urls[id % urls.length];
};

export const categoriesList = [
  'أكشن',
  'مغامرة',
  'خيال',
  'فنون قتالية',
  'زراعة (Cultivation)',
  'إيسيكاي (Isekai)',
  'نظام (System)',
  'زمن (Regression)',
  'كوميديا',
  'دراما',
  'رومنسي',
  'إثارة',
  'غموض',
  'نفسي',
  'قوة خارقة',
  'تاريخي',
  'خارق للطبيعة',
  'حياة مدرسية',
  'سحر',
  'شياطين',
  'ويب تون',
  'شريحة من الحياة',
  'تشويق',
  'رعب',
  'حريم',
  'إعادة تجسيد',
  'سفر عبر الزمن',
  'ألعاب',
  'ميكا',
  'خيال علمي',
  'رياضة',
  'شوجو',
  'شونين',
  'سينين',
  'مأساة',
  'حياة يومية'
];

export const animeCategoriesList = [
  'أكشن',
  'مغامرة',
  'خيال',
  'كوميديا',
  'دراما',
  'رومنسي',
  'غموض',
  'إثارة',
  'سحر',
  'شياطين',
  'إيسيكاي',
  'خارق للطبيعة',
  'حياة مدرسية',
  'قوة خارقة',
  'شريحة من الحياة',
  'خيال علمي',
  'ميكا',
  'رياضة',
  'تاريخي',
  'رعب',
  'تشويق',
  'موسيقى',
  'فضاء',
  'عسكري',
  'ألعاب',
  'شونين',
  'شوجو',
  'سينين'
];

export const mockManhuas: Manhua[] = [];
export const mockComments: ManhuaComment[] = [
  {
    id: 'c1',
    manhuaId: '1',
    chapterId: '1-10',
    userEmail: 'ali.manga@gmail.com',
    userName: 'علي الأسطوري',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    content: 'يا رفاق، هذا الفصل أسطوري للغاية! تشين تانغ سحق قيد الروح العاشر بضربة واحدة فقط! لا أطيق الانتظار لرؤية رد فعل الشيوخ في الفصول القادمة!',
    timestamp: 'منذ ساعتين',
    likes: 42
  },
  {
    id: 'c2',
    manhuaId: '1',
    chapterId: '1-10',
    userEmail: 'sara.reader@yahoo.com',
    userName: 'سارة أوتاكو',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    content: 'الرسم في هذه المانهو يتحسن مع كل فصل جديد، الألوان هنا لا تصدق والقتالات حماسية جداً. شكراً لكم على الترجمة الراقية وجودة الصور العالية!',
    timestamp: 'منذ 5 ساعات',
    likes: 28
  },
  {
    id: 'c3',
    manhuaId: '2',
    chapterId: '2-5',
    userEmail: 'rkieeamne@gmail.com',
    userName: 'رائد (مدير الموقع)',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    content: 'أهلاً بكم في عالم المانهو! يسعدني جداً أن جودة العرض والوضع الليلي تروق لكم. سنعمل دائماً على تقديم الأفضل.',
    timestamp: 'منذ يوم واحد',
    likes: 125
  }
];

export const defaultScraperSources: ScraperSource[] = [
  {
    id: 'azorafly',
    name: 'Azora Manga (الرسمي)',
    baseUrl: 'https://azorafly.com',
    popularPath: '/series/',
    listCardSelector: 'div.bg-card.text-card-foreground, div.rounded-xl.border',
    listTitleSelector: 'a.font-bold, a.text-sm',
    listLinkSelector: 'a.font-bold, a.text-sm',
    listCoverSelector: 'img',
    listCoverAttr: 'src',
    listChapterSelector: 'a[href*="/chapter-"]',
    
    detailTitleSelector: 'h1[itemProp="name"], h1',
    detailDescSelector: 'div[itemProp="description"], [itemProp="description"]',
    detailAuthorSelector: '[itemprop="author"]',
    detailArtistSelector: '[itemprop="artist"]',
    detailStatusSelector: '[itemprop="status"]',
    detailGenreSelector: '[itemProp="genre"], a[href*="/genre/"]',
    
    detailChapterItemSelector: 'a[href*="/chapter-"]:not(:has(button))',
    detailChapterLinkSelector: 'a',
    detailChapterTitleSelector: 'span.font-medium, span',
    
    pageImgSelector: 'img[data-reader-page-image]',
    pageImgAttr: 'src',
    type: 'manga'
  },
  {
    id: 'despair',
    name: 'Despair Manga',
    baseUrl: 'https://despair-manga.net',
    popularPath: '/manga/',
    listCardSelector: '.page-item-detail, .manga-entry',
    listTitleSelector: '.post-title a, h3 a, h5 a',
    listLinkSelector: 'a',
    listCoverSelector: 'img',
    listCoverAttr: 'src',
    
    detailTitleSelector: 'h1',
    detailDescSelector: '.description-summary, .manga-about, .summary-content, .entry-content',
    detailAuthorSelector: 'unknown',
    detailArtistSelector: 'unknown',
    detailStatusSelector: 'unknown',
    detailGenreSelector: 'unknown',
    
    detailChapterItemSelector: 'li.wp-manga-chapter',
    detailChapterLinkSelector: 'a',
    detailChapterTitleSelector: 'a',
    
    pageImgSelector: '.page-break img, .wp-manga-chapter-img img, div.reading-content img',
    pageImgAttr: 'src',
    type: 'manga'
  },
  {
    id: 'kingofshojo',
    name: 'King of Shojo (ملوك الشوجو)',
    baseUrl: 'https://kingofshojo.com',
    lang: 'ar',
    popularPath: '/manga/',
    listCardSelector: '.page-item-detail, .manga-entry, div.bs, div.post-item',
    listTitleSelector: '.post-title a, h3 a, h5 a, .tt a, h1, h2, h3',
    listLinkSelector: 'a',
    listCoverSelector: 'img',
    listCoverAttr: 'src',
    
    detailTitleSelector: 'h1',
    detailDescSelector: '.description-summary, .manga-about, .summary-content, .entry-content, p',
    detailAuthorSelector: 'unknown',
    detailArtistSelector: 'unknown',
    detailStatusSelector: 'unknown',
    detailGenreSelector: 'unknown',
    
    detailChapterItemSelector: '#chapterlist li, .eplister li',
    detailChapterLinkSelector: 'a',
    detailChapterTitleSelector: 'span.chapternum',
    
    pageImgSelector: 'img.preload-image, div.page img, .page-break img, .wp-manga-chapter-img img, div.reading-content img',
    pageImgAttr: 'src',
    type: 'manga'
  },
  {
    id: 'rocksmanga',
    name: 'Rocks Manga',
    baseUrl: 'https://rocksmanga.com',
    lang: 'ar',
    icon: 'https://rocksmanga.com/wp-content/uploads/2026/01/rocks-logo.png',
    popularPath: '/',
    listCardSelector: 'div.unit',
    listTitleSelector: 'div.info > a, span',
    listLinkSelector: 'div.info > a, a',
    listCoverSelector: 'img',
    listCoverAttr: 'src',
    
    detailTitleSelector: 'h1',
    detailDescSelector: '.info > h6, .description-summary, .manga-about, .summary-content, .entry-content',
    detailAuthorSelector: 'unknown',
    detailArtistSelector: 'unknown',
    detailStatusSelector: '.info > p, .summary-content',
    detailGenreSelector: '.genres-content a',
    
    detailChapterItemSelector: 'li.item, li.wp-manga-chapter, ul.chapter-list li',
    detailChapterLinkSelector: 'a',
    detailChapterTitleSelector: 'zebi',
    
    pageImgSelector: 'img.preload-image, div.page img, .page-break img, .wp-manga-chapter-img img, div.reading-content img',
    pageImgAttr: 'data-src',
    type: 'manga'
  },
  {
    id: 'mangatuk',
    name: 'Mangatuk (مانجاتك)',
    baseUrl: 'https://mangatuk.com',
    lang: 'ar',
    popularPath: '/',
    listCardSelector: 'a[href^="/series/"]',
    listTitleSelector: 'h3, .title',
    listLinkSelector: 'a',
    listCoverSelector: 'img',
    listCoverAttr: 'src',
    
    detailTitleSelector: 'h1',
    detailDescSelector: 'p',
    detailAuthorSelector: 'unknown',
    detailArtistSelector: 'unknown',
    detailStatusSelector: 'unknown',
    detailGenreSelector: 'unknown',
    
    detailChapterItemSelector: 'a[href*="/series/"]',
    detailChapterLinkSelector: 'a',
    detailChapterTitleSelector: 'span',
    
    pageImgSelector: 'img',
    pageImgAttr: 'src',
    type: 'manga'
  },
  {
    id: 'anime4up',
    name: 'Anime4Up',
    baseUrl: 'https://w1.anime4up.rest',
    icon: 'https://w1.anime4up.rest/wp-content/uploads/2020/05/145DFG5S6D6GH5.png',
    popularPath: '/home8/',
    type: 'anime',
    lang: 'ar',
    listCardSelector: 'div.anime-card-container, div.anime-post, div.poster, div.box-item, div.item, .episodes-list .item, .latest-episodes .item, article.item, .hentry, .anime-card, a.anime-card, .box',
    listTitleSelector: 'h3, .title, .entry-title, a.font-bold, a.text-sm, .anime-card-title, h4',
    listLinkSelector: 'a',
    listCoverSelector: 'img',
    listCoverAttr: 'src',
    detailTitleSelector: 'h1, .entry-title, .anime-title, .title',
    detailDescSelector: '.anime-story, .story, .entry-content, .description, p',
    detailAuthorSelector: 'unknown',
    detailArtistSelector: 'unknown',
    detailStatusSelector: 'unknown',
    detailGenreSelector: '.genres-content a, a[href*="/genre/"], .genres a, .genre a',
    detailChapterItemSelector: 'a[href*="/episode/"], a[href*="/episodes/"], a[href*="/episodio/"], a[href*="/episodios/"], a[href*="/ep-"], .episodes-list a, .episodios a, li.episodio a, .episodes a, [class*="episod"] a, [id*="episod"] a, [id*="episode"] a',
    detailChapterLinkSelector: 'a',
    detailChapterTitleSelector: 'span, h3, a, .title, .ep-title',
    pageImgSelector: 'iframe, .server-list li a, .episodes-links li a, #episode-servers li a, ul.servers li a, iframe[src]',
    pageImgAttr: 'src'
  },
  {
    id: 'witanime',
    name: 'WitAnime',
    baseUrl: 'https://ristoanime.me',
    icon: 'https://ristoanime.me/wp-content/uploads/2021/03/wit-logo.png',
    popularPath: '/series/',
    type: 'anime',
    lang: 'ar',
    listCardSelector: '.MovieItem, .animiyat, a.CARTA, .anime-card, .col-md-2, .item',
    listTitleSelector: 'h4, h3, .title, .anime-title',
    listLinkSelector: 'a',
    listCoverSelector: 'img',
    listCoverAttr: 'src',
    detailTitleSelector: 'h1.entry-title, h1',
    detailDescSelector: '.StoryArea, .anime-story, .story-text, .post-content',
    detailAuthorSelector: 'unknown',
    detailArtistSelector: 'unknown',
    detailStatusSelector: 'unknown',
    detailGenreSelector: '.anime-genres a, .genres-list a',
    detailChapterItemSelector: 'ul.episodes-list a, .List-Episodes a, a[href*="/episode/"]',
    detailChapterLinkSelector: 'a',
    detailChapterTitleSelector: 'span, h4, a',
    pageImgSelector: 'iframe',
    pageImgAttr: 'src'
  }
];
