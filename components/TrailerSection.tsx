import { getMovieTrailers } from "@/lib/tmdb";
import { TrailerPlayer } from "./TrailerPlayer";

export async function TrailerSection({ imdbID }: { imdbID: string }) {
    const trailers = await getMovieTrailers(imdbID);

    // Get the first official trailer or any trailer
    const mainTrailer = trailers.find(t => t.official && t.type === "Trailer") || trailers[0];

    if (!mainTrailer) {
        return null;
    }

    return <TrailerPlayer videoKey={mainTrailer.key} />;
}
