import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface RecentlyViewedItem {
  id: string;
  type: 'contact' | 'company';
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  viewedAt: string;
}

const STORAGE_KEY = 'relateiq-recently-viewed';
const MAX_ITEMS = 10;

function getStoredItems(key: string): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: RecentlyViewedItem[], key: string) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // localStorage blocked in private browsing
  }
}

export function useRecentlyViewed(filterType?: 'contact' | 'company') {
  const { user } = useAuth();
  const storageKey = user?.id ? `${STORAGE_KEY}-${user.id}` : STORAGE_KEY;

  const [items, setItems] = useState<RecentlyViewedItem[]>(() => getStoredItems(storageKey));

  // Re-read when user changes and subscribe to cross-tab updates
  useEffect(() => {
    setItems(getStoredItems(storageKey));
    const handler = () => setItems(getStoredItems(storageKey));
    window.addEventListener('recently-viewed-updated', handler);
    return () => window.removeEventListener('recently-viewed-updated', handler);
  }, [storageKey]);

  const trackView = useCallback((item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    const stored = getStoredItems(storageKey);
    const filtered = stored.filter(i => !(i.id === item.id && i.type === item.type));
    const updated = [{ ...item, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS);
    saveItems(updated, storageKey);
    setItems(updated);
    window.dispatchEvent(new Event('recently-viewed-updated'));
  }, [storageKey]);

  const filteredItems = filterType ? items.filter(i => i.type === filterType) : items;

  return { recentItems: filteredItems, trackView };
}
