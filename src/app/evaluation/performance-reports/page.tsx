import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PerformanceReports } from '@/modules/evaluation/pages';
import { translateServer } from '@/shared/lib/serverLocale';

// The active tab lives in ?tab=, so the page reads useSearchParams and must be suspended.
export default function Page() {
	return (
		<Suspense>
			<PerformanceReports />
		</Suspense>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	return { title: await translateServer('performanceReports.title') };
}
