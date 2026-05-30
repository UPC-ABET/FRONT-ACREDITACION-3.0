import dynamic from 'next/dynamic';

const EnrolledStudentsUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.EnrolledStudentsUploadPage));

export default EnrolledStudentsUploadPage;
