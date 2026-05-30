import dynamic from 'next/dynamic';

const GradesBannerUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.GradesBannerUploadPage));

export default GradesBannerUploadPage;
