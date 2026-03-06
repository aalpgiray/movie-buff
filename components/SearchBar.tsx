"use client";

import { Search, Loader2 } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export function SearchBar({ onSearch, isLoading, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center border border-border rounded-xl bg-card shadow-sm focus-within:border-foreground/40 focus-within:shadow-md transition-all">
        <Search className="absolute left-4 h-5 w-5 text-muted-foreground shrink-0 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe your mood or what you're looking for..."
          className="flex-1 h-14 bg-transparent pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground outline-none"
        />
        <div className="pr-3 shrink-0">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Searching</>
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
