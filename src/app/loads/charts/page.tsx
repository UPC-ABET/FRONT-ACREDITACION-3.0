import dynamic from 'next/dynamic';

const ChartsUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.ChartsUploadPage));

export default ChartsUploadPage;
