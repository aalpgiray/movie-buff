"use client";

import { Eye, Bookmark, Film, Moon, Sun, Monitor } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface HeaderProps {
    watchlistCount: number;
    watchedCount: number;
}

type ThemeMode = 'auto' | 'light' | 'dark';

export function Header({ watchlistCount, watchedCount }: HeaderProps) {
    const [theme, setTheme] = useState<ThemeMode>('auto');
    const [mounted, setMounted] = useState(false);
    const [systemPrefersDark, setSystemPrefersDark] = useState(true);

    useEffect(() => {
        setMounted(true);

        // Detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setSystemPrefersDark(prefersDark);

        // Get saved theme
        const saved = localStorage.getItem('theme') as ThemeMode | null;
        const currentTheme = saved || 'auto';
        setTheme(currentTheme);

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemPrefersDark(e.matches);
            if (currentTheme === 'auto') {
                applyTheme('auto', e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const applyTheme = (newTheme: ThemeMode, prefersDark?: boolean) => {
        const html = document.documentElement;
        const isDark = newTheme === 'dark' || (newTheme === 'auto' && (prefersDark ?? systemPrefersDark));

        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    };

    const cycleTheme = () => {
        const themes: ThemeMode[] = ['auto', 'light', 'dark'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const newTheme = themes[nextIndex];

        setTheme(newTheme);
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
    };

    const getThemeIcon = () => {
        if (theme === 'auto') {
            return <Monitor className="h-5 w-5" />;
        } else if (theme === 'dark') {
            return <Moon className="h-5 w-5" />;
        } else {
            return <Sun className="h-5 w-5" />;
        }
    };

    const getThemeLabel = () => {
        if (theme === 'auto') {
            return `Auto (${systemPrefersDark ? 'Dark' : 'Light'})`;
        }
        return theme.charAt(0).toUpperCase() + theme.slice(1);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                                <Film className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">
                                Mood Movie Search
                            </h1>
                            <p className="text-xs text-muted-foreground">Discover by feeling</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-3">
                        <Link
                            href="/watchlist"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-sm font-medium text-secondary-foreground transition-all hover:scale-105"
                        >
                            <Bookmark className="h-4 w-4 text-amber-500" />
                            <span className="hidden sm:inline">Watchlist</span>
                            {watchlistCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-semibold">
                                    {watchlistCount}
                                </span>
                            )}
                        </Link>
                        <Link
                            href="/watched"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-sm font-medium text-secondary-foreground transition-all hover:scale-105"
                        >
                            <Eye className="h-4 w-4 text-green-500" />
                            <span className="hidden sm:inline">Watched</span>
                            {watchedCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-semibold">
                                    {watchedCount}
                                </span>
                            )}
                        </Link>
                        {mounted && (
                            <button
                                type="button"
                                onClick={cycleTheme}
                                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground transition-all hover:scale-110 active:scale-95"
                                title={`Theme: ${getThemeLabel()}. Click to cycle.`}
                                aria-label={`Theme: ${getThemeLabel()}. Click to cycle.`}
                            >
                                {getThemeIcon()}
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
