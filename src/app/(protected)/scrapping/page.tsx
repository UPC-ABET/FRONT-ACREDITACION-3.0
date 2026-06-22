import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { translateServer } from '@/shared/lib/serverLocale';

const ScrapingTabsView = dynamic(() =>
	import('./ScrapingTabsView').then((m) => m.ScrapingTabsView),
);

export default function ScrapingPage() {
	return <ScrapingTabsView />;
}

export async function generateMetadata(): Promise<Metadata> {
	return { title: await translateServer('scraping.metaTitle') };
}
