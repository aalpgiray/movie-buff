"use client";

import { Bookmark, BookmarkCheck, Eye, EyeOff, Film, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Movie } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MovieCardProps {
	movie: Movie;
	onToggleSeen: (id: string) => void;
	isSeen: boolean;
	onToggleWatchlist?: (id: string) => void;
	isInWatchlist?: boolean;
	isRecommendation?: boolean;
	priority?: boolean;
}

export function MovieCard({
	movie,
	onToggleSeen,
	isSeen,
	onToggleWatchlist,
	isInWatchlist,
	isRecommendation = false,
	priority = false,
}: MovieCardProps) {
	return (
		<Card
			className={cn(
				"group relative overflow-hidden transition-all hover:border-foreground/20",
				isSeen && "opacity-60",
				isRecommendation && "border-accent/50 ring-1 ring-accent/20",
			)}
		>
			<Link href={`/movie/${movie.imdbID}`} prefetch className="block">
				<div className="aspect-[2/3] relative bg-muted">
					{movie.Poster !== "N/A" ? (
						<Image
							src={movie.Poster}
							alt={movie.Title}
							fill
							unoptimized
							className="object-cover transition-transform duration-500 group-hover:scale-105"
							sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
							priority={priority}
							loading={priority ? "eager" : "lazy"}
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<Film className="h-10 w-10 text-muted-foreground/40" />
						</div>
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
				</div>

				<CardContent className="p-3">
					<h3 className="font-medium text-sm leading-snug line-clamp-2 text-card-foreground">
						{movie.Title}
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">{movie.Year}</p>
				</CardContent>
			</Link>

			{/* Action buttons */}
			<div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
				{onToggleWatchlist && (
					<Button
						variant={isInWatchlist ? "default" : "secondary"}
						size="icon"
						className={cn(
							"h-7 w-7 backdrop-blur-md",
							isInWatchlist
								? "bg-accent text-accent-foreground hover:bg-accent/90"
								: "bg-background/80 text-foreground hover:bg-background",
						)}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onToggleWatchlist(movie.imdbID);
						}}
						title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
					>
						{isInWatchlist ? (
							<BookmarkCheck className="h-3.5 w-3.5" />
						) : (
							<Bookmark className="h-3.5 w-3.5" />
						)}
					</Button>
				)}
				<Button
					variant={isSeen ? "default" : "secondary"}
					size="icon"
					className={cn(
						"h-7 w-7 backdrop-blur-md",
						isSeen
							? "bg-primary text-primary-foreground hover:bg-primary/90"
							: "bg-background/80 text-foreground hover:bg-background",
					)}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onToggleSeen(movie.imdbID);
					}}
					title={isSeen ? "Mark as unwatched" : "Mark as watched"}
				>
					{isSeen ? (
						<EyeOff className="h-3.5 w-3.5" />
					) : (
						<Eye className="h-3.5 w-3.5" />
					)}
				</Button>
			</div>

			{/* Status indicators */}
			<div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
				{isRecommendation && (
					<Badge variant="outline" className="bg-accent/90 text-accent-foreground border-accent flex items-center gap-1">
						<Sparkles className="h-3 w-3" />
						AI Pick
					</Badge>
				)}
				{isSeen && (
					<Badge variant="default">Seen</Badge>
				)}
			</div>
		</Card>
	);
}
