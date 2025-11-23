import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { MovieDetail } from "@/components/MovieDetail";
import { StreamingInfo } from "@/components/StreamingInfo";
import { TrailerSection } from "@/components/TrailerSection";



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

async function MovieContent({ params }: { params: Promise<{ id: string }> }) {
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

function MovieDetailSkeleton() {
	return (
		<div className="grid md:grid-cols-[300px_1fr] gap-8 animate-pulse">
			<div className="aspect-[2/3] w-full rounded-xl bg-white/5" />
			<div className="space-y-8">
				<div>
					<div className="h-12 w-3/4 bg-white/5 rounded-lg mb-4" />
					<div className="flex gap-4">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="h-8 w-16 bg-white/5 rounded-md" />
						))}
					</div>
				</div>
				<div className="h-8 w-32 bg-white/5 rounded-lg" />
				<div className="space-y-2">
					<div className="h-4 w-full bg-white/5 rounded" />
					<div className="h-4 w-full bg-white/5 rounded" />
					<div className="h-4 w-2/3 bg-white/5 rounded" />
				</div>
			</div>
		</div>
	);
}
