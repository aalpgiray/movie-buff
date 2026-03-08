import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

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
			<body
				className={cn(
					font.className,
					"antialiased overflow-visible bg-background text-foreground min-h-screen pt-14",
				)}
			>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
