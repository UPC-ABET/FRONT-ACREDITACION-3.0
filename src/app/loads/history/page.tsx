import dynamic from 'next/dynamic';

const UploadHistoryPage = dynamic(() => import('@/modules/loads').then((m) => m.UploadHistoryPage));

export default function Page() {
	return <UploadHistoryPage />;
}
