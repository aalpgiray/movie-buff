export function MovieDetailSkeleton() {
    return (
        <div className="grid md:grid-cols-[300px_1fr] gap-8 animate-pulse">
            <div className="aspect-[2/3] w-full rounded-xl bg-white/5" />
            <div className="space-y-8">
                <div>
                    <div className="h-12 w-3/4 bg-white/5 rounded-lg mb-4" />
                    <div className="flex gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-8 w-16 bg-white/5 rounded-md" />
                        ))}
                    </div>
                </div>
                <div className="h-8 w-32 bg-white/5 rounded-lg" />
                <div className="space-y-2">
                    <div className="h-4 w-full bg-white/5 rounded" />
                    <div className="h-4 w-full bg-white/5 rounded" />
                    <div className="h-4 w-2/3 bg-white/5 rounded" />
                </div>
            </div>
        </div>
    );
}
