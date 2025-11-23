"use client";

import { motion } from "framer-motion";
import { Eye, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

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
}

export function MovieCard({ movie, onToggleSeen, isSeen }: MovieCardProps) {
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
					<div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
						No Poster
					</div>
				)}

				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

				<div className="absolute top-2 right-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
					<Button
						size="icon"
						variant={isSeen ? "secondary" : "default"}
						onClick={(e) => {
							e.stopPropagation();
							onToggleSeen(movie.imdbID);
						}}
						className="rounded-full shadow-lg"
					>
						<Eye className={cn("h-4 w-4", isSeen ? "text-green-500" : "")} />
					</Button>
				</div>
			</div>

			<div className="p-4">
				<h3
					className="font-semibold leading-tight text-foreground line-clamp-1"
					title={movie.Title}
				>
					{movie.Title}
				</h3>
				<div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
					<span>{movie.Year}</span>
					<span className="capitalize">{movie.Type}</span>
				</div>
			</div>
		</motion.div>
	);
}
