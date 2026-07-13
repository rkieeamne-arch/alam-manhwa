// Offline Database Utility for storing Manhua and Chapters in IndexedDB
const DB_NAME = 'manhua_offline_db';
const DB_VERSION = 1;

export interface OfflineManhua {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  author: string;
  artist?: string;
  status: string;
  categories: string[];
  releaseYear?: number;
  sourceId?: string;
  downloadedAt: number;
}

export interface OfflineChapter {
  id: string;
  manhuaId: string;
  title: string;
  chapterNumber: number;
  pages: string[]; // Base64 data strings representing downloaded pages
  downloadedAt: number;
}

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('manhuas')) {
        db.createObjectStore('manhuas', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('chapters')) {
        const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' });
        chapterStore.createIndex('manhuaId', 'manhuaId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Save a Manhua metadata offline
export async function saveManhuaOffline(manhua: OfflineManhua): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('manhuas', 'readwrite');
    const store = tx.objectStore('manhuas');
    const request = store.put(manhua);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Fetch all offline manhuas
export async function getOfflineManhuas(): Promise<OfflineManhua[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('manhuas', 'readonly');
    const store = tx.objectStore('manhuas');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Fetch a single offline manhua metadata
export async function getOfflineManhua(id: string): Promise<OfflineManhua | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('manhuas', 'readonly');
    const store = tx.objectStore('manhuas');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Save a single Chapter offline (along with pages as base64 strings)
export async function saveChapterOffline(chapter: OfflineChapter): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readwrite');
    const store = tx.objectStore('chapters');
    const request = store.put(chapter);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Fetch an offline chapter
export async function getOfflineChapter(id: string): Promise<OfflineChapter | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readonly');
    const store = tx.objectStore('chapters');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Get all downloaded chapters for a specific Manhua
export async function getOfflineChaptersForManhua(manhuaId: string): Promise<OfflineChapter[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readonly');
    const store = tx.objectStore('chapters');
    const index = store.index('manhuaId');
    const request = index.getAll(IDBKeyRange.only(manhuaId));

    request.onsuccess = () => {
      const results = request.result || [];
      // Sort chapters by chapterNumber ascending or descending
      results.sort((a, b) => b.chapterNumber - a.chapterNumber);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

// Delete a specific chapter from local database
export async function deleteChapterOffline(chapterId: string, manhuaId: string): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    // We open a readwrite transaction for both object stores to perform an atomic single-transaction operation
    const tx = db.transaction(['chapters', 'manhuas'], 'readwrite');
    
    // 1. Delete the chapter
    const chapterStore = tx.objectStore('chapters');
    chapterStore.delete(chapterId);

    // 2. Check if there are any remaining chapters for this manhua in the index
    const index = chapterStore.index('manhuaId');
    const countRequest = index.count(IDBKeyRange.only(manhuaId));

    countRequest.onsuccess = () => {
      const remainingCount = countRequest.result;
      if (remainingCount === 0) {
        // If no chapters remain for this manhua, delete the manhua's metadata as well
        const manhuaStore = tx.objectStore('manhuas');
        manhuaStore.delete(manhuaId);
      }
    };

    tx.oncomplete = () => {
      resolve();
    };

    tx.onerror = () => {
      reject(tx.error);
    };
  });
}

// Delete an entire Manhua and all its offline chapters
export async function deleteManhuaOffline(manhuaId: string): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['chapters', 'manhuas'], 'readwrite');
    
    // 1. Delete all chapters with this manhuaId
    const chapterStore = tx.objectStore('chapters');
    const index = chapterStore.index('manhuaId');
    const getKeysRequest = index.getAllKeys(IDBKeyRange.only(manhuaId));

    getKeysRequest.onsuccess = () => {
      const keys = getKeysRequest.result;
      keys.forEach((key) => {
        chapterStore.delete(key);
      });
    };

    // 2. Delete the manhua entry itself
    const manhuaStore = tx.objectStore('manhuas');
    manhuaStore.delete(manhuaId);

    tx.oncomplete = () => {
      resolve();
    };

    tx.onerror = () => {
      reject(tx.error);
    };
  });
}

// Convert any image URL (proxied) to base64 data string
export async function convertUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert image blob to base64'));
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error converting URL to Base64:', url, err);
    // If conversion fails (due to network or CORS), return the original URL as a fallback
    return url;
  }
}
