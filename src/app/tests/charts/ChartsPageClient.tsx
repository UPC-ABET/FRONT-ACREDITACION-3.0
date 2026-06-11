'use client';

import dynamic from 'next/dynamic';

const ChartsPage = dynamic(() => import('@/modules/tests').then((m) => m.ChartsPage), {
	ssr: false,
});

export default function ChartsPageClient() {
	return <ChartsPage />;
}
