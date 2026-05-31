import dynamic from 'next/dynamic';

const UploadHistoryPageContainer = dynamic(() =>
	import('@/modules/loads').then((m) => m.UploadHistoryPageContainer),
);

export default UploadHistoryPageContainer;
