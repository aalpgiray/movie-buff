
import { Suspense } from "react";
import { MovieContent } from "@/components/MovieContent";
import { MovieDetailSkeleton } from "@/components/MovieDetailSkeleton";
import { BackLink } from "@/components/ui/back-link";
import { HeaderWrapper } from "@/components/HeaderWrapper";

export default function MoviePage(props: { params: Promise<{ id: string }> }) {
	return (
		<>
			<HeaderWrapper />
			<main className="min-h-screen bg-background text-foreground p-8 md:p-24 pt-24">
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
