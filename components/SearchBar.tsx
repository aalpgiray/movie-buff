"use client";

import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="How are you feeling? e.g., 'I want a mind-bending sci-fi'"
          className="h-14 rounded-full border-border/50 bg-background/50 pl-12 pr-32 text-lg backdrop-blur-xl transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
        />
        <div className="absolute right-2">
          <Button 
            type="submit" 
            disabled={isLoading}
            size="lg"
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6"
          >
            {isLoading ? (
              <span className="animate-pulse">Thinking...</span>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Ask AI</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
