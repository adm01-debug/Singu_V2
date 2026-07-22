import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const BASE_STORAGE_KEY = 'relateiq-feature-discovery';

interface FeatureFlag {
  id: string;
  seenAt: string;
}

/**
 * Hook to manage feature discovery state
 * Tracks which features the user has seen/dismissed
 */
export function useFeatureDiscovery() {
  const { user } = useAuth();
  const storageKey = `${BASE_STORAGE_KEY}-${user?.id ?? 'anon'}`;

  const [seenFeatures, setSeenFeatures] = useState<FeatureFlag[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setSeenFeatures(stored ? JSON.parse(stored) : []);
    } catch {
      setSeenFeatures([]);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(seenFeatures));
    } catch {
      // silently fail
    }
  }, [seenFeatures, storageKey]);

  const hasSeenFeature = useCallback((featureId: string) => {
    return seenFeatures.some(f => f.id === featureId);
  }, [seenFeatures]);

  const markAsSeen = useCallback((featureId: string) => {
    setSeenFeatures(prev => {
      if (prev.some(f => f.id === featureId)) return prev;
      return [...prev, { id: featureId, seenAt: new Date().toISOString() }];
    });
  }, []);

  const resetAll = useCallback(() => {
    setSeenFeatures([]);
  }, []);

  return { hasSeenFeature, markAsSeen, resetAll };
}
