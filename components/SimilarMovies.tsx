"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search } from "lucide-react";
import type { MovieRecommendation } from "@/lib/types";

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
	if (recommendations.length === 0) {
		return null;
	}

	return (
		<div className="mt-12 pt-8 border-t border-border">
			<h2 className="text-2xl font-bold mb-6 text-foreground">
				Similar Movies
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{recommendations.map((rec, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
					>
						<Link
							href={`/?query=${encodeURIComponent(rec.title)}`}
							className="block h-full p-6 rounded-lg border border-border/50 bg-secondary/50 hover:bg-secondary transition-all hover:shadow-lg hover:border-border"
						>
							<div className="flex items-start gap-3">
								<Search className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
								<div className="flex-1">
									<h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
										{rec.title}
									</h3>
									<p className="text-sm text-muted-foreground">
										{rec.reason}
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
