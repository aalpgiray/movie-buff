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
    <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-3">
      <div className="flex-1 flex items-center gap-2 border border-border rounded-xl bg-card shadow-sm focus-within:border-foreground/40 focus-within:shadow-md transition-all px-4">
        <Search className="h-5 w-5 text-muted-foreground shrink-0 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe your mood or what you're looking for..."
          className="flex-1 h-14 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none min-w-0"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="h-14 sm:h-auto sm:self-stretch px-6 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 shrink-0"
      >
        {isLoading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Searching</>
        ) : (
          "Search"
        )}
      </button>
    </form>
  );
}
