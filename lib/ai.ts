import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Reuse model instance for better performance
const model = genAI?.getGenerativeModel({ 
	model: "gemini-flash-latest",
	generationConfig: {
		maxOutputTokens: 2048,
		temperature: 0.7,
	},
});

export async function getSearchQueriesFromMood(
	mood: string,
	seenMovies: string[] = [],
): Promise<{ title: string; reason: string }[]> {
	if (!model) {
		console.warn("GEMINI_API_KEY is not set.");
		return [{ title: mood, reason: "Fallback search" }];
	}

	const seenContext =
		seenMovies.length > 0
			? `The user has already seen these movies: ${seenMovies.join(", ")}. Do NOT recommend these again. Use them as context for their taste.`
			: "";

	const prompt = `
You are a movie expert. Recommend 20 specific movies based on the user's mood/emotion/request.
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
}

User input: "${mood}"
`;

	try {
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();
		const cleanText = text.replace(/```json\n?|```/g, "").trim();
		const parsed = JSON.parse(cleanText);

		if (parsed.movies && Array.isArray(parsed.movies)) {
			return parsed.movies;
		}

		console.warn("Unexpected JSON structure from Gemini:", parsed);
		return [{ title: mood, reason: "Best match for your search" }];
	} catch (error) {
		console.error("Error generating queries:", error);
		return [{ title: mood, reason: "Fallback search" }];
	}
}

export async function detectMovieName(input: string): Promise<string | null> {
	if (!model) {
		return null;
	}

	const prompt = `
You are a movie title detector. Determine if the user input is a movie title or movie-related search.
  
If it IS a movie title:
- Return JSON: {"isMovie": true, "correctedTitle": "The Corrected Movie Title"}
- Correct any typos (e.g., "interstelar" -> "Interstellar", "god father" -> "The Godfather")

If it is NOT a movie title (it's a mood/feeling/description):
- Return JSON: {"isMovie": false}

Examples:
- "inception" -> {"isMovie": true, "correctedTitle": "Inception"}
- "the dark knight" -> {"isMovie": true, "correctedTitle": "The Dark Knight"}
- "feeling sad" -> {"isMovie": false}
- "want something funny" -> {"isMovie": false}

User input: "${input}"
`;

	try {
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();
		const cleanText = text.replace(/```json\n?|```/g, "").trim();
		const parsed = JSON.parse(cleanText);
		
		if (parsed.isMovie && parsed.correctedTitle) {
			return parsed.correctedTitle;
		}
		
		return null;
	} catch (error) {
		console.error("Error detecting movie name:", error);
		return null;
	}
}

export async function getSimilarMovies(
	movieTitle: string,
	genre: string,
	rating: string,
	plot: string,
): Promise<{ title: string; reason: string }[]> {
	if (!model) {
		console.warn("GEMINI_API_KEY is not set. Using fallback similar movies by genre.");
		const primaryGenre = genre.split(",")[0].trim();
		return [
			{ title: `${primaryGenre} movies`, reason: "Same genre" },
			{ title: `Best ${primaryGenre}`, reason: "Highly rated in genre" },
			{ title: `${primaryGenre} films 2020s`, reason: "Modern similar films" },
			{ title: `${primaryGenre} classics`, reason: "Classic films in genre" },
			{ title: `${primaryGenre} masterpieces`, reason: "Acclaimed similar movies" },
			{ title: `Top ${primaryGenre}`, reason: "Popular in this genre" },
		];
	}

	const prompt = `
You are a movie expert. Recommend 6 specific movies similar to the given movie.
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
}

Movie to find similar to: "${movieTitle}"
Genre: ${genre}
Rating: ${rating}/10
Plot: ${plot}
`;

	try {
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();
		const cleanText = text.replace(/```json\n?|```/g, "").trim();
		const parsed = JSON.parse(cleanText);

		if (parsed.movies && Array.isArray(parsed.movies)) {
			return parsed.movies;
		}

		console.warn("Unexpected JSON structure from Gemini:", parsed);
		return [];
	} catch (error) {
		console.error("Error generating similar movies:", error);
		return [];
	}
}
