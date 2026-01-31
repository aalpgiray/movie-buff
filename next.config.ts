import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
	cacheComponents: true,
	turbopack: {
		root: path.resolve(__dirname),
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "m.media-amazon.com",
			},
		],
	},
};

export default nextConfig;
