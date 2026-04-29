import Link from "next/link";
import { Film, Mail } from "lucide-react";

export default function SignUpSuccessPage() {
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
          <div className="border border-border rounded-lg p-6 bg-card text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-accent/10 p-3">
                <Mail className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              We&apos;ve sent you a confirmation link. Please check your email to
              verify your account before signing in.
            </p>
            <Link
              href="/auth/login"
              className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
