import dynamic from 'next/dynamic';

const ScrapingTabsView = dynamic(() =>
	import('./ScrapingTabsView').then((m) => m.ScrapingTabsView),
);

export default function ScrapingPage() {
	return <ScrapingTabsView />;
}

export const metadata = {
	title: 'Scraping | ABET',
};
