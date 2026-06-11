import dynamic from 'next/dynamic';

const IFCsPage = dynamic(() => import('@/modules/ifcs').then((m) => m.IFCsPage));

export default IFCsPage;
