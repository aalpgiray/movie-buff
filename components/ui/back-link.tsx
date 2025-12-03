"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export const BackLink = () => {
  const router = useRouter();

  const handleClick = () => {
    router.back();
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 group"
    >
      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
      Back
    </button>
  );
};
