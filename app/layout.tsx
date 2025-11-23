import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const font = Outfit({ subsets: ["latin"] });

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
    <html lang="en" className="dark">
      <body className={cn(font.className, "antialiased bg-background text-foreground min-h-screen")}>
        {children}
      </body>
    </html>
  );
}
