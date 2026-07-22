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
      return JSON.parse(saved);
    } catch (e) {}
  }
  return [
    {
      $id: 'default-ad-1',
      title: 'إعلان أسبوعي - خصم على الاشتراك VIP',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      linkUrl: '#',
      position: 'top_banner',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
}

export function saveLocalAds(ads: AppwriteAd[]) {
  localStorage.setItem(LOCAL_ADS_KEY, JSON.stringify(ads));
}

// Fetch Ads from Appwrite Cloud (or local fallback if credentials not provided)
export async function fetchAppwriteAds(): Promise<AppwriteAd[]> {
  const config = getStoredAppwriteConfig();
  if (!config.projectId || !config.databaseId || !config.adsCollectionId) {
    return getLocalAds();
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
      console.warn('[Appwrite] Failed to fetch documents, returning local fallback:', response.statusText);
      return getLocalAds();
    }

    const data = await response.json();
    if (data && Array.isArray(data.documents)) {
      const fetchedAds = data.documents.map((doc: any) => ({
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
    console.warn('[Appwrite] Network or API error:', err);
  }

  return getLocalAds();
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
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Appwrite-Project': config.projectId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      documentId,
      data: {
        title: ad.title,
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl,
        position: ad.position,
        isActive: ad.isActive
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`خطأ في Appwrite (${response.status}): ${errorText}`);
  }

  const createdDoc = await response.json();
  const createdAd: AppwriteAd = {
    $id: createdDoc.$id,
    title: createdDoc.title || ad.title,
    imageUrl: createdDoc.imageUrl || ad.imageUrl,
    linkUrl: createdDoc.linkUrl || ad.linkUrl,
    position: createdDoc.position || ad.position,
    isActive: createdDoc.isActive ?? ad.isActive,
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
