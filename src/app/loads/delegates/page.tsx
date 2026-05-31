import dynamic from 'next/dynamic';

const UploadPage = dynamic(() => import('@/modules/loads').then((m) => m.UploadPage));

export default function Page() {
	return <UploadPage flowCode="delegates" />;
}
