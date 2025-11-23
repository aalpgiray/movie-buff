import { NextResponse } from "next/server";
import { getMovieDetails } from "@/lib/omdb";
import { getStreamingAvailability } from "@/lib/streaming";

export async function GET(
	req: Request,
	props: { params: Promise<{ id: string }> },
) {
	const params = await props.params;
	const id = params.id;

	try {
		const [details, streaming] = await Promise.all([
			getMovieDetails(id),
			getStreamingAvailability(id),
		]);

		return NextResponse.json({
			details,
			streaming,
		});
	} catch (error) {
		console.error("Movie Details API Error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
