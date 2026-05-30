import dynamic from 'next/dynamic';

const StudyPlansUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.StudyPlansUploadPage));

export default StudyPlansUploadPage;
