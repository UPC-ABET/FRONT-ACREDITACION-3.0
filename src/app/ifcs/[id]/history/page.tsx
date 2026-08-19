import dynamic from 'next/dynamic';

const IFCStatusHistoryPageEntry = dynamic(() =>
	import('@/modules/ifcs').then((m) => m.IFCStatusHistoryPageEntry),
);

export default IFCStatusHistoryPageEntry;
