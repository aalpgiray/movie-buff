import { getMovieTrailers } from "@/lib/tmdb";
import { TrailerGallery } from "./TrailerGallery";

export async function TrailerSection({ imdbID }: { imdbID: string }) {
    const trailers = await getMovieTrailers(imdbID);

    if (trailers.length === 0) {
        return null;
    }

    return <TrailerGallery trailers={trailers} />;
}
