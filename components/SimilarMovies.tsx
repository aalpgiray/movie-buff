"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { searchMovies } from "@/lib/omdb";
import type { MovieRecommendation, Movie } from "@/lib/types";

interface SimilarMoviesProps {
	movieTitle: string;
	genre: string;
	rating: string;
	plot: string;
	recommendations: MovieRecommendation[];
}

export function SimilarMovies({
	movieTitle,
	genre,
	rating,
	plot,
	recommendations,
}: SimilarMoviesProps) {
	const [movies, setMovies] = useState<Array<Movie & { reason: string }>>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchMovies = async () => {
			try {
				setLoading(true);
				console.log("SimilarMovies: Starting to fetch", recommendations.length, "recommendations");
				const moviesList: Array<Movie & { reason: string }> = [];

				for (const rec of recommendations) {
					try {
						console.log("SimilarMovies: Searching for", rec.title);
						const response = await searchMovies(rec.title);
						if (response.Search && response.Search.length > 0) {
							const movie = response.Search[0];
							console.log("SimilarMovies: Found", movie.Title);
							moviesList.push({
								...movie,
								reason: rec.reason,
							});
						} else {
							console.log("SimilarMovies: No results for", rec.title);
						}
					} catch (error) {
						console.error(`Failed to fetch ${rec.title}:`, error);
					}
				}

				console.log("SimilarMovies: Final count", moviesList.length);
				setMovies(moviesList);
			} catch (error) {
				console.error("Error fetching similar movies:", error);
			} finally {
				setLoading(false);
			}
		};

		if (recommendations.length > 0) {
			fetchMovies();
		} else {
			console.log("SimilarMovies: No recommendations provided");
		}
	}, [recommendations]);

	if (loading) {
		return (
			<div className="mt-12 pt-8 border-t border-border">
				<h2 className="text-2xl font-bold mb-6 text-foreground">
					Similar Movies
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="aspect-[2/3] rounded-lg bg-secondary animate-pulse"
						/>
					))}
				</div>
			</div>
		);
	}

	if (movies.length === 0) {
		return null;
	}

	return (
		<div className="mt-12 pt-8 border-t border-border">
			<h2 className="text-2xl font-bold mb-6 text-foreground">
				Similar Movies
			</h2>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
				{movies.map((movie, index) => (
					<motion.div
						key={movie.imdbID}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
						className="group relative"
					>
						<Link
							href={`/movie/${movie.imdbID}`}
							className="block h-full"
							prefetch={true}
						>
							<div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary border border-border/50 shadow-lg transition-all hover:shadow-2xl hover:border-border">
								{movie.Poster !== "N/A" ? (
									<Image
										src={movie.Poster}
										alt={movie.Title}
										fill
										unoptimized
										className="object-cover transition-transform duration-500 group-hover:scale-110"
										sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 100px"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<Star className="h-8 w-8 text-muted-foreground" />
									</div>
								)}
								<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
								<div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
									<p className="text-xs text-white line-clamp-2 font-medium">
										{movie.reason}
									</p>
								</div>
							</div>
						</Link>
					</motion.div>
				))}
			</div>
		</div>
	);
}
