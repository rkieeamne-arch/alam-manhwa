import { UserProfile, ReadingHistoryItem, Manhua, ReadingListItem } from '../types';

// Helper to get local storage item safely
const getLocal = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return fallback;
  }
};

// Helper to set local storage item safely
const setLocal = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  const current = getLocal<UserProfile | null>('manhua_user_profile', null);
  const updated = {
    ...(current || {
      id: 'local-user',
      email: 'local@user.com',
      displayName: 'قارئ مخلص',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      joinedAt: new Date().toLocaleDateString('ar-EG'),
      bio: '',
      xp: 0,
      totalXp: 0
    }),
    ...data
  } as UserProfile;
  setLocal('manhua_user_profile', updated);
  return { user: updated, error: null };
};

export const fetchUserReadingHistory = async (userId: string): Promise<ReadingHistoryItem[]> => {
  return getLocal<ReadingHistoryItem[]>('manhua_reading_history', []);
};

export const saveUserReadingHistory = async (userId: string, item: Omit<ReadingHistoryItem, 'id' | 'lastReadTime'>): Promise<ReadingHistoryItem> => {
  const history = getLocal<ReadingHistoryItem[]>('manhua_reading_history', []);
  const existingIndex = history.findIndex(h => h.manhuaId === item.manhuaId);
  const newItem: ReadingHistoryItem = {
    ...item,
    id: existingIndex >= 0 ? history[existingIndex].id : 'hist-' + Date.now(),
    lastReadTime: new Date().toISOString()
  };

  let newHistory = [...history];
  if (existingIndex >= 0) {
    newHistory[existingIndex] = newItem;
  } else {
    newHistory.unshift(newItem);
  }

  setLocal('manhua_reading_history', newHistory);
  return newItem;
};

export const deleteUserHistoryItem = async (userId: string, historyId: string) => {
  const history = getLocal<ReadingHistoryItem[]>('manhua_reading_history', []);
  const updated = history.filter(h => h.id !== historyId);
  setLocal('manhua_reading_history', updated);
};

export const clearUserReadingHistory = async (userId: string) => {
  setLocal('manhua_reading_history', []);
};

export const fetchUserReadingList = async (userId: string): Promise<ReadingListItem[]> => {
  return getLocal<ReadingListItem[]>('manhua_reading_list', []);
};

export const addManhuaToReadingList = async (userId: string, manhua: Manhua, type: 'favorite' | 'reading' | 'plan'): Promise<ReadingListItem> => {
  const list = getLocal<ReadingListItem[]>('manhua_reading_list', []);
  const existingIndex = list.findIndex(item => item.manhuaId === manhua.id);
  const newItem: ReadingListItem = {
    id: existingIndex >= 0 ? list[existingIndex].id : 'list-' + Date.now(),
    userId,
    manhuaId: manhua.id,
    manhuaTitle: manhua.title,
    manhuaCover: manhua.coverUrl,
    listType: type,
    addedAt: new Date().toISOString()
  };

  let newList = [...list];
  if (existingIndex >= 0) {
    newList[existingIndex] = newItem;
  } else {
    newList.unshift(newItem);
  }

  setLocal('manhua_reading_list', newList);
  return newItem;
};

export const removeManhuaFromReadingList = async (userId: string, manhuaId: string) => {
  const list = getLocal<ReadingListItem[]>('manhua_reading_list', []);
  const updated = list.filter(item => item.manhuaId !== manhuaId);
  setLocal('manhua_reading_list', updated);
};
