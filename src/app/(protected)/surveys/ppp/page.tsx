import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { translateServer } from '@/shared/lib/serverLocale';

const PPPManagementView = dynamic(() =>
	import('@/modules/surveys').then((m) => m.PPPManagementView),
);

export default function PPPPage() {
	return <PPPManagementView />;
}

export async function generateMetadata(): Promise<Metadata> {
	return { title: await translateServer('surveys.ppp.metaTitle') };
}
