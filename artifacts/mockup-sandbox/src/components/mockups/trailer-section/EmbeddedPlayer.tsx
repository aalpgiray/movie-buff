import { Play, Clock, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EmbeddedPlayer() {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-zinc-950 text-zinc-50 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden relative">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-500 ring-1 ring-red-500/30">
              <Play className="h-5 w-5 fill-current ml-1" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Official Trailer</h2>
              <p className="text-sm text-zinc-400">Dune: Part Two (2024)</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-300 hidden sm:flex gap-1.5 py-1">
            <Youtube className="w-4 h-4 text-red-500" />
            <span>YouTube</span>
          </Badge>
        </div>

        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.15)] ring-1 ring-zinc-800 bg-zinc-900 transition-all duration-500 hover:shadow-[0_0_50px_rgba(239,68,68,0.25)] hover:ring-red-500/30">
          <iframe
            className="w-full h-full absolute top-0 left-0"
            src="https://www.youtube.com/embed/Way9Dexny3w?autoplay=0&showinfo=0&rel=0&modestbranding=1"
            title="Dune: Part Two | Official Trailer 3"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>

        <div className="flex items-center justify-between text-sm text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              2:50
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">4K Ultra HD</span>
          </div>
          <div className="flex gap-3">
            <span className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">Share</span>
            <span className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">Save</span>
          </div>
        </div>
      </div>
    </div>
  );
}
