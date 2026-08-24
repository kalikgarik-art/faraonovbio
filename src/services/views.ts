// Visitor tracking & view counting service

const VISITOR_STORAGE_KEY = 'faraonov_bio_visitor_id';
const LOCAL_VIEWS_KEY = 'faraonov_bio_local_views';

function getOrCreateVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!id) {
      id = 'vis_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem(VISITOR_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'vis_' + Math.random().toString(36).substring(2, 11);
  }
}

export async function registerVisit(defaultCount: number = 55): Promise<number> {
  const visitorId = getOrCreateVisitorId();

  try {
    const response = await fetch('/api/views', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visitorId }),
    });

    if (response.ok) {
      const data = await response.json();
      if (typeof data.views === 'number') {
        try {
          localStorage.setItem(LOCAL_VIEWS_KEY, String(data.views));
        } catch {
          // ignore
        }
        return data.views;
      }
    }
  } catch (err) {
    console.warn('Could not reach view tracking API, using local fallback:', err);
  }

  // Fallback if API is offline
  try {
    const stored = localStorage.getItem(LOCAL_VIEWS_KEY);
    let current = stored ? parseInt(stored, 10) : defaultCount;
    if (isNaN(current)) current = defaultCount;

    const hasCountedLocally = sessionStorage.getItem('faraon_session_counted');
    if (!hasCountedLocally) {
      current += 1;
      sessionStorage.setItem('faraon_session_counted', 'true');
      localStorage.setItem(LOCAL_VIEWS_KEY, String(current));
    }
    return current;
  } catch {
    return defaultCount;
  }
}

export async function fetchCurrentViews(fallbackCount: number = 55): Promise<number> {
  try {
    const response = await fetch('/api/views');
    if (response.ok) {
      const data = await response.json();
      if (typeof data.views === 'number') {
        return data.views;
      }
    }
  } catch {
    // ignore
  }

  try {
    const stored = localStorage.getItem(LOCAL_VIEWS_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {
    // ignore
  }

  return fallbackCount;
}
