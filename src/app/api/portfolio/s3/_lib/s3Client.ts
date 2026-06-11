import { S3Client } from '@aws-sdk/client-s3';

/**
 * Server-side only S3 client. Credentials live in env vars (VITE_AWS_*) and are
 * never shipped to the browser because this file is only imported from route
 * handlers (the `_lib` folder is ignored by the Next.js router).
 */
export const BUCKET = process.env.VITE_AWS_BUCKET_NAME ?? '';

export function getS3Client(): S3Client {
	return new S3Client({
		region: process.env.VITE_AWS_BUCKET_REGION ?? 'us-east-1',
		credentials: {
			accessKeyId: process.env.VITE_AWS_PUBLIC_KEY ?? '',
			secretAccessKey: process.env.VITE_AWS_SECRET_KEY ?? '',
		},
	});
}
