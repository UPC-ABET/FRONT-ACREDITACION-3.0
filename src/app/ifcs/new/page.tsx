import dynamic from 'next/dynamic';

const IFCNewPageEntry = dynamic(() => import('@/modules/ifcs').then((m) => m.IFCNewPageEntry));

export default IFCNewPageEntry;
