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

// Mood-based fallback movies when AI is unavailable
const MOOD_FALLBACKS: Record<string, { title: string; reason: string }[]> = {
	happy: [
		{ title: "The Grand Budapest Hotel", reason: "Delightfully whimsical" },
		{ title: "Sing Street", reason: "Feel-good musical" },
		{ title: "Paddington 2", reason: "Pure wholesome joy" },
		{ title: "School of Rock", reason: "Uplifting and fun" },
		{ title: "About Time", reason: "Heartwarming romance" },
	],
	sad: [
		{ title: "The Shawshank Redemption", reason: "Hope through hardship" },
		{ title: "Inside Out", reason: "Explores emotions beautifully" },
		{ title: "Eternal Sunshine of the Spotless Mind", reason: "Bittersweet reflection" },
		{ title: "Manchester by the Sea", reason: "Deeply moving drama" },
		{ title: "Blue Valentine", reason: "Raw emotional journey" },
	],
	scared: [
		{ title: "Get Out", reason: "Smart social horror" },
		{ title: "A Quiet Place", reason: "Heart-pounding tension" },
		{ title: "The Conjuring", reason: "Classic supernatural scares" },
		{ title: "Hereditary", reason: "Deeply unsettling" },
		{ title: "It Follows", reason: "Creepy and original" },
	],
	excited: [
		{ title: "Mad Max: Fury Road", reason: "Non-stop action" },
		{ title: "Top Gun: Maverick", reason: "Thrilling spectacle" },
		{ title: "Mission: Impossible - Fallout", reason: "Edge-of-seat stunts" },
		{ title: "John Wick", reason: "Stylish and intense" },
		{ title: "Avengers: Endgame", reason: "Epic blockbuster" },
	],
	romantic: [
		{ title: "Before Sunrise", reason: "Pure romantic magic" },
		{ title: "Pride & Prejudice", reason: "Classic love story" },
		{ title: "La La Land", reason: "Beautiful and bittersweet" },
		{ title: "When Harry Met Sally", reason: "Timeless rom-com" },
		{ title: "The Notebook", reason: "Passionate romance" },
	],
	thoughtful: [
		{ title: "Arrival", reason: "Mind-expanding sci-fi" },
		{ title: "Inception", reason: "Layered storytelling" },
		{ title: "The Prestige", reason: "Twisty and clever" },
		{ title: "Ex Machina", reason: "Thought-provoking AI drama" },
		{ title: "Memento", reason: "Puzzle-like narrative" },
	],
	funny: [
		{ title: "Superbad", reason: "Hilarious teen comedy" },
		{ title: "The Hangover", reason: "Wild comedy ride" },
		{ title: "Bridesmaids", reason: "Laugh-out-loud funny" },
		{ title: "Hot Fuzz", reason: "Clever action-comedy" },
		{ title: "Game Night", reason: "Smart and funny" },
	],
};

function getMoodFallbacks(mood: string): { title: string; reason: string }[] {
	const lowerMood = mood.toLowerCase();
	
	// Try to match mood keywords
	for (const [key, movies] of Object.entries(MOOD_FALLBACKS)) {
		if (lowerMood.includes(key)) {
			return movies;
		}
	}
	
	// Check for common mood phrases
	if (lowerMood.includes("laugh") || lowerMood.includes("comedy") || lowerMood.includes("fun")) {
		return MOOD_FALLBACKS.funny;
	}
	if (lowerMood.includes("cry") || lowerMood.includes("emotional") || lowerMood.includes("feel")) {
		return MOOD_FALLBACKS.sad;
	}
	if (lowerMood.includes("thrill") || lowerMood.includes("action") || lowerMood.includes("adventure")) {
		return MOOD_FALLBACKS.excited;
	}
	if (lowerMood.includes("horror") || lowerMood.includes("scar") || lowerMood.includes("creep")) {
		return MOOD_FALLBACKS.scared;
	}
	if (lowerMood.includes("love") || lowerMood.includes("date") || lowerMood.includes("romantic")) {
		return MOOD_FALLBACKS.romantic;
	}
	if (lowerMood.includes("think") || lowerMood.includes("smart") || lowerMood.includes("deep")) {
		return MOOD_FALLBACKS.thoughtful;
	}
	
	// Default fallback - return popular critically acclaimed movies
	return DEFAULT_FALLBACKS;
}

export async function getSearchQueriesFromMood(
	mood: string,
	seenMovies: string[] = [],
): Promise<{ title: string; reason: string }[]> {
	if (!model) {
		console.warn("GEMINI_API_KEY is not set. Using mood-based fallbacks.");
		const fallbacks = getMoodFallbacks(mood);
		// Filter out seen movies
		const unseenFallbacks = fallbacks.filter(
			m => !seenMovies.some(seen => seen.toLowerCase() === m.title.toLowerCase())
		);
		return unseenFallbacks.length > 0 ? unseenFallbacks : fallbacks.slice(0, 3);
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

// Genre-based fallback movies when AI is unavailable
const GENRE_FALLBACKS: Record<string, { title: string; reason: string }[]> = {
	Action: [
		{ title: "Die Hard", reason: "Classic action perfection" },
		{ title: "Mad Max: Fury Road", reason: "Non-stop adrenaline" },
		{ title: "John Wick", reason: "Stylish action thriller" },
		{ title: "The Raid", reason: "Intense martial arts" },
		{ title: "Mission: Impossible - Fallout", reason: "High-octane stunts" },
		{ title: "Gladiator", reason: "Epic action drama" },
	],
	Comedy: [
		{ title: "Superbad", reason: "Hilarious coming-of-age" },
		{ title: "The Grand Budapest Hotel", reason: "Quirky and witty" },
		{ title: "Bridesmaids", reason: "Laugh-out-loud funny" },
		{ title: "Airplane!", reason: "Comedy classic" },
		{ title: "The Hangover", reason: "Wild comedy adventure" },
		{ title: "Hot Fuzz", reason: "Brilliant comedy action" },
	],
	Drama: [
		{ title: "The Shawshank Redemption", reason: "Masterful storytelling" },
		{ title: "Forrest Gump", reason: "Heartwarming classic" },
		{ title: "The Godfather", reason: "Cinematic masterpiece" },
		{ title: "Schindler's List", reason: "Powerful and moving" },
		{ title: "12 Angry Men", reason: "Gripping courtroom drama" },
		{ title: "Good Will Hunting", reason: "Emotionally rich" },
	],
	Horror: [
		{ title: "Get Out", reason: "Socially conscious horror" },
		{ title: "The Shining", reason: "Psychological terror" },
		{ title: "Hereditary", reason: "Deeply unsettling" },
		{ title: "A Quiet Place", reason: "Tense and innovative" },
		{ title: "The Conjuring", reason: "Classic supernatural scares" },
		{ title: "It Follows", reason: "Creepy and original" },
	],
	"Sci-Fi": [
		{ title: "Blade Runner 2049", reason: "Visually stunning sci-fi" },
		{ title: "Arrival", reason: "Thought-provoking" },
		{ title: "Ex Machina", reason: "Smart AI thriller" },
		{ title: "Interstellar", reason: "Epic space adventure" },
		{ title: "The Matrix", reason: "Genre-defining classic" },
		{ title: "Dune", reason: "Epic sci-fi spectacle" },
	],
	Thriller: [
		{ title: "Se7en", reason: "Dark and gripping" },
		{ title: "Gone Girl", reason: "Twisty psychological thriller" },
		{ title: "Prisoners", reason: "Intense and haunting" },
		{ title: "No Country for Old Men", reason: "Masterful tension" },
		{ title: "Zodiac", reason: "Chilling true crime" },
		{ title: "Sicario", reason: "Gritty and intense" },
	],
	Romance: [
		{ title: "Before Sunrise", reason: "Romantic and real" },
		{ title: "Eternal Sunshine of the Spotless Mind", reason: "Unique love story" },
		{ title: "The Notebook", reason: "Classic romance" },
		{ title: "La La Land", reason: "Musical romance" },
		{ title: "Pride & Prejudice", reason: "Timeless adaptation" },
		{ title: "500 Days of Summer", reason: "Fresh perspective on love" },
	],
	Animation: [
		{ title: "Spider-Man: Into the Spider-Verse", reason: "Visually groundbreaking" },
		{ title: "Spirited Away", reason: "Miyazaki masterpiece" },
		{ title: "Coco", reason: "Heartfelt and colorful" },
		{ title: "The Iron Giant", reason: "Underrated classic" },
		{ title: "WALL-E", reason: "Charming and poignant" },
		{ title: "Ratatouille", reason: "Delightfully creative" },
	],
};

const DEFAULT_FALLBACKS = [
	{ title: "Inception", reason: "Mind-bending thriller" },
	{ title: "The Dark Knight", reason: "Acclaimed superhero film" },
	{ title: "Pulp Fiction", reason: "Iconic storytelling" },
	{ title: "Fight Club", reason: "Cult classic" },
	{ title: "The Prestige", reason: "Twisty and engaging" },
	{ title: "Parasite", reason: "Genre-defying masterpiece" },
];

export async function getSimilarMovies(
	movieTitle: string,
	genre: string,
	rating: string,
	plot: string,
): Promise<{ title: string; reason: string }[]> {
	if (!model) {
		console.warn("GEMINI_API_KEY is not set. Using fallback similar movies by genre.");
		const primaryGenre = genre.split(",")[0].trim();
		// Return actual movie titles that match the genre
		const fallbacks = GENRE_FALLBACKS[primaryGenre] || DEFAULT_FALLBACKS;
		// Filter out the current movie if it's in the fallbacks
		return fallbacks.filter(m => m.title.toLowerCase() !== movieTitle.toLowerCase());
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
