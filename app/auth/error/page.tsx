import Link from "next/link";
import { Film, AlertTriangle } from "lucide-react";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Film className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold text-foreground">Movie Buff</span>
          </div>

          {/* Card */}
          <div className="border border-destructive/50 rounded-lg p-6 bg-card text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Something went wrong
            </h1>
            {params?.error ? (
              <p className="text-sm text-muted-foreground mb-4">
                Error: {params.error}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                An unexpected error occurred during authentication.
              </p>
            )}
            <Link
              href="/auth/login"
              className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
