import { useState, useEffect, useCallback } from 'react';

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => setIsOpen(false), []);
  const toggleSearch = useCallback(() => setIsOpen(prev => !prev), []);

  // Listen for keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for ⌘K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearch]);

  return {
    isOpen,
    setIsOpen,
    openSearch,
    closeSearch,
    toggleSearch,
  };
}
