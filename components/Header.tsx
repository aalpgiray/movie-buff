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
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setSystemPrefersDark(prefersDark);
        const saved = localStorage.getItem('theme') as ThemeMode | null;
        const currentTheme = saved || 'auto';
        setTheme(currentTheme);
        const html = document.documentElement;
        const isDark = currentTheme === 'dark' || (currentTheme === 'auto' && prefersDark);
        isDark ? html.classList.add('dark') : html.classList.remove('dark');

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemPrefersDark(e.matches);
            const savedTheme = localStorage.getItem('theme') || 'auto';
            if (savedTheme === 'auto') {
                e.matches ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const cycleTheme = () => {
        const themes: ThemeMode[] = ['auto', 'light', 'dark'];
        const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
        const isDark = nextTheme === 'dark' || (nextTheme === 'auto' && systemPrefersDark);
        isDark ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
        setTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: nextTheme } }));
    };

    const themeIcon = theme === 'dark' ? <Moon className="h-4 w-4" /> : theme === 'light' ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-foreground hover:text-accent transition-colors">
                    <Film className="h-5 w-5" />
                    <span className="font-semibold tracking-tight">MovieBuff</span>
                </Link>

                <nav className="flex items-center gap-1">
                    <Link
                        href="/watchlist"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                        <Bookmark className="h-4 w-4" />
                        <span className="hidden sm:inline">Watchlist</span>
                        {watchlistCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                                {watchlistCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/watched"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Watched</span>
                        {watchedCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold border border-border">
                                {watchedCount}
                            </span>
                        )}
                    </Link>
                    {mounted && (
                        <button
                            type="button"
                            onClick={cycleTheme}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-1"
                            aria-label="Toggle theme"
                        >
                            {themeIcon}
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}
