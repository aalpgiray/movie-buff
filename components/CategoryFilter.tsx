"use client";

import { Button } from "@/components/ui/button";
import type { WatchlistCategory } from "@/lib/types";

interface CategoryFilterProps {
  categories: WatchlistCategory[];
  selected: string | null; // null = "All", "__uncategorized__" = Uncategorized, else category id
  onSelect: (id: string | null) => void;
  totalCount: number;
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
  totalCount,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected === null ? "default" : "secondary"}
        size="sm"
        onClick={() => onSelect(null)}
      >
        All ({totalCount})
      </Button>

      <Button
        variant={selected === "__uncategorized__" ? "default" : "secondary"}
        size="sm"
        onClick={() => onSelect("__uncategorized__")}
      >
        Uncategorized
      </Button>

      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={selected === cat.id ? "default" : "secondary"}
          size="sm"
          onClick={() => onSelect(cat.id)}
        >
          {cat.name} ({cat.movieIds.length})
        </Button>
      ))}
    </div>
  );
}
