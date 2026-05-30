import dynamic from 'next/dynamic';

const StudentSectionsUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.StudentSectionsUploadPage));

export default StudentSectionsUploadPage;
