import dynamic from 'next/dynamic';

const OutcomesUploadPage = dynamic(() => import('@/modules/uploads').then((m) => m.OutcomesUploadPage));

export default OutcomesUploadPage;
