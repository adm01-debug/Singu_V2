import { createContext, useContext, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type NavigationDirection = 'forward' | 'back' | 'replace';

interface NavigationStackContextType {
  /** Navigate back smartly: uses internal stack, deduplicates loops */
  goBack: (fallback?: string) => void;
  /** The previous route in the internal stack (or null) */
  previousPath: string | null;
  /** Navigation direction: NavigationDirection */
  direction: NavigationDirection;
  /** Full internal stack for debugging */
  stack: string[];
}

const NavigationStackContext = createContext<NavigationStackContextType | null>(null);

const MAX_STACK_SIZE = 20;
const STORAGE_KEY = 'singu_nav_stack';
const DIRECTION_KEY = 'singu_nav_direction';

function loadStack(): string[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadDirection(): NavigationDirection {
  try {
    const stored = sessionStorage.getItem(DIRECTION_KEY);
    if (stored === 'back' || stored === 'replace') return stored;
    return 'forward';
  } catch {
    return 'forward';
  }
}

function saveStack(stack: string[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  } catch {
    // sessionStorage unavailable
  }
}

function saveDirection(direction: NavigationDirection) {
  try {
    sessionStorage.setItem(DIRECTION_KEY, direction);
  } catch {
    // ignora falhas de acesso ao sessionStorage (ex.: modo privado)
  }
}

export function NavigationStackProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const stackRef = useRef<string[]>(loadStack());
  const directionRef = useRef<NavigationDirection>(loadDirection());
  const isGoingBackRef = useRef(false);

  // Track route changes
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    const stack = stackRef.current;

    if (isGoingBackRef.current) {
      // We triggered this navigation via goBack — pop from stack
      isGoingBackRef.current = false;
      directionRef.current = 'back';
      saveDirection('back');
      return;
    }

    // Deduplicate: don't push if same as current top
    if (stack.length === 0 || stack[stack.length - 1] !== currentPath) {
      stack.push(currentPath);
      // Trim to max size
      if (stack.length > MAX_STACK_SIZE) {
        stack.splice(0, stack.length - MAX_STACK_SIZE);
      }
      saveStack(stack);
    }

    directionRef.current = 'forward';
    saveDirection('forward');
  }, [location.pathname, location.search]);

  const goBack = useCallback((fallback: string = '/') => {
    const stack = stackRef.current;
    const currentPath = location.pathname + location.search;

    // Pop current page from stack
    if (stack.length > 0 && stack[stack.length - 1] === currentPath) {
      stack.pop();
    }

    // Find previous page that's different from current (anti-loop)
    let target: string | null = null;
    while (stack.length > 0) {
      const candidate = stack[stack.length - 1];
      if (candidate !== currentPath) {
        target = candidate;
        stack.pop(); // Remove it since we're navigating there
        break;
      }
      stack.pop();
    }

    saveStack(stack);
    isGoingBackRef.current = true;

    if (target) {
      navigate(target);
    } else {
      navigate(fallback);
    }
  }, [location.pathname, location.search, navigate]);

  // Listen for keyboard shortcut Alt+← event
  useEffect(() => {
    const handleNavigateBack = () => goBack('/');
    window.addEventListener('navigate-back', handleNavigateBack);
    return () => window.removeEventListener('navigate-back', handleNavigateBack);
  }, [goBack]);

  const previousPath = (() => {
    const stack = stackRef.current;
    const currentPath = location.pathname + location.search;
    // Find last entry that differs from current
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i] !== currentPath) return stack[i];
    }
    return null;
  })();

  return (
    <NavigationStackContext.Provider
      value={{
        goBack,
        previousPath,
        direction: directionRef.current,
        stack: stackRef.current,
      }}
    >
      {children}
    </NavigationStackContext.Provider>
  );
}

export function useNavigationStack() {
  const ctx = useContext(NavigationStackContext);
  if (!ctx) {
    throw new Error('useNavigationStack must be used within NavigationStackProvider');
  }
  return ctx;
}
