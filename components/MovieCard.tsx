"use client";

import { motion } from "framer-motion";
import { Eye, Star, Bookmark } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Movie {
	Title: string;
	Year: string;
	imdbID: string;
	Type: string;
	Poster: string;
}

interface MovieCardProps {
	movie: Movie;
	onToggleSeen: (id: string) => void;
	isSeen: boolean;
	onToggleWatchlist?: (id: string) => void;
	isInWatchlist?: boolean;
}

export function MovieCard({ movie, onToggleSeen, isSeen, onToggleWatchlist, isInWatchlist }: MovieCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={{ y: -5 }}
			className={cn(
				"group relative overflow-hidden rounded-xl bg-card border border-border/50 shadow-lg transition-all hover:shadow-2xl",
				isSeen && "opacity-50 grayscale",
			)}
		>
			<Link
				href={`/movie/${movie.imdbID}`}
				className="block h-full"
				prefetch={true}
			>
				<div className="aspect-[2/3] relative overflow-hidden">
					{movie.Poster !== "N/A" ? (
						<Image
							src={movie.Poster}
							alt={movie.Title}
							fill
							className="object-cover transition-transform duration-500 group-hover:scale-105"
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						/>
					) : (
						<div className="w-full h-full bg-muted flex items-center justify-center">
							<Star className="h-12 w-12 text-muted-foreground" />
						</div>
					)}
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
				</div>

				<div className="p-4 bg-card/95 backdrop-blur-sm">
					<h3 className="font-semibold text-sm line-clamp-2 mb-1">
						{movie.Title}
					</h3>
					<p className="text-xs text-muted-foreground">{movie.Year}</p>
				</div>
			</Link>

			{/* Action buttons */}
			<div className="absolute top-2 right-2 flex gap-2 z-10">
				{onToggleWatchlist && (
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onToggleWatchlist(movie.imdbID);
						}}
						className={cn(
							"p-2 rounded-full backdrop-blur-md transition-all",
							isInWatchlist
								? "bg-amber-500 text-white shadow-lg shadow-amber-500/50"
								: "bg-black/50 text-white hover:bg-black/70"
						)}
						title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
					>
						<Bookmark
							className={cn("h-4 w-4", isInWatchlist && "fill-current")}
						/>
					</button>
				)}
				<button
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onToggleSeen(movie.imdbID);
					}}
					className={cn(
						"p-2 rounded-full backdrop-blur-md transition-all",
						isSeen
							? "bg-green-500 text-white shadow-lg shadow-green-500/50"
							: "bg-black/50 text-white hover:bg-black/70"
					)}
					title={isSeen ? "Mark as unwatched" : "Mark as watched"}
				>
					<Eye
						className={cn("h-4 w-4", isSeen && "fill-current")}
					/>
				</button>
			</div>
		</motion.div>
	);
}
