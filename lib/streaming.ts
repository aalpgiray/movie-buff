import type { StreamingOption } from "./types";

const RAPID_API_KEY = process.env.STREAMING_AVAILABILITY_API_KEY;
const BASE_URL = "https://streaming-availability.p.rapidapi.com";

// V4 API response shape
interface V4StreamingOption {
	service: { id: string; name: string; imageSet?: Record<string, string> };
	type: string;
	link: string;
	videoLink?: string;
	quality?: string;
	price?: { amount: string; currency: string; formatted: string };
}

interface V4ShowResponse {
	streamingOptions: Record<string, V4StreamingOption[]>;
}

export interface StreamingAvailabilityResponse {
	// keyed by country code (e.g. "us", "gb"), value is array of streaming options
	streamingInfo: Record<string, StreamingOption[]>;
}

export async function getStreamingAvailability(
	imdbId: string,
): Promise<StreamingAvailabilityResponse | null> {
	"use cache";

	if (!RAPID_API_KEY) {
		console.warn("STREAMING_AVAILABILITY_API_KEY is not set.");
		return null;
	}

	const reqOptions = {
		method: "GET",
		headers: {
			"X-RapidAPI-Key": RAPID_API_KEY,
			"X-RapidAPI-Host": "streaming-availability.p.rapidapi.com",
		},
	};

	try {
		// V4 Endpoint: /shows/{id} with IMDb id — returns global streaming availability
		const url = `${BASE_URL}/shows/${imdbId}?output_language=en&series_granularity=show`;

		const response = await fetch(url, reqOptions);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Streaming API Error:", response.status, errorText);
			return null;
		}

		const data: V4ShowResponse = await response.json();

		// V4 returns `streamingOptions` keyed by country code.
		// Normalise it into our internal `streamingInfo` shape.
		const streamingInfo: Record<string, StreamingOption[]> = {};

		for (const [countryCode, options] of Object.entries(data.streamingOptions ?? {})) {
			streamingInfo[countryCode] = options.map((opt) => ({
				service: { id: opt.service.id, name: opt.service.name },
				link: opt.link,
				type: opt.type,
			}));
		}

		return { streamingInfo };
	} catch (error) {
		console.error("Error fetching streaming data:", error);
		return null;
	}
}
