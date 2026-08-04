import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  /** Whether the trap is currently active */
  active: boolean;
  /** Close callback for Escape key */
  onEscape?: () => void;
  /** Whether to auto-focus first element on activation */
  autoFocus?: boolean;
  /** Whether to restore focus to previous element on deactivation */
  restoreFocus?: boolean;
}

/**
 * Focus trap hook for modals, drawers, and overlays.
 * - Traps Tab/Shift+Tab cycling within the container
 * - Closes on Escape key
 * - Auto-focuses first focusable element
 * - Restores focus on deactivation
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  active,
  onEscape,
  autoFocus = true,
  restoreFocus = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter(el => {
      // Filter out hidden elements
      return el.offsetParent !== null && !el.hasAttribute('aria-hidden');
    });
  }, []);

  useEffect(() => {
    if (!active) {
      // Restore focus when deactivated
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
      return;
    }

    // Store current focus before trapping
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Auto-focus first focusable element
    if (autoFocus) {
      requestAnimationFrame(() => {
        const elements = getFocusableElements();
        if (elements.length > 0) {
          elements[0].focus();
        } else {
          // Focus the container itself as fallback
          containerRef.current?.focus();
        }
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        e.stopPropagation();
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: wrap to last element
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: wrap to first element
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [active, onEscape, autoFocus, restoreFocus, getFocusableElements]);

  return containerRef;
}
