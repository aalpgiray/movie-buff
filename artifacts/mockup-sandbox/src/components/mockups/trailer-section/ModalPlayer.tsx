import { Play, X } from "lucide-react";

export function ModalPlayer() {
  return (
    <div className="flex flex-col gap-12 p-8 bg-zinc-950 min-h-screen text-zinc-50 font-sans selection:bg-white/20">
      
      {/* 1. The Trigger State */}
      <section className="flex flex-col gap-4">
        <h2 className="text-zinc-400 text-sm font-medium tracking-widest uppercase">
          1. Trigger State (Poster Click)
        </h2>
        
        <div className="relative group overflow-hidden rounded-xl aspect-[21/9] max-w-4xl mx-auto w-full bg-zinc-900 border border-white/5 shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
          {/* Backdrop Image */}
          <img 
            src="https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vtec8OobKXpqc.jpg" 
            alt="Movie Backdrop" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-105"
          />
          
          {/* Vignette / Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent opacity-80" />

          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:scale-110">
              <Play className="w-8 h-8 ml-1 fill-current" />
            </button>
          </div>

          {/* Bottom Left Metadata */}
          <div className="absolute bottom-0 left-0 p-8 flex flex-col gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <h3 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
              The Matrix
            </h3>
            <div className="flex items-center gap-3 text-sm font-medium text-zinc-300">
              <span className="bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-sm border border-white/10">
                Official Trailer
              </span>
              <span>2:14</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-white/5 my-8" />

      {/* 2. The Modal State */}
      <section className="flex flex-col gap-4">
        <h2 className="text-zinc-400 text-sm font-medium tracking-widest uppercase">
          2. Open Modal State
        </h2>

        {/* Simulated Browser Viewport for the Modal */}
        <div className="relative rounded-xl border border-white/10 bg-black overflow-hidden aspect-video max-w-5xl mx-auto w-full shadow-2xl flex items-center justify-center">
          
          {/* Fake background behind the modal to show the overlay effect */}
          <div className="absolute inset-0 pointer-events-none">
             <img 
              src="https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vtec8OobKXpqc.jpg" 
              alt="Movie Backdrop Blur" 
              className="w-full h-full object-cover opacity-20 blur-sm scale-105"
            />
          </div>

          {/* Modal Overlay Overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Close Button */}
          <button className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors border border-white/10 backdrop-blur-md">
            <X className="w-6 h-6" />
          </button>

          {/* Video Container */}
          <div className="relative z-10 w-full max-w-4xl aspect-video rounded-lg overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10 bg-black transform transition-transform scale-95 hover:scale-100 duration-500">
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/qSqVVswa420?autoplay=0&controls=1&rel=0" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>

        </div>
      </section>

    </div>
  );
}
