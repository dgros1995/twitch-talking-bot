import { useState, useEffect } from 'react';

function isDemo() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === 'true' || sessionStorage.getItem('demo') === 'true';
}

async function apiFetch(url, opts) {
  if (isDemo()) {
    const { mockFetch } = await import('../demo/mockFetch');
    return mockFetch(url, opts);
  }
  return fetch(url, opts);
}

export function useUser() {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo()) sessionStorage.setItem('demo', 'true');
    apiFetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setLoading(false); })
      .catch(() => { setUser(null); setLoading(false); });
  }, []);

  const refresh = () => {
    apiFetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(setUser)
      .catch(() => setUser(null));
  };

  return { user, loading, refresh };
}
