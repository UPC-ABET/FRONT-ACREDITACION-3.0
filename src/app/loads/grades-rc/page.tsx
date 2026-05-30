import dynamic from 'next/dynamic';

const GradesRcUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.GradesRcUploadPage));

export default GradesRcUploadPage;
