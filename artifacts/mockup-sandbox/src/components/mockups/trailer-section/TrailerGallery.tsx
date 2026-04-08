import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const TRAILERS = [
  {
    id: '1',
    title: 'Official Trailer',
    type: 'Trailer',
    duration: '2:31',
    youtubeId: 'qSqVVswa420',
    gradient: 'from-red-950/40 to-black',
  },
  {
    id: '2',
    title: 'Teaser Trailer',
    type: 'Teaser',
    duration: '1:15',
    youtubeId: 'EXeTwQWrcwY', 
    gradient: 'from-zinc-900 to-black',
  },
  {
    id: '3',
    title: 'Making of the VFX',
    type: 'Featurette',
    duration: '5:42',
    youtubeId: '86YJEiL20Zg',
    gradient: 'from-neutral-900 to-black',
  },
  {
    id: '4',
    title: 'Cast Interviews',
    type: 'Behind the Scenes',
    duration: '3:20',
    youtubeId: 'uypS2a0M0aQ',
    gradient: 'from-stone-900 to-black',
  },
  {
    id: '5',
    title: 'Director\'s Cut Preview',
    type: 'Preview',
    duration: '2:05',
    youtubeId: 'zSWdZVtXT7E',
    gradient: 'from-slate-900 to-black',
  }
];

export function TrailerGallery() {
  const [activeTrailer, setActiveTrailer] = useState(TRAILERS[0]);

  return (
    <div className="w-full max-w-5xl mx-auto bg-black text-zinc-100 p-6 rounded-xl font-sans">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Videos</h2>
            <p className="text-zinc-400 text-sm mt-1">{TRAILERS.length} clips available</p>
          </div>
        </div>

        {/* Main Player */}
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-950 ring-1 ring-zinc-800 shadow-2xl">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${activeTrailer.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
            title={activeTrailer.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Thumbnail Gallery */}
        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex w-max space-x-4">
            {TRAILERS.map((trailer) => {
              const isActive = activeTrailer.id === trailer.id;
              return (
                <button
                  key={trailer.id}
                  onClick={() => setActiveTrailer(trailer)}
                  className={`relative group flex-shrink-0 w-64 text-left transition-all duration-300 outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-60 hover:opacity-100 scale-95 hover:scale-95'
                  }`}
                >
                  <div 
                    className={`relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br ${trailer.gradient} ring-1 transition-all duration-300 ${
                      isActive ? 'ring-red-600/80 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'ring-zinc-800 group-hover:ring-zinc-600'
                    }`}
                  >
                    {/* Fake thumbnail content */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                        <Play className={`w-5 h-5 ml-1 ${isActive ? 'text-red-500' : 'text-zinc-300'}`} fill={isActive ? "currentColor" : "none"} />
                      </div>
                    </div>
                    
                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-300 tracking-wider">
                      {trailer.duration}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] uppercase tracking-wider px-1.5 py-0 rounded-sm font-medium border-none ${
                          isActive ? 'bg-red-950/50 text-red-500' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {trailer.type}
                      </Badge>
                    </div>
                    <h3 className={`font-medium truncate text-sm transition-colors ${isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                      {trailer.title}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors" />
        </ScrollArea>
      </div>
    </div>
  );
}
