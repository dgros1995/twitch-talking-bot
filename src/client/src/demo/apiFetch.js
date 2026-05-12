import { mockFetch } from './mockFetch';

export function isDemo() {
  return sessionStorage.getItem('demo') === 'true';
}

export function apiFetch(url, opts) {
  if (isDemo()) return mockFetch(url, opts);
  return fetch(url, opts);
}
