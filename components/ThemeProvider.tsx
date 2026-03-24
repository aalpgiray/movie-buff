"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, useCallback, useState } from "react";

type ThemeMode = "auto" | "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  cycleTheme: () => void;
  mounted: boolean;
  systemPrefersDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "auto",
  cycleTheme: () => {},
  mounted: false,
  systemPrefersDark: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

// External store for system dark mode preference
function subscribeToMediaQuery(callback: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getSystemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSystemPrefersDarkServer() {
  return true; // Default to dark on server
}

// External store for theme from localStorage
let themeListeners: Array<() => void> = [];
function subscribeToTheme(callback: () => void) {
  themeListeners.push(callback);
  return () => {
    themeListeners = themeListeners.filter((l) => l !== callback);
  };
}

function getThemeSnapshot(): ThemeMode {
  return (localStorage.getItem("theme") as ThemeMode) || "auto";
}

function getThemeServerSnapshot(): ThemeMode {
  return "auto";
}

function notifyThemeListeners() {
  themeListeners.forEach((l) => l());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  const systemPrefersDark = useSyncExternalStore(
    subscribeToMediaQuery,
    getSystemPrefersDark,
    getSystemPrefersDarkServer
  );
  
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  const applyTheme = useCallback((t: ThemeMode, prefersDark: boolean) => {
    const isDark = t === "dark" || (t === "auto" && prefersDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Keep the PWA status bar / browser chrome in sync with the active theme.
    const color = isDark ? "#0a0a0a" : "#ffffff";
    document.querySelectorAll('meta[name="theme-color"]').forEach((el) => {
      (el as HTMLMetaElement).content = color;
    });
  }, []);

  // Apply theme on mount and when dependencies change
  useEffect(() => {
    applyTheme(theme, systemPrefersDark);
    setMounted(true);
  }, [theme, systemPrefersDark, applyTheme]);

  const cycleTheme = () => {
    const themes: ThemeMode[] = ["auto", "light", "dark"];
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next, systemPrefersDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, cycleTheme, mounted, systemPrefersDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
