import dynamic from 'next/dynamic';

const ProfessorsUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.ProfessorsUploadPage));

export default ProfessorsUploadPage;
