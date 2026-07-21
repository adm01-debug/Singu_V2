import { useState, useEffect, useCallback } from 'react';

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

function getStoredItems(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: RecentlyViewedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage blocked in private browsing
  }
}

export function useRecentlyViewed(filterType?: 'contact' | 'company') {
  const [items, setItems] = useState<RecentlyViewedItem[]>(() => getStoredItems());

  // Listen for storage changes from other tabs/components
  useEffect(() => {
    const handler = () => setItems(getStoredItems());
    window.addEventListener('recently-viewed-updated', handler);
    return () => window.removeEventListener('recently-viewed-updated', handler);
  }, []);

  const trackView = useCallback((item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    const stored = getStoredItems();
    const filtered = stored.filter(i => !(i.id === item.id && i.type === item.type));
    const updated = [{ ...item, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS);
    saveItems(updated);
    setItems(updated);
    window.dispatchEvent(new Event('recently-viewed-updated'));
  }, []);

  const filteredItems = filterType ? items.filter(i => i.type === filterType) : items;

  return { recentItems: filteredItems, trackView };
}
