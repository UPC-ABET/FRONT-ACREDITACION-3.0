import dynamic from 'next/dynamic';

const ArdOverviewPage = dynamic(() => import('@/modules/ard').then((m) => m.ArdOverviewPage));

export default function Page() {
	return <ArdOverviewPage />;
}
