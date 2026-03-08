"use client";

import { Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe your mood or what you're looking for..."
          className="h-14 pl-12 pr-4 text-base rounded-xl"
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading || !query.trim()}
        size="lg"
        className="h-14 px-6 rounded-xl"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching
          </>
        ) : (
          "Search"
        )}
      </Button>
    </form>
  );
}
