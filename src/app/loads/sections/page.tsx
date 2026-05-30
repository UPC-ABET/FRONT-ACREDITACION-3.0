import dynamic from 'next/dynamic';

const SectionsUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.SectionsUploadPage));

export default SectionsUploadPage;
