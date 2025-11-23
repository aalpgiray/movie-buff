const RAPID_API_KEY = process.env.STREAMING_AVAILABILITY_API_KEY;
const BASE_URL = "https://streaming-availability.p.rapidapi.com";

export async function getStreamingAvailability(imdbId: string) {
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
		// V4 Endpoint: /shows/{id}
		const url = `${BASE_URL}/shows/${imdbId}?country=us&output_language=en`;
		console.log("Streaming API Request:", url);

		const response = await fetch(url, options);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Streaming API Error:", response.status, errorText);
			return null;
		}

		const data = await response.json();
		console.log(
			"Streaming API Response:",
			JSON.stringify(data).substring(0, 200) + "...",
		);
		return data;
	} catch (error) {
		console.error("Error fetching streaming data:", error);
		return null;
	}
}
