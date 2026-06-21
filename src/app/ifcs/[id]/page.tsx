import dynamic from 'next/dynamic';

const IFCViewPageEntry = dynamic(() => import('@/modules/ifcs').then((m) => m.IFCViewPageEntry));

export default IFCViewPageEntry;
