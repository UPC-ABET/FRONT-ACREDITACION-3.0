import type { Metadata } from 'next';
import { SemaphoreReports } from '@/modules/evaluation/pages';
import { translateServer } from '@/shared/lib/serverLocale';

export default function Page() {
	return <SemaphoreReports />;
}

export async function generateMetadata(): Promise<Metadata> {
	return { title: await translateServer('semaphoreReports.title') };
}
