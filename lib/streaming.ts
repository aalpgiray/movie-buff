import type { StreamingOption, CountryMetadata } from "./types";

const RAPID_API_KEY = process.env.STREAMING_AVAILABILITY_API_KEY;
const BASE_URL = "https://streaming-availability.p.rapidapi.com";

export interface StreamingAvailabilityResponse {
	streamingInfo: Record<string, StreamingOption[]>;
	countries?: CountryMetadata[];
}

export async function getStreamingAvailability(
	imdbId: string,
): Promise<StreamingAvailabilityResponse | null> {
	"use cache";

	if (!RAPID_API_KEY) {
		console.warn("STREAMING_AVAILABILITY_API_KEY is not set.");
		return null;
	}

	const options = {
		method: "GET",
		headers: {
			"X-RapidAPI-Key": RAPID_API_KEY,
			"X-RapidAPI-Host": "streaming-availability.p.rapidapi.com",
		},
	};

	try {
		// V4 Endpoint: /shows/{id} - Omitting country returns global availability
		const url = `${BASE_URL}/shows/${imdbId}?output_language=en`;

		const response = await fetch(url, options);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Streaming API Error:", response.status, errorText);
			return null;
		}

		const data: StreamingAvailabilityResponse = await response.json();
		return data;
	} catch (error) {
		console.error("Error fetching streaming data:", error);
		return null;
	}
}
