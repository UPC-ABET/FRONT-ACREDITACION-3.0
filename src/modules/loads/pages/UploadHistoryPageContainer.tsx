'use client';

import { FLOW_REGISTRY } from '../constants';
import { rollbackUpload } from '../services';
import UploadHistoryPage from './UploadHistoryPage';

// Resolves a `upload_type` code from a log row to the appropriate rollback dispatch via the
// flow registry. Keeps the presentational page unaware of upload paths.
const rollbackByUploadType: Record<string, (uploadLogId: number) => Promise<{ success: boolean }>> =
	FLOW_REGISTRY.reduce(
		(acc, flow) => {
			acc[flow.uploadType] = (uploadLogId) => rollbackUpload(flow.code, { uploadLogId });
			return acc;
		},
		{} as Record<string, (uploadLogId: number) => Promise<{ success: boolean }>>,
	);

export default function UploadHistoryPageContainer() {
	return <UploadHistoryPage rollbackByUploadType={rollbackByUploadType} />;
}
