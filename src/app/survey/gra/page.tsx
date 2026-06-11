import dynamic from 'next/dynamic';

const GRASurveyPage = dynamic(() => import('@/modules/surveys').then((m) => m.GRAManagementView));

export default GRASurveyPage;
