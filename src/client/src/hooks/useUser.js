import { useState, useEffect } from 'react';

export function useUser() {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setLoading(false); })
      .catch(() => { setUser(null); setLoading(false); });
  }, []);

  const refresh = () => {
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(setUser)
      .catch(() => setUser(null));
  };

  return { user, loading, refresh };
}
