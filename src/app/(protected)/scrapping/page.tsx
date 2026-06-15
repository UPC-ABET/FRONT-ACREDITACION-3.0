import dynamic from 'next/dynamic';

const BannerManagementView = dynamic(() =>
	import('@/modules/banner').then((m) => m.BannerManagementView),
);

export default function BannerPage() {
	return <BannerManagementView />;
}

export const metadata = {
	title: 'Banner — Scraping | ABET',
};
