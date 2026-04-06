import { Star } from "lucide-react";
import Image from "next/image";
import { MovieDetailActions } from "@/components/MovieDetailActions";
import { Badge } from "@/components/ui/badge";
import { getMovieDetails } from "@/lib/omdb";
import { getTMDbPoster } from "@/lib/tmdb";

interface MovieDetailProps {
        imdbID: string;
}

export async function MovieDetail({ imdbID }: MovieDetailProps) {
        const [movie, tmdbPoster] = await Promise.all([
                getMovieDetails(imdbID),
                getTMDbPoster(imdbID),
        ]);

        if (!movie) {
                return (
                        <div className="text-center text-muted-foreground">
                                Movie details not found.
                        </div>
                );
        }

        const posterSrc =
                tmdbPoster ?? (movie.Poster !== "N/A" ? movie.Poster : null);

        return (
                <>
                        <div className="grid md:grid-cols-[300px_1fr] gap-8 animate-in fade-in duration-500">
                                <div className="flex justify-center md:block">
                                        <div className="relative aspect-[2/3] w-[160px] md:w-full rounded-xl overflow-hidden border border-border">
                                                {posterSrc && (
                                                        <Image
                                                                src={posterSrc}
                                                                alt={movie.Title}
                                                                fill
                                                                unoptimized
                                                                className="object-cover"
                                                                priority
                                                                sizes="(max-width: 768px) 160px, 300px"
                                                        />
                                                )}
                                        </div>
                                </div>

                                <div className="space-y-8">
                                        <div>
                                                <h1 className="text-4xl md:text-5xl font-bold my-6 tracking-tight text-foreground">
                                                        {movie.Title}
                                                </h1>
                                                <div className="flex flex-wrap items-center justify-start gap-2 mb-4">
                                                        <Badge variant="secondary">{movie.Year}</Badge>
                                                        <Badge variant="secondary">{movie.Rated}</Badge>
                                                        <Badge variant="secondary">{movie.Runtime}</Badge>
                                                        <Badge variant="secondary">{movie.Genre}</Badge>
                                                </div>
                                                <MovieDetailActions
                                                        imdbID={movie.imdbID}
                                                        title={movie.Title}
                                                        year={movie.Year}
                                                        poster={posterSrc ?? movie.Poster}
                                                        type={movie.Type}
                                                        imdbRating={movie.imdbRating}
                                                />
                                        </div>

                                        <div className="flex items-center gap-3">
                                                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                                                <span className="text-2xl font-bold text-foreground">
                                                        {movie.imdbRating || "N/A"}
                                                </span>
                                                <span className="text-muted-foreground text-lg">/ 10</span>
                                        </div>

                                        <p className="text-lg leading-relaxed text-foreground max-w-2xl">
                                                {movie.Plot}
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm border-t border-border pt-6">
                                                <div>
                                                        <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-xs">
                                                                Director
                                                        </span>
                                                        <span className="font-medium text-foreground text-lg">
                                                                {movie.Director}
                                                        </span>
                                                </div>
                                                <div>
                                                        <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-xs">
                                                                Cast
                                                        </span>
                                                        <span className="font-medium text-foreground text-lg">
                                                                {movie.Actors}
                                                        </span>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </>
        );
}
