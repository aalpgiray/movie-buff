"use client";

import { ExternalLink, Play } from "lucide-react";

interface TrailerPlayerProps {
	videoKey: string;
}

export function TrailerPlayer({ videoKey }: TrailerPlayerProps) {
	const youtubeUrl = `https://www.youtube.com/watch?v=${videoKey}`;

	return (
		<div className="mt-8 pt-8 border-t border-white/10">
			<a
				href={youtubeUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all group"
			>
				<Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
				Watch trailer on YouTube
				<ExternalLink className="h-4 w-4" />
			</a>
		</div>
	);
}
