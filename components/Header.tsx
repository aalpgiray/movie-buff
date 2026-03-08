"use client";

import { Eye, Bookmark, Film, Moon, Sun, Monitor } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/watchlist" className="gap-2">
                            <Bookmark className="h-4 w-4" />
                            <span className="hidden sm:inline">Watchlist</span>
                            {watchlistCount > 0 && (
                                <Badge variant="default" className="bg-accent text-accent-foreground">
                                    {watchlistCount}
                                </Badge>
                            )}
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/watched" className="gap-2">
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Watched</span>
                            {watchedCount > 0 && (
                                <Badge variant="secondary">
                                    {watchedCount}
                                </Badge>
                            )}
                        </Link>
                    </Button>
                    {mounted && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={cycleTheme}
                            aria-label="Toggle theme"
                        >
                            {themeIcon}
                        </Button>
                    )}
                </nav>
            </div>
        </header>
    );
}
