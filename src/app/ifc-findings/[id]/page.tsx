import dynamic from 'next/dynamic';

const IFCFindingDetailPageEntry = dynamic(() =>
	import('@/modules/ifcs').then((m) => m.IFCFindingDetailPageEntry),
);

export default IFCFindingDetailPageEntry;
