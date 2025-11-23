import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function getSearchQueriesFromMood(
	mood: string,
	seenMovies: string[] = [],
) {
	if (!process.env.OPENAI_API_KEY) {
		console.warn("OPENAI_API_KEY is not set.");
		return [mood];
	}

	try {
		const seenContext =
			seenMovies.length > 0
				? `The user has already seen these movies: ${seenMovies.join(", ")}. Do NOT recommend these again. Use them as context for their taste.`
				: "";

		const response = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content: `You are a movie expert. Recommend 10 specific movies based on the user's mood/emotion/request.
          ${seenContext}
          Output a JSON object with a single key "movies" containing an array of objects.
          Each object must have:
          - "title": The exact title of the movie.
          - "reason": A short, punchy sentence explaining WHY this movie fits the mood.
          Example: {
            "movies": [
              {"title": "The Shawshank Redemption", "reason": "It's the ultimate story of hope against all odds."},
              {"title": "Inside Out", "reason": "A colorful, emotional journey that literally explores feelings."}
            ]
          }`,
				},
				{
					role: "user",
					content: mood,
				},
			],
			response_format: { type: "json_object" },
		});

		const content = response.choices[0].message.content;
		if (!content) return [{ title: mood, reason: "No content from AI" }];

		// Strip markdown code blocks if present
		const cleanContent = content.replace(/```json\n?|```/g, "").trim();

		// Parse JSON
		const parsed = JSON.parse(cleanContent);

		// Validate structure
		if (parsed.movies && Array.isArray(parsed.movies)) {
			return parsed.movies;
		}

		// Fallback for other structures
		if (Array.isArray(parsed)) {
			return parsed;
		} else if (typeof parsed === "object" && parsed !== null && parsed.title) {
			return [parsed];
		}

		console.warn("Unexpected JSON structure from OpenAI:", parsed);
		return [{ title: mood, reason: "Best match for your search" }];
	} catch (error) {
		console.error("Error generating queries:", error);
		return [{ title: mood, reason: "Fallback search" }];
	}
}
