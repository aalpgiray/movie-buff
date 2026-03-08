import { getStreamingAvailability } from "@/lib/streaming";
import { AvailabilityMatrix } from "./AvailabilityMatrix";

export async function StreamingInfo({ imdbID }: { imdbID: string }) {
  const data = await getStreamingAvailability(imdbID);

  // V4 API returns a Show object with streamingInfo and countries metadata
  const streamingInfo = data?.streamingInfo || {};

  return (
    <div className="mt-8 pt-8 border-t border-border animate-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards">
      <h3 className="font-semibold text-xl mb-6 text-foreground">Streaming Availability</h3>
      {(!data || Object.keys(streamingInfo).length === 0) ? (
        <div className="p-6 rounded-xl bg-card border border-border text-center text-muted-foreground">
          No streaming data available for this title.
        </div>
      ) : (
        <AvailabilityMatrix availability={streamingInfo} />
      )}
    </div>
  );
}
