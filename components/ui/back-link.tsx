"use client";

import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const BackLink = () => {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 mb-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </Button>

      <span className="text-border">|</span>

      <Button variant="ghost" size="sm" asChild>
        <Link href="/">
          <Search className="h-4 w-4" />
          Search
        </Link>
      </Button>
    </div>
  );
};
