"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("auto");
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);

  const applyTheme = (t: ThemeMode, prefersDark: boolean) => {
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
  };

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setSystemPrefersDark(prefersDark);
    const saved = localStorage.getItem("theme") as ThemeMode | null;
    const initial = saved || "auto";
    setTheme(initial);
    applyTheme(initial, prefersDark);
    setMounted(true);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
      const current = (localStorage.getItem("theme") as ThemeMode) || "auto";
      if (current === "auto") applyTheme("auto", e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

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
