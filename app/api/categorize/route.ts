import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AutoCategorizeRequest {
  movies: { imdbID: string; title: string; year: string }[];
}

export interface AutoCategorizeResponse {
  categories: { name: string; movieIds: string[] }[];
}

export async function POST(req: NextRequest) {
  const { movies }: AutoCategorizeRequest = await req.json();

  if (!movies?.length) {
    return NextResponse.json({ categories: [] });
  }

  const movieList = movies
    .map((m) => `- "${m.title}" (${m.year}) [id:${m.imdbID}]`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a movie curator. Given a watchlist, group the movies into 2–5 thematic categories based on mood, tone, or genre (e.g. "Feel-Good", "Mind-Bending", "Action-Packed", "Dark & Gritty", "Date Night").

Rules:
- Every movie must appear in at least one category.
- A movie can appear in multiple categories if it fits.
- Category names must be 1–30 characters.
- Return JSON: { "categories": [ { "name": "...", "movieIds": ["imdbID", ...] } ] }
- Use the exact imdbID values from the input.`,
      },
      {
        role: "user",
        content: `Categorize these movies:\n${movieList}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content);

  return NextResponse.json({ categories: parsed.categories ?? [] });
}
