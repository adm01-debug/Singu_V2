import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ACTIVE_THEME_STORAGE_KEY,
  applyThemeToDocument,
  getStoredTheme,
  type Theme,
} from "./themeBootstrap";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = ACTIVE_THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme(storageKey, defaultTheme));
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const shouldAnimate = hasMountedRef.current;

    if (shouldAnimate) {
      root.classList.add("theme-transitioning");
    }

    applyThemeToDocument(theme);

    if (!shouldAnimate) {
      hasMountedRef.current = true;
      return undefined;
    }

    const timer = window.setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 300);

    return () => window.clearTimeout(timer);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system" || typeof window.matchMedia !== "function") return undefined;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyThemeToDocument("system");
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [theme]);

  const value = useMemo<ThemeProviderState>(() => ({
    theme,
    setTheme: (nextTheme: Theme) => {
      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        // noop: persistência não deve quebrar a troca visual
      }

      setThemeState(nextTheme);
    },
  }), [storageKey, theme]);

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
