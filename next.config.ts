import type { NextConfig } from 'next';

const useStandalone = process.platform !== 'win32' || process.env.NEXT_FORCE_STANDALONE === 'true';

const nextConfig: NextConfig = {
	output: useStandalone ? 'standalone' : undefined,
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'aulavirtual.upc.edu.pe',
				pathname: '/bbcswebdav/institution/Branding/New_Login/**',
			},
		],
		formats: ['image/avif', 'image/webp'],
	},
	async rewrites() {
		return [
			{
				source: '/api/:path*',
				destination: 'http://localhost:7777/api/:path*',
			},
		];
	},
};

export default nextConfig;
