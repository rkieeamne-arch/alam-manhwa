export function getProxiedUrl(url: string): string {
  if (!url) return '';
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

export async function proxiedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (url.startsWith('http')) {
    url = getProxiedUrl(url);
  }
  
  const response = await fetch(url, init);
  
  if (!response.ok) {
    let errorMessage = `خطأ في الاتصال (${response.status})`;
    try {
      const errData = await response.json();
      if (errData && errData.error) {
        errorMessage = errData.error;
      }
    } catch {
      // Not JSON or empty body
    }
    throw new Error(errorMessage);
  }
  
  return response;
}
