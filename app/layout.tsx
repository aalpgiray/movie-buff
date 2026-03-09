import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const font = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "MovieBuff",
	description: "Find movies based on your mood.",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "MovieBuff",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	// Dark default — ThemeProvider will update this dynamically via a script tag
	themeColor: [
		{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className="bg-background">
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
