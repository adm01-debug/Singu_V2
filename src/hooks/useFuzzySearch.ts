import { useMemo, useCallback, useState, useEffect, ReactNode } from 'react';
import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';

interface UseFuzzySearchOptions<T> extends Omit<IFuseOptions<T>, 'keys'> {
  /** Fields to search in */
  keys: (keyof T | string)[];
  /** Minimum characters to start searching */
  minChars?: number;
  /** Maximum results to return */
  limit?: number;
  /** Debounce delay in ms */
  debounceMs?: number;
}

interface UseFuzzySearchReturn<T> {
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Filtered results */
  results: T[];
  /** Full Fuse results with scores */
  rawResults: FuseResult<T>[];
  /** Whether search is active */
  isSearching: boolean;
  /** Clear search */
  clearSearch: () => void;
  /** Highlighted text helper - returns array of React nodes */
  highlight: (text: string, indices: readonly [number, number][]) => ReactNode;
}

/**
 * Fuzzy search hook using Fuse.js
 * Supports typo-tolerant, accent-insensitive search
 */
export function useFuzzySearch<T>(
  items: T[],
  options: UseFuzzySearchOptions<T>
): UseFuzzySearchReturn<T> {
  const {
    keys,
    minChars = 1,
    limit = 50,
    debounceMs = 150,
    threshold = 0.3,
    ignoreLocation = true,
    ...fuseOptions
  } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Create Fuse instance with memoization
  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: keys as string[],
      threshold,
      ignoreLocation,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: minChars,
      ...fuseOptions,
    });
  }, [items, keys, threshold, ignoreLocation, minChars, fuseOptions]);

  // Perform search
  const { results, rawResults, isSearching } = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < minChars) {
      return {
        results: items,
        rawResults: [],
        isSearching: false,
      };
    }

    const searchResults = fuse.search(debouncedQuery, { limit });

    return {
      results: searchResults.map(r => r.item),
      rawResults: searchResults,
      isSearching: true,
    };
  }, [fuse, debouncedQuery, items, minChars, limit]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  // Helper to highlight matched text - returns string with markers
  const highlight = useCallback((text: string, indices: readonly [number, number][]): string => {
    if (!indices || indices.length === 0) {
      return text;
    }

    let result = '';
    let lastIndex = 0;

    indices.forEach(([start, end]) => {
      // Add non-highlighted text before match
      if (start > lastIndex) {
        result += text.slice(lastIndex, start);
      }
      // Add highlighted match with markers
      result += `«${text.slice(start, end + 1)}»`;
      lastIndex = end + 1;
    });

    // Add remaining text after last match
    if (lastIndex < text.length) {
      result += text.slice(lastIndex);
    }

    return result;
  }, []);

  return {
    query,
    setQuery,
    results,
    rawResults,
    isSearching,
    clearSearch,
    highlight,
  };
}

/**
 * Simple search with normalization (accents, case)
 * For simpler use cases without Fuse.js overhead
 */
export function useSimpleSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  options: { minChars?: number; debounceMs?: number } = {}
) {
  const { minChars = 1, debounceMs = 100 } = options;
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const normalizeString = useCallback((str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < minChars) {
      return items;
    }

    const normalizedQuery = normalizeString(debouncedQuery);

    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        if (typeof value !== 'string') return false;
        return normalizeString(value).includes(normalizedQuery);
      })
    );
  }, [items, debouncedQuery, searchFields, minChars, normalizeString]);

  return {
    query,
    setQuery,
    results,
    isSearching: debouncedQuery.length >= minChars,
    clearSearch: () => setQuery(''),
  };
}

export default useFuzzySearch;
