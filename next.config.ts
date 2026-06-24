import type { NextConfig } from 'next';

const useStandalone = process.platform !== 'win32' || process.env.NEXT_FORCE_STANDALONE === 'true';

const apiProxyUrl = process.env.API_PROXY_URL;
const enableApiProxy = process.env.NODE_ENV !== 'production' && Boolean(apiProxyUrl);

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
		if (!enableApiProxy) return [];
		return [
			{
				source: '/api/:path*',
				destination: `${apiProxyUrl}/api/:path*`,
			},
		];
	},
};

export default nextConfig;
