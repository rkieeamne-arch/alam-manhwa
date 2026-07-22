// Appwrite REST Client Helper for Admin Ads & Settings Management

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  adsCollectionId: string;
}

export interface AppwriteAd {
  $id?: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: 'top_banner' | 'reader_bottom' | 'sidebar' | 'popup';
  isActive: boolean;
  createdAt?: string;
}

const STORAGE_KEY = 'appwrite_admin_config';
const LOCAL_ADS_KEY = 'app_custom_ads';

export function getStoredAppwriteConfig(): AppwriteConfig {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '6a61447d000370258e9b',
    databaseId: '6a6149de000f97dcbc2c',
    adsCollectionId: '6a614a500020fd3595e8'
  };
}

export function saveAppwriteConfig(config: AppwriteConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getLocalAds(): AppwriteAd[] {
  const saved = localStorage.getItem(LOCAL_ADS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
}

export function saveLocalAds(ads: AppwriteAd[]) {
  localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(ads));
}

// Fetch Ads from Appwrite Cloud (or local fallback if credentials not provided)
export async function fetchAppwriteAds(): Promise<AppwriteAd[]> {
  const config = getStoredAppwriteConfig();
  if (!config.projectId || !config.databaseId || !config.adsCollectionId) {
    return getLocalAds().filter(a => a.position !== ('notification' as any));
  }

  try {
    const url = `${config.endpoint.replace(/\/$/, '')}/databases/${config.databaseId}/collections/${config.adsCollectionId}/documents`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': config.projectId,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('[Appwrite] Failed to fetch ads, returning local fallback:', response.statusText);
      return getLocalAds().filter(a => a.position !== ('notification' as any));
    }

    const data = await response.json();
    if (data && Array.isArray(data.documents)) {
      const fetchedAds = data.documents
        .filter((doc: any) => doc.position !== 'notification' && (doc.isActive ?? doc.is_active ?? true))
        .map((doc: any) => ({
          $id: doc.$id,
          title: doc.title || 'إعلان',
          imageUrl: doc.imageUrl || doc.image_url || '',
          linkUrl: doc.linkUrl || doc.link_url || '#',
          position: doc.position || 'top_banner',
          isActive: doc.isActive ?? doc.is_active ?? true,
          createdAt: doc.$createdAt || doc.createdAt
        }));
      // Keep local backup synced
      saveLocalAds(fetchedAds);
      return fetchedAds;
    }
  } catch (err) {
    console.warn('[Appwrite] Ads fetch network error:', err);
  }

  return getLocalAds().filter(a => a.position !== ('notification' as any));
}

// Fetch Notifications from Appwrite Cloud
export async function fetchAppwriteNotifications(): Promise<any[]> {
  const config = getStoredAppwriteConfig();
  if (!config.projectId || !config.databaseId || !config.adsCollectionId) {
    return [];
  }

  try {
    const url = `${config.endpoint.replace(/\/$/, '')}/databases/${config.databaseId}/collections/${config.adsCollectionId}/documents`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': config.projectId,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (data && Array.isArray(data.documents)) {
      const notifs = data.documents
        .filter((doc: any) => doc.position === 'notification' || doc.type === 'site' || doc.type === 'manga' || doc.type === 'anime')
        .map((doc: any) => ({
          id: doc.$id || `notif-${Date.now()}`,
          title: doc.title || 'إشعار جديد',
          content: doc.content || doc.imageUrl || doc.image_url || '',
          type: doc.type || 'site',
          time: doc.$createdAt ? new Date(doc.$createdAt).toLocaleDateString('ar-EG') : 'الآن',
          isNew: true,
          targetId: 'site',
          sourceUrl: doc.linkUrl || doc.link_url || undefined
        }));
      return notifs;
    }
  } catch (e) {
    console.warn('[Appwrite] Notifications fetch error:', e);
  }
  return [];
}

// Create Notification in Appwrite Cloud
export async function createAppwriteNotification(notif: { title: string; content: string; type: 'site' | 'manga' | 'anime'; linkUrl?: string }): Promise<void> {
  const config = getStoredAppwriteConfig();
  if (!config.projectId || !config.databaseId || !config.adsCollectionId) return;

  const url = `${config.endpoint.replace(/\/$/, '')}/databases/${config.databaseId}/collections/${config.adsCollectionId}/documents`;
  const documentId = `notif_${Date.now()}`;

  const payload = {
    title: notif.title,
    content: notif.content,
    type: notif.type,
    linkUrl: notif.linkUrl || '#',
    position: 'notification',
    isActive: true
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': config.projectId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId,
        data: payload
      })
    });
  } catch (err) {
    console.warn('[Appwrite] Create notification error:', err);
  }
}

// Create Ad in Appwrite Cloud or Local
export async function createAppwriteAd(ad: Omit<AppwriteAd, '$id'>): Promise<AppwriteAd> {
  const config = getStoredAppwriteConfig();
  if (!config.projectId || !config.databaseId || !config.adsCollectionId) {
    const local = getLocalAds();
    const newAd: AppwriteAd = { ...ad, $id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [newAd, ...local];
    saveLocalAds(updated);
    return newAd;
  }

  const url = `${config.endpoint.replace(/\/$/, '')}/databases/${config.databaseId}/collections/${config.adsCollectionId}/documents`;
  const documentId = `ad_${Date.now()}`;

  // Primary payload with standard keys
  const payloadData: Record<string, any> = {
    title: ad.title,
    imageUrl: ad.imageUrl,
    linkUrl: ad.linkUrl,
    position: ad.position,
    isActive: ad.isActive
  };
  
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Appwrite-Project': config.projectId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      documentId,
      data: payloadData
    })
  });

  // If failed due to attribute mismatch (e.g. image_url or link_url expected instead), try snake_case
  if (!response.ok && response.status === 400) {
    const altData: Record<string, any> = {
      title: ad.title,
      image_url: ad.imageUrl,
      link_url: ad.linkUrl,
      position: ad.position,
      is_active: ad.isActive
    };
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': config.projectId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId: `ad_${Date.now()}`,
        data: altData
      })
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`[Appwrite] Create ad failed (${response.status}): ${errorText}. Saving locally.`);
    const local = getLocalAds();
    const newAd: AppwriteAd = { ...ad, $id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [newAd, ...local];
    saveLocalAds(updated);
    return newAd;
  }

  const createdDoc = await response.json();
  const createdAd: AppwriteAd = {
    $id: createdDoc.$id,
    title: createdDoc.title || ad.title,
    imageUrl: createdDoc.imageUrl || createdDoc.image_url || ad.imageUrl,
    linkUrl: createdDoc.linkUrl || createdDoc.link_url || ad.linkUrl,
    position: createdDoc.position || ad.position,
    isActive: createdDoc.isActive ?? createdDoc.is_active ?? ad.isActive,
    createdAt: createdDoc.$createdAt
  };

  const local = getLocalAds();
  saveLocalAds([createdAd, ...local]);
  return createdAd;
}

// Delete Ad
export async function deleteAppwriteAd(id: string): Promise<void> {
  const config = getStoredAppwriteConfig();
  if (config.projectId && config.databaseId && config.adsCollectionId && !id.startsWith('local-')) {
    try {
      const url = `${config.endpoint.replace(/\/$/, '')}/databases/${config.databaseId}/collections/${config.adsCollectionId}/documents/${id}`;
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-Appwrite-Project': config.projectId,
          'Content-Type': 'application/json'
        }
      });
    } catch (e) {
      console.warn('[Appwrite] Delete failed:', e);
    }
  }

  const local = getLocalAds();
  const filtered = local.filter(a => a.$id !== id);
  saveLocalAds(filtered);
}
