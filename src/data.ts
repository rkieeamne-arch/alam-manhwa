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

export const mockManhuas: Manhua[] = [
  {
    id: '1',
    title: 'سيد الزراعة السماوية الوحيد',
    englishTitle: 'The Sole Celestial Cultivator',
    coverUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
    description: 'بعد أن تم خيانته من قبل زملائه في الطائفة وإلقائه في هاوية الروح المظلمة، يستيقظ تشين تانغ مع كتاب الإمبراطور السماوي المفقود. يبدأ رحلته في الزراعة والانتقام الشديد متخطياً الحدود البشرية للوصول لقمة الكون.',
    rating: 4.9,
    views: 1240500,
    status: 'مستمر',
    author: 'شياو هان',
    artist: 'استوديو التنين الأحمر',
    categories: ['أكشن', 'خيال', 'فنون قتالية', 'زراعة (Cultivation)'],
    releaseYear: 2025,
    isFeatured: true,
    isTrending: true,
    chapters: [
      {
        id: '1-10',
        manhuaId: '1',
        title: 'الفصل 10: كسر القيد الروحي العاشر',
        chapterNumber: 10,
        releaseDate: '2026-07-07',
        views: 12400,
        pages: [getPageImage(0), getPageImage(1), getPageImage(2), getPageImage(3), getPageImage(4)]
      },
      {
        id: '1-9',
        manhuaId: '1',
        title: 'الفصل 09: مواجهة وحش لهيب الجحيم',
        chapterNumber: 9,
        releaseDate: '2026-07-04',
        views: 15100,
        pages: [getPageImage(5), getPageImage(6), getPageImage(7), getPageImage(8), getPageImage(9)]
      },
      {
        id: '1-8',
        manhuaId: '1',
        title: 'الفصل 08: العودة إلى عائلة تشين',
        chapterNumber: 8,
        releaseDate: '2026-06-30',
        views: 18900,
        pages: [getPageImage(2), getPageImage(3), getPageImage(0), getPageImage(1), getPageImage(5)]
      },
      {
        id: '1-1',
        manhuaId: '1',
        title: 'الفصل 01: كتاب الإمبراطور السماوي',
        chapterNumber: 1,
        releaseDate: '2026-05-01',
        views: 45000,
        pages: [getPageImage(4), getPageImage(8), getPageImage(9), getPageImage(1), getPageImage(3)]
      }
    ]
  },
  {
    id: '2',
    title: 'الإمبراطور الساحر العائد من الجحيم',
    englishTitle: 'The Demon Emperor Returns',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    description: 'تم تصنيف تشو فان كأقوى ساحر وشيطان في العالم السفلي، ولكن بعد أن تعرض لمكيدة غادرة من رفقائه ومات، ولد مجدداً في جسد خادم عاجز لعائلة نبيلة على وشك الانهيار. الآن بذكائه وخبرته السابقة، يعود ليخضع الجميع تحت قدميه.',
    rating: 4.8,
    views: 942100,
    status: 'مستمر',
    author: 'يي لونغ',
    artist: 'المروحة الذهبية',
    categories: ['أكشن', 'مغامرة', 'دراما', 'إثارة'],
    releaseYear: 2025,
    isFeatured: true,
    isTrending: true,
    chapters: [
      {
        id: '2-5',
        manhuaId: '2',
        title: 'الفصل 05: هالة الشيطان التي لا تقهر',
        chapterNumber: 5,
        releaseDate: '2026-07-06',
        views: 22000,
        pages: [getPageImage(3), getPageImage(4), getPageImage(5), getPageImage(6)]
      },
      {
        id: '2-4',
        manhuaId: '2',
        title: 'الفصل 04: إنقاذ سيدة العائلة الشابة',
        chapterNumber: 4,
        releaseDate: '2026-07-02',
        views: 26000,
        pages: [getPageImage(7), getPageImage(8), getPageImage(9), getPageImage(0)]
      },
      {
        id: '2-1',
        manhuaId: '2',
        title: 'الفصل 01: ولادة خادم الشيطان',
        chapterNumber: 1,
        releaseDate: '2026-06-15',
        views: 62000,
        pages: [getPageImage(1), getPageImage(2), getPageImage(3), getPageImage(4)]
      }
    ]
  },
  {
    id: '3',
    title: 'مستوى الأسطورة المطلق',
    englishTitle: 'Absolute Mythical Leveling',
    coverUrl: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&auto=format&fit=crop&q=80',
    description: 'في عالم تظهر فيه الأبراج والوحوش كألعاب فيديو واقعية، يظل بطلنا لسنوات في رتبة F الضعيفة، حتى يعثر على واجهة مستخدم مخفية تمنحه ميزة "المستوى الأسطوري اللامتناهي". كل خطوة يخطوها تزيد من قوته بشكل مضاعف وخارق.',
    rating: 4.7,
    views: 812000,
    status: 'مستمر',
    author: 'بارك مين',
    artist: 'استوديو نيون',
    categories: ['أكشن', 'مغامرة', 'خيال', 'إثارة'],
    releaseYear: 2026,
    isFeatured: false,
    isTrending: true,
    chapters: [
      {
        id: '3-3',
        manhuaId: '3',
        title: 'الفصل 03: وحش الطابق الثاني النادر',
        chapterNumber: 3,
        releaseDate: '2026-07-05',
        views: 31000,
        pages: [getPageImage(6), getPageImage(7), getPageImage(8)]
      },
      {
        id: '3-2',
        manhuaId: '3',
        title: 'الفصل 02: الحصول على مهارة العين الأسطورية',
        chapterNumber: 2,
        releaseDate: '2026-07-01',
        views: 35000,
        pages: [getPageImage(9), getPageImage(0), getPageImage(1)]
      },
      {
        id: '3-1',
        manhuaId: '3',
        title: 'الفصل 01: الصياد ذو الرتبة المخفية',
        chapterNumber: 1,
        releaseDate: '2026-06-20',
        views: 49000,
        pages: [getPageImage(2), getPageImage(3), getPageImage(4)]
      }
    ]
  },
  {
    id: '4',
    title: 'تطوير سلاح الإله القديم',
    englishTitle: 'Ancient God Weapon Evolution',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    description: 'في عالم يتم فيه تحديد القيمة بنوع السلاح الروحي الذي يوقظه الشخص، يوقظ لين يي سيفاً مكسوراً لا فائدة منه ويصبح أضحوكة المدينة. لكنه يكتشف أنه سيف إلهي مفقود يتغذى على الأسلحة الأخرى ليتطور ويمنحه مهارات خارقة للطبيعة.',
    rating: 4.6,
    views: 520000,
    status: 'مكتمل',
    author: 'وانغ وى',
    artist: 'المطر الأسود',
    categories: ['أكشن', 'خيال', 'فنون قتالية', 'زراعة (Cultivation)'],
    releaseYear: 2024,
    isFeatured: false,
    isTrending: false,
    chapters: [
      {
        id: '4-4',
        manhuaId: '4',
        title: 'الفصل 04: التطور الأول لسيف الريح السماوي (الأخير)',
        chapterNumber: 4,
        releaseDate: '2026-05-12',
        views: 45000,
        pages: [getPageImage(0), getPageImage(1), getPageImage(2), getPageImage(3), getPageImage(4), getPageImage(5)]
      },
      {
        id: '4-3',
        manhuaId: '4',
        title: 'الفصل 03: غابة الفولاذ المظلمة',
        chapterNumber: 3,
        releaseDate: '2026-04-20',
        views: 48000,
        pages: [getPageImage(6), getPageImage(7), getPageImage(8), getPageImage(9)]
      },
      {
        id: '4-2',
        manhuaId: '4',
        title: 'الفصل 02: اختبار القبول في الأكاديمية العظمى',
        chapterNumber: 2,
        releaseDate: '2026-04-10',
        views: 51000,
        pages: [getPageImage(1), getPageImage(2), getPageImage(3), getPageImage(4)]
      },
      {
        id: '4-1',
        manhuaId: '4',
        title: 'الفصل 01: سيف لين المكسور الغامض',
        chapterNumber: 1,
        releaseDate: '2026-04-01',
        views: 65000,
        pages: [getPageImage(5), getPageImage(6), getPageImage(7), getPageImage(8)]
      }
    ]
  },
  {
    id: '5',
    title: 'قصة الحب في عهد السلالات المفقودة',
    englishTitle: 'Love in the Lost Dynasty',
    coverUrl: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=1200&auto=format&fit=crop&q=80',
    description: 'أميرة هاربة متنكرة في زي جندي مخلص تبحث عن حقيقة المجزرة التي لحقت بعائلتها الحاكمة السابقة، لكنها تقع في شراك قائد الجيش الجديد الذي تم تكليفه بالقضاء على بقايا السلالة القديمة. قصة مشوقة مليئة بالرومانسية والمؤامرات السياسية والتضحية.',
    rating: 4.5,
    views: 310200,
    status: 'متوقف مؤقتاً',
    author: 'لو شين',
    artist: 'ألوان الربيع',
    categories: ['رومنسي', 'دراما', 'مغامرة', 'شريحة من الحياة'],
    releaseYear: 2025,
    isFeatured: false,
    isTrending: false,
    chapters: [
      {
        id: '5-2',
        manhuaId: '5',
        title: 'الفصل 02: اكتشاف التنكر السري للأميرة',
        chapterNumber: 2,
        releaseDate: '2026-06-18',
        views: 18000,
        pages: [getPageImage(8), getPageImage(9), getPageImage(0), getPageImage(1)]
      },
      {
        id: '5-1',
        manhuaId: '5',
        title: 'الفصل 01: اللقاء الأول تحت المطر والسيوف',
        chapterNumber: 1,
        releaseDate: '2026-06-01',
        views: 29000,
        pages: [getPageImage(2), getPageImage(3), getPageImage(4), getPageImage(5)]
      }
    ]
  }
];

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
  }
];
