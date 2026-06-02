import dynamic from 'next/dynamic';

const LCFCSurveyPage = dynamic(() => import('@/modules/surveys').then((m) => m.LCFCManagementView));

export default LCFCSurveyPage;
