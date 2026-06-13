import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	output: 'standalone',
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
};

export default nextConfig;
