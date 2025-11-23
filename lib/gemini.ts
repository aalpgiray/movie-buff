import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function getSearchQueriesFromMood(mood: string) {
	if (!genAI) {
		console.warn("GEMINI_API_KEY is not set.");
		// Fallback: just return the mood as a query
		return [mood];
	}

	const model = genAI.getGenerativeModel({ model: "gemini-pro" });
	const prompt = `
    User input: "${mood}"
    Task: Convert this mood/emotion/request into 3 distinct movie search queries that would help find relevant movies.
    Output: A JSON array of strings. Example: ["sad drama movies", "tearjerkers", "emotional movies"]
    Do not include markdown formatting.
  `;

	try {
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();
		// Clean up potential markdown code blocks
		const cleanText = text
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();
		return JSON.parse(cleanText);
	} catch (error) {
		console.error("Error generating queries:", error);
		return [mood];
	}
}
