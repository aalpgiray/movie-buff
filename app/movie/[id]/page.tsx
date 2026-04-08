import { Suspense } from "react";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { MovieContent } from "@/components/MovieContent";
import { MovieDetailSkeleton } from "@/components/MovieDetailSkeleton";
import { BackLink } from "@/components/ui/back-link";

export default function MoviePage(props: { params: Promise<{ id: string }> }) {
        return (
                <>
                        <HeaderWrapper />
                        <main className="min-h-screen overflow-x-clip bg-background text-foreground p-4 md:p-24 pt-24">
                                <div className="max-w-5xl mx-auto">
                                        <BackLink />

                                        <Suspense fallback={<MovieDetailSkeleton />}>
                                                <MovieContent params={props.params} />
                                        </Suspense>
                                </div>
                        </main>
                </>
        );
}
