import { CompanionState, CompanionType, CompanionStage, CosmeticItem } from '../types';

export const ALL_COSMETIC_ITEMS: CosmeticItem[] = [
  // Hats / Headwear
  { id: 'glasses', name: 'نظارات قراءة', category: 'hat', icon: '👓', description: 'نظارات أنيقة لقراءة ممتعة بتركيز', rarity: 'common' },
  { id: 'headphones', name: 'سماعات ألعاب', category: 'hat', icon: '🎧', description: 'سماعات محيطية مضيئة لمحب الأنمي والألعاب', rarity: 'rare', levelRequired: 2 },
  { id: 'flower_crown', name: 'تاج الأزهار', category: 'hat', icon: '🌸', description: 'أكليل ورد زاهي ينبض بطاقة الطبيعة', rarity: 'common' },
  { id: 'ninja_headband', name: 'عصابة النينجا', category: 'hat', icon: '🥷', description: 'عصابة جبهة نينجا محفور عليها رمز الشجاعة', rarity: 'rare', levelRequired: 4 },
  { id: 'wizard_hat', name: 'قبعة ساحر', category: 'hat', icon: '🧙‍♂️', description: 'قبعة ملونة مليئة بالطاقة السحرية', rarity: 'rare', levelRequired: 5 },
  { id: 'pirate_hat', name: 'قبعة قرصان', category: 'hat', icon: '🏴‍☠️', description: 'قبعة مغامر البحار والجزر المفقودة', rarity: 'rare', levelRequired: 6 },
  { id: 'cat_ears', name: 'آذان قطة', category: 'hat', icon: '🐱', description: 'آذان لطيفة تضفي طابعاً ظريفاً', rarity: 'rare', levelRequired: 3 },
  { id: 'detective_hat', name: 'قبعة التحري', category: 'hat', icon: '🕵️‍♂️', description: 'قبعة كلاسيكية لعشاق مانهو الغموض والذكاء', rarity: 'rare', levelRequired: 7 },
  { id: 'samurai_helmet', name: 'خوذة الساموراي', category: 'hat', icon: '🪖', description: 'خوذة حربية مهيبة تحمل شرف الساموراي', rarity: 'epic', levelRequired: 10 },
  { id: 'santa_hat', name: 'قبعة الشتاء الحمراء', category: 'hat', icon: '🎅', description: 'قبعة شتوية دافئة تضفي بهجة ولطافة', rarity: 'common' },
  { id: 'angel_halo', name: 'هالة ملاك', category: 'hat', icon: '👼', description: 'هالة نورانية مضيئة تطفو فوق الرأس', rarity: 'epic', levelRequired: 9 },
  { id: 'fox_mask', name: 'قناع الكيتسوني', category: 'hat', icon: '🦊', description: 'قناع ياباني تقليدي أسطوري بلمسات ذهبية', rarity: 'legendary', levelRequired: 12 },
  { id: 'crown', name: 'تاج ملكي', category: 'hat', icon: '👑', description: 'تاج مذهب يتلألأ بفخامة الملوك والأباطرة', rarity: 'legendary', levelRequired: 15 },
  { id: 'scarf', name: 'وشاح أنيق', category: 'hat', icon: '🧣', description: 'وشاح دافئ يحمي من برد الشتاء', rarity: 'common' },

  // Props / Accessories
  { id: 'coffee_cup', name: 'كوب قهوة', category: 'prop', icon: '☕', description: 'قهوة ساخنة ترافق جلسات القراءة الطويلة', rarity: 'common' },
  { id: 'gaming_controller', name: 'يد تحكم', category: 'prop', icon: '🎮', description: 'يد تحكم لألعاب القتال والمانجا', rarity: 'common' },
  { id: 'boba_tea', name: 'مشروب البوبا', category: 'prop', icon: '🧋', description: 'مشروب شاي الفقاعات اللذيذ المنعش', rarity: 'common' },
  { id: 'secret_book', name: 'كتاب الأسرار', category: 'prop', icon: '📖', description: 'مجلد يتضمن طلاسم وحكايات خيالية سحرية', rarity: 'rare', levelRequired: 4 },
  { id: 'magic_scroll', name: 'لفافة سحرية', category: 'prop', icon: '📜', description: 'لفافة قديمة تحوي مهارات قتالية محظورة', rarity: 'rare', levelRequired: 5 },
  { id: 'shield', name: 'درع البطولات', category: 'prop', icon: '🛡️', description: 'درع فولاذي يصد الهجمات العاتية', rarity: 'rare', levelRequired: 7 },
  { id: 'crystal_ball', name: 'بلورة الاستبصار', category: 'prop', icon: '🔮', description: 'بلورة سحرية تتنبأ بأحداث الفصل القادم', rarity: 'epic', levelRequired: 8 },
  { id: 'holding_heart', name: 'قلب الحب النابض', category: 'prop', icon: '💖', description: 'قلب دافئ يشع بمحبة كبيرة لرفيقه', rarity: 'common' },
  { id: 'magic_wand', name: 'عصا سحرية', category: 'prop', icon: '✨', description: 'عصا تشع بالضوء والبريق عند اللمس', rarity: 'rare', levelRequired: 8 },
  { id: 'phoenix_feather', name: 'ريشة العنقاء', category: 'prop', icon: '🪶', description: 'ريشة متوهجة بالنار تعيد الحياة والنشاط', rarity: 'epic', levelRequired: 10 },
  { id: 'legendary_sword', name: 'سيف أسطوري', category: 'prop', icon: '⚔️', description: 'سيف ذو هالة بطولية ينبعث منه النور', rarity: 'epic', levelRequired: 12 },
  { id: 'golden_key', name: 'مفتاح الكنز', category: 'prop', icon: '🗝️', description: 'مفتاح ذهبي يفتح الأبواب والجوائز الأسطورية', rarity: 'legendary', levelRequired: 14 },

  // Visual Auras / Effects
  { id: 'star_sparkles', name: 'بريق النجوم', category: 'aura', icon: '⭐', description: 'نجوم مضيئة تتلألأ بحركات لطيفة', rarity: 'common' },
  { id: 'fireflies', name: 'فراشات الضوء', category: 'aura', icon: '💡', description: 'فراشات ضوئية دافئة تطير بسلام حول الرفيق', rarity: 'rare', levelRequired: 5 },
  { id: 'cherry_blossom', name: 'زهور الكرز', category: 'aura', icon: '🌸', description: 'بتلات زهر الكرز تتساقط برقة ولطافة', rarity: 'rare', levelRequired: 3 },
  { id: 'sakura_petals', name: 'أوراق الساكورا', category: 'aura', icon: '🌺', description: 'هالة زهرية تحيط بالرفيق بألوان ساحرة', rarity: 'rare', levelRequired: 6 },
  { id: 'thunder_sparks', name: 'شرارات البرق', category: 'aura', icon: '⚡', description: 'صواعق كهربائية خفيفة تدور بحماس', rarity: 'epic', levelRequired: 8 },
  { id: 'dragon_flame', name: 'لهب التنين', category: 'aura', icon: '🔥', description: 'شرارات نارية دافئة متوهجة', rarity: 'epic', levelRequired: 10 },
  { id: 'shadow_flame', name: 'لهب الظلال', category: 'aura', icon: '🖤', description: 'هالة ظلامية ملحمية من نيران الأثير', rarity: 'epic', levelRequired: 13 },
  { id: 'galaxy_nebula', name: 'سديم المجرة', category: 'aura', icon: '🌌', description: 'غبار كوني ومجرات دوارة مبهرة', rarity: 'legendary', levelRequired: 16 },
  { id: 'magic_runes', name: 'رموز سحرية', category: 'aura', icon: '🔮', description: 'رموز أثيرية تدور بنسق سحري أخاذ', rarity: 'legendary', levelRequired: 18 },

  // Backgrounds
  { id: 'cozy_library', name: 'مكتبة دافئة', category: 'background', icon: '📚', description: 'مكتبة خشبية هادئة محاطة بالكتب', rarity: 'common' },
  { id: 'sunset_beach', name: 'شاطئ الغروب', category: 'background', icon: '🌅', description: 'منظر غروب رائع على شاطئ البحر', rarity: 'common' },
  { id: 'starry_sky', name: 'سماء مرصعة', category: 'background', icon: '🌌', description: 'ليلة ساحرة تحت ضوء القمر والنجوم', rarity: 'rare', levelRequired: 7 },
  { id: 'ancient_temple', name: 'معبد شينتو القديم', category: 'background', icon: '⛩️', description: 'معبد تقليدي هادئ محاط بأوراق القيقب الأحمر', rarity: 'rare', levelRequired: 8 },
  { id: 'floating_castle', name: 'قلعة معلقة', category: 'background', icon: '🏰', description: 'قلعة أسطورية طافية بين الغيوم', rarity: 'epic', levelRequired: 10 },
  { id: 'royal_throne', name: 'قاعة العرش', category: 'background', icon: '👑', description: 'قاعة ملوكية مهيبة تليق بقارئ عظيم مثلك', rarity: 'epic', levelRequired: 12 },
  { id: 'enchanted_forest', name: 'غابة سحرية', category: 'background', icon: '🌲', description: 'أشجار مشعة ومظاهر طبيعية خيالية', rarity: 'epic', levelRequired: 14 },
  { id: 'cyberpunk_city', name: 'مدينة النيون', category: 'background', icon: '🏙️', description: 'مدينة أنمي مستقبلية بإضاءة نيون مبهرة', rarity: 'legendary', levelRequired: 15 }
];

export const COMPANION_NAMES: Record<CompanionType, string> = {
  wolf: 'ذئب الشفق',
  dragon: 'تنين النار',
  fox: 'ثعلب النور',
  spirit: 'روح الأثير'
};

export const COMPANION_DESCRIPTIONS: Record<CompanionType, string> = {
  wolf: 'رفيق ذكي ووفي يتألق بهالة زرقاء ملكية وشجاعة عالية.',
  dragon: 'تنين صغير شجاع ومرح ينفث الشرارات الذهبية عند الحماس.',
  fox: 'ثعلب ظريف وسريع الفهم يحب الاستكشاف والتجول بين الفصول.',
  spirit: 'هالة سحرية لطيفة تشع بالسكينة وترافقك بهدوء.'
};

export const DEFAULT_COMPANION_STATE: CompanionState = {
  enabled: true,
  hatched: false,
  type: 'wolf',
  name: 'ذئب الشفق',
  stage: 'egg',
  level: 1,
  xp: 0,
  maxXp: 30,
  chaptersRead: 0,
  episodesWatched: 0,
  unopenedChests: 0,
  happiness: 100,
  lastCareTime: new Date(0).toISOString(),
  lastInteractionTime: new Date().toISOString(),
  inventory: ['glasses', 'coffee_cup', 'star_sparkles', 'cozy_library'],
  equipped: {},
  minimized: false,
  hidden: false,
};

export function getCompanionState(): CompanionState {
  const saved = localStorage.getItem('manhua_companion_state');
  let state = DEFAULT_COMPANION_STATE;
  if (saved) {
    try {
      state = { ...DEFAULT_COMPANION_STATE, ...JSON.parse(saved) };
    } catch (e) {
      state = DEFAULT_COMPANION_STATE;
    }
  }

  // Ensure unhatched companion remains in 'egg' stage
  if (!state.hatched) {
    state.stage = 'egg';
  }

  // Calculate mood / happiness decay based on inactivity (>4 days)
  if (state.lastInteractionTime) {
    const lastDate = new Date(state.lastInteractionTime).getTime();
    const now = Date.now();
    const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
    
    // Non-intrusive: if away for > 4 days, happiness drops to 25% (sad mode, never dies)
    if (diffDays > 4 && state.happiness > 25) {
      state.happiness = 25;
    }
  }

  return state;
}

export function saveCompanionState(state: CompanionState): void {
  localStorage.setItem('manhua_companion_state', JSON.stringify(state));
}

export function calculateStage(level: number): CompanionStage {
  if (level >= 11) return 'adult';
  if (level >= 5) return 'teen';
  return 'baby';
}

export function addReadingProgress(
  type: 'chapter' | 'episode',
  amount: number = 1
): { newState: CompanionState; leveledUp: boolean; newChestEarned: boolean } {
  const state = getCompanionState();
  if (!state.enabled) {
    return { newState: state, leveledUp: false, newChestEarned: false };
  }

  if (type === 'chapter') {
    state.chaptersRead += amount;
  } else {
    state.episodesWatched += amount;
  }

  state.lastInteractionTime = new Date().toISOString();

  // If NOT hatched yet, do NOT gain XP or change stage from egg
  if (!state.hatched) {
    state.stage = 'egg';
    saveCompanionState(state);
    return { newState: state, leveledUp: false, newChestEarned: false };
  }

  const xpGain = type === 'chapter' ? 10 * amount : 15 * amount;
  state.xp += xpGain;
  
  // Chapter Milestone check: every 100 chapters gives a loot chest!
  const totalMilestones = Math.floor(state.chaptersRead / 100);
  const prevMilestones = Math.floor((state.chaptersRead - amount) / 100);
  let newChestEarned = false;

  if (totalMilestones > prevMilestones && state.chaptersRead >= 100) {
    state.unopenedChests += (totalMilestones - prevMilestones);
    newChestEarned = true;
  }

  // Level Up logic
  let leveledUp = false;
  while (state.xp >= state.maxXp) {
    state.xp -= state.maxXp;
    state.level += 1;
    state.maxXp = state.level * 30; // Scale XP needed
    leveledUp = true;
  }

  if (leveledUp) {
    state.stage = calculateStage(state.level);
    state.happiness = 100; // Refill happiness on level up
  }

  saveCompanionState(state);
  return { newState: state, leveledUp, newChestEarned };
}

export function hatchCompanion(type: CompanionType, name?: string): CompanionState {
  const state = getCompanionState();
  state.hatched = true;
  state.type = type;
  state.name = name?.trim() || COMPANION_NAMES[type] || 'رفيقي العزيز';
  state.stage = 'baby';
  state.level = Math.max(1, state.level);
  state.happiness = 100;
  state.lastInteractionTime = new Date().toISOString();
  state.lastCareTime = new Date().toISOString();
  
  saveCompanionState(state);
  return state;
}

export function changeCompanionType(type: CompanionType): CompanionState {
  const state = getCompanionState();
  state.type = type;
  saveCompanionState(state);
  return state;
}

export function openLootChest(): { newState: CompanionState; item: CosmeticItem | null } {
  const state = getCompanionState();
  if (state.unopenedChests <= 0) {
    return { newState: state, item: null };
  }

  state.unopenedChests -= 1;

  // Filter unowned cosmetics
  const unowned = ALL_COSMETIC_ITEMS.filter(item => !state.inventory.includes(item.id));
  
  let rewardedItem: CosmeticItem;
  if (unowned.length > 0) {
    // Weighted selection by rarity
    const rareWeight = unowned.filter(i => i.rarity === 'common' || i.rarity === 'rare');
    const pool = rareWeight.length > 0 ? rareWeight : unowned;
    rewardedItem = pool[Math.floor(Math.random() * pool.length)];
    state.inventory.push(rewardedItem.id);
  } else {
    // Fallback if all owned: give 100 XP
    state.xp += 100;
    while (state.xp >= state.maxXp) {
      state.xp -= state.maxXp;
      state.level += 1;
      state.maxXp = state.level * 30;
    }
    state.stage = calculateStage(state.level);
    rewardedItem = {
      id: 'xp_bonus',
      name: '100 XP خبرة إضافية',
      category: 'prop',
      icon: '⚡',
      description: 'تم تحويل الجائزة إلى نقاط خبرة لأنك تمتلك جميع المقتنيات!',
      rarity: 'legendary'
    };
  }

  saveCompanionState(state);
  return { newState: state, item: rewardedItem };
}

export function equipCosmetic(category: 'hat' | 'prop' | 'aura' | 'background', itemId: string | null): CompanionState {
  const state = getCompanionState();
  if (itemId === null) {
    delete state.equipped[category];
  } else {
    state.equipped[category] = itemId;
  }
  saveCompanionState(state);
  return state;
}

export function resetCompanionState(): CompanionState {
  saveCompanionState(DEFAULT_COMPANION_STATE);
  return DEFAULT_COMPANION_STATE;
}

export function requestResetCompanion(): CompanionState {
  const state = getCompanionState();
  state.resetRequestedAt = new Date().toISOString();
  saveCompanionState(state);
  return state;
}

export function cancelResetCompanion(): CompanionState {
  const state = getCompanionState();
  delete state.resetRequestedAt;
  saveCompanionState(state);
  return state;
}

