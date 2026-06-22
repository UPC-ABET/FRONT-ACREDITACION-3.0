import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { translateServer } from '@/shared/lib/serverLocale';

const LCFCManagementView = dynamic(() =>
	import('@/modules/surveys').then((m) => m.LCFCManagementView),
);

export default function LCFCPage() {
	return <LCFCManagementView />;
}

export async function generateMetadata(): Promise<Metadata> {
	return { title: await translateServer('surveys.lcfc.metaTitle') };
}
