import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ThemeProvider";

const font = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MovieBuff",
  description: "Find movies based on your mood.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(font.className, "antialiased bg-background text-foreground min-h-screen pt-14")}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
