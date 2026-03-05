"use client";

import { Eye, Bookmark, Film, Moon, Sun, Monitor } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

interface HeaderProps {
    watchlistCount: number;
    watchedCount: number;
}

export function Header({ watchlistCount, watchedCount }: HeaderProps) {
    const { theme, cycleTheme, mounted } = useTheme();

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
