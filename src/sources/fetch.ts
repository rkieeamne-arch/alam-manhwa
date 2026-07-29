export function getProxiedUrl(url: string, enhance: boolean = false): string {
  if (!url) return '';
  if (url.includes('/api/forward')) {
    if (enhance && !url.includes('enhance=')) {
      return `${url}&enhance=1`;
    }
    return url;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }
  return `/api/forward?url=${encodeURIComponent(url)}${enhance ? '&enhance=1' : ''}`;
}

export function resolveCoverUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('/api/forward')) {
    return getProxiedUrl(url);
  }
  return url;
}

export async function proxiedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('/api/forward')) {
    url = getProxiedUrl(url);
  }
  
  if (url.startsWith('/')) {
    if (typeof window === 'undefined') {
      url = `http://localhost:3000${url}`;
    }
  }
  
  const headers = new Headers(init?.headers);
  if (typeof window !== 'undefined') {
    const bypassCookie = localStorage.getItem('manhua_bypass_cookie');
    const bypassUserAgent = localStorage.getItem('manhua_bypass_user_agent');
    if (bypassCookie) {
      const safeCookie = bypassCookie.replace(/[^\x20-\x7E]/g, '').trim();
      if (safeCookie) {
        try {
          headers.set('X-Proxy-Cookie', safeCookie);
        } catch {
          // Ignore invalid header values
        }
      }
    }
    if (bypassUserAgent) {
      const safeUA = bypassUserAgent.replace(/[^\x20-\x7E]/g, '').trim();
      if (safeUA) {
        try {
          headers.set('X-Proxy-User-Agent', safeUA);
        } catch {
          // Ignore invalid header values
        }
      }
    }
  }

  const response = await fetch(url, {
    ...init,
    headers
  });
  
  if (!response.ok) {
    // If we received 403, try to read the body anyway, as some sites return useful HTML even with 403.
    // The server-side proxy handles the actual body return, so we just need to avoid throwing here
    // if the response body is HTML and the caller is expecting it.
    if (response.status !== 403) {
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
  }
  
  return response;
}
