'use client';

import { Button } from '@/shared/components';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { interpolate } from '@/shared/utils';
import { useI18n } from '@/providers';
import { SurveyJobProgressDialog } from '../shared/SurveyJobProgressDialog';
import type { PPPUploadJobStatus } from '../../types';

interface PPPUploadProgressDialogProps {
	readonly open: boolean;
	readonly uploading: boolean;
	readonly status: PPPUploadJobStatus | null;
	readonly error?: string | null;
	readonly onOpenChange: (open: boolean) => void;
	/** Invoked by the "download errors" action; only offered when the workbook is available. */
	readonly onDownloadErrors?: () => void;
}

export function PPPUploadProgressDialog({
	open,
	uploading,
	status,
	error,
	onOpenChange,
	onDownloadErrors,
}: PPPUploadProgressDialogProps) {
	const { t } = useI18n();
	const completed = !uploading && !error && !!status?.done;
	const result = status?.result ?? null;
	const hasErrors = completed && !!result && result.failed > 0;
	const canDownloadErrors = hasErrors && !!result?.excelWithErrors && !!onDownloadErrors;

	const titleKey =
		error || hasErrors
			? 'surveys.ppp.progress.failedTitle'
			: completed
				? 'surveys.ppp.progress.completedTitle'
				: 'surveys.ppp.progress.title';

	return (
		<SurveyJobProgressDialog
			open={open}
			busy={uploading}
			percentage={status?.progressPct ?? 0}
			title={t(titleKey)}
			description={t(
				status?.progressPct === 0 && uploading
					? 'surveys.ppp.progress.preparing'
					: 'surveys.ppp.progress.processing',
			)}
			detail={interpolate(t('surveys.ppp.progress.rowsValue'), {
				processed: status?.processedRows ?? 0,
				total: status?.totalRows ?? 0,
			})}
			stats={
				completed && result
					? [
							{ labelKey: 'surveys.ppp.progress.success', value: result.success },
							{ labelKey: 'surveys.ppp.progress.failed', value: result.failed },
						]
					: undefined
			}
			note={hasErrors ? t('surveys.ppp.progress.errorsNote') : null}
			error={error}
			onOpenChange={onOpenChange}
			footerActions={
				canDownloadErrors ? (
					<Button variant="surface" onClick={onDownloadErrors}>
						<ArrowDownTrayIcon className="h-4 w-4 mr-1" />
						{t('surveys.ppp.progress.downloadErrors')}
					</Button>
				) : undefined
			}
		/>
	);
}
