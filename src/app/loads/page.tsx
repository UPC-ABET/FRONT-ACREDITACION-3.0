import dynamic from 'next/dynamic';

const LoadsPage = dynamic(() => import('@/modules/loads').then((m) => m.LoadsPage));

export default function Page() {
	return <LoadsPage />;
}
