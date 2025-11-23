import { Suspense } from "react";
import { MovieDetail } from "@/components/MovieDetail";
import { StreamingInfo } from "@/components/StreamingInfo";
import { TrailerSection } from "@/components/TrailerSection";

interface MovieContentProps {
    params: Promise<{ id: string }>;
}

export async function MovieContent({ params }: MovieContentProps) {
    const { id } = await params;

    return (
        <>
            <MovieDetail imdbID={id} />

            <Suspense
                fallback={
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <h3 className="font-semibold text-xl mb-4 text-white">
                            Searching for trailer
                        </h3>
                        <div className="relative w-full rounded-xl bg-white/5 animate-pulse" style={{ paddingBottom: "56.25%" }} />
                    </div>
                }
            >
                <TrailerSection imdbID={id} />
            </Suspense>

            <Suspense
                fallback={
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <h3 className="font-semibold text-xl mb-6 text-white">
                            Streaming Availability
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-24 rounded-xl bg-white/5 animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                }
            >
                <StreamingInfo imdbID={id} />
            </Suspense>
        </>
    );
}
