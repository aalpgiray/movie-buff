import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const font = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mood Movie Search",
  description: "Find movies based on your emotions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const preferredTheme = saved || (prefersDark ? 'dark' : 'light');

                if (preferredTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                // Default to light mode if error
                document.documentElement.classList.remove('dark');
              }
            `,
          }}
        />
      </head>
      <body className={cn(font.className, "antialiased bg-background text-foreground min-h-screen")}>
        {children}
      </body>
    </html>
  );
}
