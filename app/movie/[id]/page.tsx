import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { MovieContent } from "@/components/MovieContent";
import { MovieDetailSkeleton } from "@/components/MovieDetailSkeleton";

export default function MoviePage(props: {
	params: Promise<{ id: string }>;
}) {
	return (
		<main className="min-h-screen bg-background text-foreground p-8 md:p-24">
			<div className="max-w-5xl mx-auto">
				<Link
					href="/"
					className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 group"
				>
					<ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
					Back to Search
				</Link>

				<Suspense fallback={<MovieDetailSkeleton />}>
					<MovieContent params={props.params} />
				</Suspense>
			</div>
		</main>
	);
}
