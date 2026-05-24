import dynamic from 'next/dynamic';

const IFCFindingsConsultPageEntry = dynamic(() =>
	import('@/modules/ifcs').then((m) => m.IFCFindingsConsultPageEntry),
);

export default IFCFindingsConsultPageEntry;
