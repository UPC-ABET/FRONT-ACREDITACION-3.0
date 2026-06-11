import dynamic from 'next/dynamic';

const PPPSurveyPage = dynamic(() => import('@/modules/surveys').then((m) => m.PPPManagementView));

export default PPPSurveyPage;
