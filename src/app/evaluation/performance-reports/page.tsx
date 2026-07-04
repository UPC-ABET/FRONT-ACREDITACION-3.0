import type { Metadata } from 'next';
import { PerformanceReports } from '@/modules/evaluation/pages';
import { translateServer } from '@/shared/lib/serverLocale';

export default function Page() {
	return <PerformanceReports />;
}

export async function generateMetadata(): Promise<Metadata> {
	return { title: await translateServer('performanceReports.title') };
}
