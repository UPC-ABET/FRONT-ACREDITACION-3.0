import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { translateServer } from '@/shared/lib/serverLocale';

const GRAManagementView = dynamic(() =>
	import('@/modules/surveys').then((m) => m.GRAManagementView),
);

export default function GRAPage() {
	return <GRAManagementView />;
}

export async function generateMetadata(): Promise<Metadata> {
	return { title: await translateServer('surveys.gra.metaTitle') };
}
