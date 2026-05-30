import dynamic from 'next/dynamic';

const PppUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.PppUploadPage));

export default PppUploadPage;
