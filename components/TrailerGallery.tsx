"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import type { TMDbVideo } from "@/lib/tmdb";

interface TrailerGalleryProps {
    trailers: TMDbVideo[];
}

export function TrailerGallery({ trailers }: TrailerGalleryProps) {
    const [active, setActive] = useState(trailers[0]);

    if (trailers.length === 0) return null;

    return (
        <div className="mt-8 pt-8 border-t border-white/10">
            <div className="w-full space-y-5">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Videos</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            {trailers.length} {trailers.length === 1 ? "clip" : "clips"} available
                        </p>
                    </div>
                </div>

                <div className="relative w-full rounded-xl overflow-hidden bg-zinc-950 ring-1 ring-white/10 shadow-2xl shadow-black/50"
                    style={{ aspectRatio: "16/9" }}
                >
                    <iframe
                        key={active.key}
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${active.key}?autoplay=0&rel=0&modestbranding=1`}
                        title={active.name}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {trailers.length > 1 && (
                    <div className="overflow-x-auto pb-2 -mb-2">
                        <div className="flex gap-3 w-max">
                            {trailers.map((trailer) => {
                                const isActive = active.id === trailer.id;
                                return (
                                    <button
                                        key={trailer.id}
                                        onClick={() => setActive(trailer)}
                                        className={`relative group flex-shrink-0 w-52 text-left transition-all duration-300 outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                            isActive ? "opacity-100 scale-100" : "opacity-50 hover:opacity-90 scale-95 hover:scale-[0.97]"
                                        }`}
                                    >
                                        <div
                                            className={`relative w-full overflow-hidden rounded-lg ring-1 transition-all duration-300 ${
                                                isActive
                                                    ? "ring-red-600/80 shadow-[0_0_18px_rgba(220,38,38,0.35)]"
                                                    : "ring-white/10 group-hover:ring-white/25"
                                            }`}
                                            style={{ aspectRatio: "16/9" }}
                                        >
                                            <img
                                                src={`https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`}
                                                alt={trailer.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <div
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm transition-transform duration-300 ${
                                                        isActive ? "scale-110" : "group-hover:scale-110"
                                                    }`}
                                                >
                                                    <Play
                                                        className={`w-4 h-4 ml-0.5 ${isActive ? "text-red-500" : "text-white"}`}
                                                        fill={isActive ? "currentColor" : "none"}
                                                    />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-300 tracking-wider">
                                                {trailer.type}
                                            </div>
                                        </div>
                                        <div className="mt-2 space-y-0.5 px-0.5">
                                            <span
                                                className={`block text-xs font-medium truncate transition-colors ${
                                                    isActive ? "text-red-400" : "text-muted-foreground group-hover:text-foreground"
                                                }`}
                                            >
                                                {trailer.type}
                                                {trailer.official && " · Official"}
                                            </span>
                                            <p className={`text-sm font-medium truncate transition-colors ${
                                                isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                            }`}>
                                                {trailer.name}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
