import dynamic from 'next/dynamic';

const ArdViewPage = dynamic(() => import('@/modules/ard').then((m) => m.ArdViewPage));

export default function Page() {
	return <ArdViewPage />;
}
