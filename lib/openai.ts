import OpenAI from "openai";
import type { MovieRecommendation } from "@/lib/types";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function getSearchQueriesFromMood(
	mood: string,
	seenMovies: string[] = [],
): Promise<MovieRecommendation[]> {
	if (!process.env.OPENAI_API_KEY) {
		console.warn("OPENAI_API_KEY is not set.");
		return [{ title: mood, reason: "Fallback search" }];
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
		} else if (typeof parsed === "object" && parsed !== null && "title" in parsed) {
			return [parsed];
		}

		console.warn("Unexpected JSON structure from OpenAI:", parsed);
		return [{ title: mood, reason: "Best match for your search" }];
	} catch (error) {
		console.error("Error generating queries:", error);
		return [{ title: mood, reason: "Fallback search" }];
	}
}

// New function to detect if input is a movie name
export async function detectMovieName(input: string): Promise<string | null> {
	if (!process.env.OPENAI_API_KEY) {
		return null;
	}

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content: `You are a movie title detector. Determine if the user input is a movie title or movie-related search.
          
          If it IS a movie title:
          - Return JSON: {"isMovie": true, "correctedTitle": "The Corrected Movie Title"}
          - Correct any typos (e.g., "interstelar" -> "Interstellar", "god father" -> "The Godfather")
          
          If it is NOT a movie title (it's a mood/feeling/description):
          - Return JSON: {"isMovie": false}
          
          Examples:
          - "inception" -> {"isMovie": true, "correctedTitle": "Inception"}
          - "the dark knight" -> {"isMovie": true, "correctedTitle": "The Dark Knight"}
          - "feeling sad" -> {"isMovie": false}
          - "want something funny" -> {"isMovie": false}`,
				},
				{
					role: "user",
					content: input,
				},
			],
			response_format: { type: "json_object" },
		});

		const content = response.choices[0]?.message?.content;
		if (!content) return null;

		const parsed = JSON.parse(content);
		
		if (parsed.isMovie && parsed.correctedTitle) {
			return parsed.correctedTitle;
		}
		
		return null;
	} catch (error) {
		console.error("Error detecting movie name:", error);
		return null;
	}
}

// Get similar movies based on a movie's details
export async function getSimilarMovies(
	movieTitle: string,
	genre: string,
	rating: string,
	plot: string,
): Promise<MovieRecommendation[]> {
	if (!process.env.OPENAI_API_KEY) {
		console.warn("OPENAI_API_KEY is not set.");
		return [];
	}

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content: `You are a movie expert. Recommend 6 specific movies similar to the given movie.
          Consider: genre, tone, rating level, and overall vibe.
          Output a JSON object with a single key "movies" containing an array of objects.
          Each object must have:
          - "title": The exact title of the movie (must be a real, well-known movie).
          - "reason": A short sentence explaining why it's similar (max 10 words).
          Example: {
            "movies": [
              {"title": "The Dark Knight", "reason": "Same gritty superhero tone."},
              {"title": "Inception", "reason": "Mind-bending sci-fi like The Matrix."}
            ]
          }`,
				},
				{
					role: "user",
					content: `Find movies similar to "${movieTitle}".
          Genre: ${genre}
          Rating: ${rating}/10
          Plot: ${plot}`,
				},
			],
			response_format: { type: "json_object" },
		});

		const content = response.choices[0].message.content;
		if (!content) return [];

		// Strip markdown code blocks if present
		const cleanContent = content.replace(/```json\n?|```/g, "").trim();

		// Parse JSON
		const parsed = JSON.parse(cleanContent);

		// Validate structure
		if (parsed.movies && Array.isArray(parsed.movies)) {
			return parsed.movies;
		}

		console.warn("Unexpected JSON structure from OpenAI:", parsed);
		return [];
	} catch (error) {
		console.error("Error generating similar movies:", error);
		return [];
	}
}
