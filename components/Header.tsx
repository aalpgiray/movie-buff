"use client";

import { Eye, Bookmark, Film } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
    watchlistCount: number;
    watchedCount: number;
}

export function Header({ watchlistCount, watchedCount }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
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
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                Mood Movie Search
                            </h1>
                            <p className="text-xs text-muted-foreground">Discover by feeling</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-3">
                        <Link
                            href="/watchlist"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all hover:scale-105"
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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all hover:scale-105"
                        >
                            <Eye className="h-4 w-4 text-green-500" />
                            <span className="hidden sm:inline">Watched</span>
                            {watchedCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-semibold">
                                    {watchedCount}
                                </span>
                            )}
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
