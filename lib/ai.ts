import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const model = genAI?.getGenerativeModel({
	model: "gemini-2.5-flash",
	generationConfig: {
		maxOutputTokens: 8192,
		temperature: 0.7,
		// Disable thinking tokens so response.text() is pure content
		// @ts-expect-error thinkingConfig is valid for gemini-2.5-flash
		thinkingConfig: { thinkingBudget: 0 },
	},
});

function extractJson(text: string): unknown | null {
	// Strip markdown code fences
	let clean = text
		.replace(/```json\s*/gi, "")
		.replace(/```\s*/g, "")
		.trim();

	// Try parsing as-is first
	try {
		return JSON.parse(clean);
	} catch {
		// ignore
	}

	// Find the outermost JSON object or array in the text
	// (handles thinking tokens or other text prepended/appended)
	const objStart = clean.indexOf("{");
	const arrStart = clean.indexOf("[");

	if (objStart === -1 && arrStart === -1) return null;

	const useObj =
		objStart !== -1 && (arrStart === -1 || objStart < arrStart);
	const start = useObj ? objStart : arrStart;
	const openChar = useObj ? "{" : "[";
	const closeChar = useObj ? "}" : "]";

	// Find balanced closing bracket from the start
	let depth = 0;
	let end = -1;
	let inString = false;
	let escaped = false;

	for (let i = start; i < clean.length; i++) {
		const ch = clean[i];
		if (escaped) { escaped = false; continue; }
		if (ch === "\\" && inString) { escaped = true; continue; }
		if (ch === '"') { inString = !inString; continue; }
		if (inString) continue;
		if (ch === openChar) depth++;
		else if (ch === closeChar) {
			depth--;
			if (depth === 0) { end = i; break; }
		}
	}

	if (end === -1) return null;

	try {
		return JSON.parse(clean.slice(start, end + 1));
	} catch {
		return null;
	}
}

function parseMoviesJson(text: string): { title: string; reason: string }[] | null {
	const parsed = extractJson(text);
	if (!parsed) return null;

	const isValidMovie = (m: unknown): m is { title: string; reason: string } =>
		!!m &&
		typeof m === "object" &&
		typeof (m as Record<string, unknown>).title === "string" &&
		(m as Record<string, unknown>).title !== "";

	if (typeof parsed === "object" && !Array.isArray(parsed)) {
		const obj = parsed as Record<string, unknown>;
		if (Array.isArray(obj.movies)) {
			return obj.movies.filter(isValidMovie);
		}
	}

	if (Array.isArray(parsed)) {
		return (parsed as unknown[]).filter(isValidMovie) as { title: string; reason: string }[];
	}

	return null;
}

async function generateWithRetry(prompt: string, retries = 2): Promise<string> {
	let lastError: unknown;
	for (let i = 0; i <= retries; i++) {
		try {
			const result = await model!.generateContent(prompt);
			const response = await result.response;
			return response.text();
		} catch (err) {
			lastError = err;
			if (i < retries) {
				await new Promise((r) => setTimeout(r, 600 * (i + 1)));
			}
		}
	}
	throw lastError;
}

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
			? `The user has already seen these movies: ${seenMovies.join(", ")}. Do NOT recommend these again.`
			: "";

	const prompt = `You are a movie expert. Recommend 20 specific, well-known movies based on the user's mood/emotion/request.
${seenContext}

Return ONLY a JSON object with this exact structure:
{"movies": [{"title": "Exact Movie Title", "reason": "Short punchy reason under 15 words"}, ...]}

User input: "${mood}"`;

	try {
		const text = await generateWithRetry(prompt);
		const movies = parseMoviesJson(text);

		if (movies && movies.length > 0) {
			return movies;
		}

		console.warn("Could not parse Gemini response:", text.slice(0, 300));
		return [{ title: mood, reason: "Best match for your search" }];
	} catch (error) {
		console.error("Error generating queries from mood:", error);
		return [{ title: mood, reason: "Fallback search" }];
	}
}

export async function detectMovieName(input: string): Promise<string | null> {
	if (!model) return null;

	const prompt = `You are a movie title detector. Return ONLY JSON, no other text.

If the input IS a movie title (correct any typos):
{"isMovie": true, "correctedTitle": "The Corrected Movie Title"}

If it is NOT a movie title (it's a mood/feeling/description):
{"isMovie": false}

User input: "${input}"`;

	try {
		const text = await generateWithRetry(prompt);
		const parsed = extractJson(text) as Record<string, unknown> | null;

		if (parsed?.isMovie && typeof parsed.correctedTitle === "string") {
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
		console.warn("GEMINI_API_KEY is not set.");
		const primaryGenre = genre.split(",")[0].trim();
		return [
			{ title: `${primaryGenre} movies`, reason: "Same genre" },
			{ title: `Best ${primaryGenre}`, reason: "Highly rated in genre" },
			{ title: `${primaryGenre} classics`, reason: "Classic films in genre" },
		];
	}

	const prompt = `You are a movie expert. Recommend 6 specific, well-known movies similar to the given movie.

Return ONLY a JSON object with this exact structure:
{"movies": [{"title": "Exact Movie Title", "reason": "Why it's similar in under 10 words"}, ...]}

Movie: "${movieTitle}"
Genre: ${genre}
Rating: ${rating}/10
Plot: ${plot}`;

	try {
		const text = await generateWithRetry(prompt);
		const movies = parseMoviesJson(text);

		if (movies && movies.length > 0) {
			return movies;
		}

		console.warn("Could not parse Gemini similar movies response:", text.slice(0, 300));
		return [];
	} catch (error) {
		console.error("Error generating similar movies:", error);
		return [];
	}
}
