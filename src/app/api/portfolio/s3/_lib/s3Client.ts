import { S3Client } from '@aws-sdk/client-s3';
import { validateEnv } from '@/configs/env.config';

// No NEXT_PUBLIC_ prefix keeps these credentials out of the browser bundle.
const env = validateEnv();

export const BUCKET = env.AWS_BUCKET_NAME;

export function getS3Client(): S3Client {
	return new S3Client({
		region: env.AWS_REGION,
		credentials: {
			accessKeyId: env.AWS_ACCESS_KEY_ID,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
		},
	});
}
