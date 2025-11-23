"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { AvailabilityMatrix } from "./AvailabilityMatrix";

interface MovieDetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	movie: any; // OMDb movie object
}

export function MovieDetailModal({
	isOpen,
	onClose,
	movie,
}: MovieDetailModalProps) {
	const [details, setDetails] = useState<any>(null);
	const [streaming, setStreaming] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isOpen && movie) {
			setLoading(true);
      setDetails(null);
      setStreaming(null);
			// Fetch full details and streaming info
			// We'll create a new API route for this to keep secrets on server
			fetch(`/api/movie/${movie.imdbID}`)
				.then((res) => res.json())
				.then((data) => {
					setDetails(data.details);
					setStreaming(data.streaming);
				})
				.catch((err) => console.error(err))
				.finally(() => setLoading(false));
		}
	}, [isOpen, movie]);

	if (!movie) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl bg-card/95 backdrop-blur-xl border-border/50 max-h-[90vh] overflow-y-auto">
				<div className="grid md:grid-cols-[300px_1fr] gap-6">
					<div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-2xl">
						{movie.Poster !== "N/A" && (
							<Image
								src={movie.Poster}
								alt={movie.Title}
								fill
								className="object-cover"
							/>
						)}
					</div>

					<div className="space-y-6">
						<div>
							<DialogTitle className="text-3xl font-bold mb-2">
								{movie.Title}
							</DialogTitle>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<span>{movie.Year}</span>
								<span>{details?.Rated}</span>
								<span>{details?.Runtime}</span>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
							<span className="text-xl font-bold">
								{details?.imdbRating || "N/A"}
							</span>
							<span className="text-muted-foreground">/ 10</span>
						</div>

						<p className="text-lg leading-relaxed text-muted-foreground">
							{details?.Plot || "Loading plot..."}
						</p>

						<div className="space-y-4">
							<h3 className="font-semibold text-lg">Streaming Availability</h3>
							{loading ? (
								<div className="animate-pulse h-32 bg-muted/20 rounded-lg" />
							) : (
								<AvailabilityMatrix availability={streaming?.streamingInfo} />
							)}
						</div>

						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-muted-foreground block">Director</span>
								<span className="font-medium">{details?.Director}</span>
							</div>
							<div>
								<span className="text-muted-foreground block">Cast</span>
								<span className="font-medium">{details?.Actors}</span>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
