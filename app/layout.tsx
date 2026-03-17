import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

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
			<head>
				{/*
				  Blocking script: runs synchronously before first paint.
				  Reads the persisted theme and applies .dark immediately so the
				  safe-area / status-bar inset never flashes white on iOS PWA.
				*/}
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem('theme')||'auto';var dark=t==='dark'||(t==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark){document.documentElement.classList.add('dark');var m=document.querySelectorAll('meta[name="theme-color"]');m.forEach(function(el){el.content='#0a0a0a';});}}catch(e){}})();`,
					}}
				/>
			</head>
			<body
				className={cn(
					"antialiased overflow-visible bg-background text-foreground min-h-screen pt-14 font-mono",
				)}
			>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
