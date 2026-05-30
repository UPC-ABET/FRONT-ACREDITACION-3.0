import dynamic from 'next/dynamic';

const DelegatesUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.DelegatesUploadPage));

export default DelegatesUploadPage;
