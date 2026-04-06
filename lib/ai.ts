import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const model = genAI?.getGenerativeModel({
        model: "gemini-2.0-flash-latest",
        generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7,
                responseMimeType: "application/json",
        },
});

function parseMoviesJson(text: string): { title: string; reason: string }[] | null {
        const clean = text
                .replace(/```json\s*/gi, "")
                .replace(/```\s*/g, "")
                .trim();

        try {
                const parsed = JSON.parse(clean);
                if (parsed.movies && Array.isArray(parsed.movies)) {
                        return parsed.movies.filter(
                                (m: unknown) =>
                                        m &&
                                        typeof m === "object" &&
                                        "title" in (m as object) &&
                                        "reason" in (m as object) &&
                                        typeof (m as { title: unknown }).title === "string" &&
                                        (m as { title: string }).title.trim() !== "",
                        );
                }
                if (Array.isArray(parsed)) {
                        return parsed.filter(
                                (m: unknown) =>
                                        m &&
                                        typeof m === "object" &&
                                        "title" in (m as object) &&
                                        typeof (m as { title: unknown }).title === "string" &&
                                        (m as { title: string }).title.trim() !== "",
                        );
                }
        } catch {
                // Try to extract JSON array or object embedded in text
                const jsonMatch = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                if (jsonMatch) {
                        try {
                                const parsed = JSON.parse(jsonMatch[0]);
                                if (parsed.movies && Array.isArray(parsed.movies)) return parsed.movies;
                                if (Array.isArray(parsed)) return parsed;
                        } catch {
                                // ignore
                        }
                }
        }
        return null;
}

async function generateWithRetry(
        prompt: string,
        retries = 2,
): Promise<string> {
        let lastError: unknown;
        for (let i = 0; i <= retries; i++) {
                try {
                        const result = await model!.generateContent(prompt);
                        const response = await result.response;
                        return response.text();
                } catch (err) {
                        lastError = err;
                        if (i < retries) {
                                await new Promise((r) => setTimeout(r, 500 * (i + 1)));
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
                        ? `The user has already seen these movies: ${seenMovies.join(", ")}. Do NOT recommend these again. Use them as context for their taste.`
                        : "";

        const prompt = `You are a movie expert. Recommend 20 specific, well-known movies based on the user's mood/emotion/request.
${seenContext}

Return a JSON object with a single key "movies" containing an array of objects.
Each object must have:
- "title": The exact, well-known title of the movie (must be findable on IMDb).
- "reason": A short, punchy sentence (max 15 words) explaining WHY this movie fits the mood.

User input: "${mood}"`;

        try {
                const text = await generateWithRetry(prompt);
                const movies = parseMoviesJson(text);

                if (movies && movies.length > 0) {
                        return movies;
                }

                console.warn("Could not parse Gemini response for mood query:", text.slice(0, 200));
                return [{ title: mood, reason: "Best match for your search" }];
        } catch (error) {
                console.error("Error generating queries from mood:", error);
                return [{ title: mood, reason: "Fallback search" }];
        }
}

export async function detectMovieName(input: string): Promise<string | null> {
        if (!model) {
                return null;
        }

        const prompt = `You are a movie title detector. Determine if the user input is a movie title or movie-related search.

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

User input: "${input}"`;

        try {
                const text = await generateWithRetry(prompt);
                const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
                const parsed = JSON.parse(clean);

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

        const prompt = `You are a movie expert. Recommend 6 specific, well-known movies similar to the given movie.
Consider: genre, tone, rating level, and overall vibe.

Return a JSON object with a single key "movies" containing an array of objects.
Each object must have:
- "title": The exact, well-known title of the movie (must be findable on IMDb).
- "reason": A short sentence (max 10 words) explaining why it's similar.

Movie to find similar to: "${movieTitle}"
Genre: ${genre}
Rating: ${rating}/10
Plot: ${plot}`;

        try {
                const text = await generateWithRetry(prompt);
                const movies = parseMoviesJson(text);

                if (movies && movies.length > 0) {
                        return movies;
                }

                console.warn("Could not parse Gemini response for similar movies:", text.slice(0, 200));
                return [];
        } catch (error) {
                console.error("Error generating similar movies:", error);
                return [];
        }
}
