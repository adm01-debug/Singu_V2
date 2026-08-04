export type Theme = "dark" | "light" | "system";

export const ACTIVE_THEME_STORAGE_KEY = "nexus-theme-mode";

function isThemeValue(value: string | null): value is Theme {
  return value === "dark" || value === "light" || value === "system";
}

export function getStoredTheme(
  storageKey = ACTIVE_THEME_STORAGE_KEY,
  fallback: Theme = "dark",
): Theme {
  if (typeof window === "undefined") return fallback;

  try {
    const savedTheme = window.localStorage.getItem(storageKey);
    return isThemeValue(savedTheme) ? savedTheme : fallback;
  } catch {
    return fallback;
  }
}

export function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme === "dark" || theme === "light") return theme;

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemeToDocument(theme: Theme): "dark" | "light" {
  if (typeof document === "undefined") {
    return theme === "light" ? "light" : "dark";
  }

  const resolvedTheme = resolveTheme(theme);
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;

  return resolvedTheme;
}

export function bootstrapTheme(
  storageKey = ACTIVE_THEME_STORAGE_KEY,
  fallback: Theme = "dark",
): Theme {
  // Clean up all legacy theme keys
  if (typeof window !== "undefined") {
    try {
      ["singu-skin", "relateiq-theme", "singu-theme-mode-v2", "singu-theme-v3"].forEach(
        (key) => window.localStorage.removeItem(key),
      );
    } catch { /* noop */ }
  }

  const theme = getStoredTheme(storageKey, fallback);
  applyThemeToDocument(theme);

  return theme;
}
