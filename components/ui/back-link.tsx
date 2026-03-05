"use client";

import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const BackLink = () => {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 mb-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <span className="text-border">|</span>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        Search
      </Link>
    </div>
  );
};
