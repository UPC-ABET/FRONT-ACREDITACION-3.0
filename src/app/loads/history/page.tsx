import dynamic from 'next/dynamic';

const UploadHistoryPageContainer = dynamic(() =>
	import('@/modules/upload-history').then((m) => m.UploadHistoryPageContainer),
);

export default UploadHistoryPageContainer;
