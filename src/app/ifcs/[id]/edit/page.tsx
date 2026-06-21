import dynamic from 'next/dynamic';

const IFCEditPageEntry = dynamic(() => import('@/modules/ifcs').then((m) => m.IFCEditPageEntry));

export default IFCEditPageEntry;
