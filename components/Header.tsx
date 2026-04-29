"use client";

import { Eye, Bookmark, Film, Moon, Sun, Monitor, LogIn, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  watchlistCount: number;
  watchedCount: number;
  user?: User | null;
  loading?: boolean;
}

export function Header({ watchlistCount, watchedCount, user, loading }: HeaderProps) {
  const { theme, cycleTheme, mounted } = useTheme();
  const router = useRouter();

  const themeIcon =
    theme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : theme === "light" ? (
      <Sun className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    );

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-accent transition-colors"
        >
          <Film className="h-5 w-5" />
          <span className="font-semibold tracking-tight">MovieBuff</span>
        </Link>

        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/watchlist" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  <span className="hidden sm:inline">Watchlist</span>
                  {watchlistCount > 0 && (
                    <Badge
                      variant="default"
                      className="bg-accent text-accent-foreground"
                    >
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
                    <Badge variant="secondary">{watchedCount}</Badge>
                  )}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            !loading && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              </Button>
            )
          )}
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
