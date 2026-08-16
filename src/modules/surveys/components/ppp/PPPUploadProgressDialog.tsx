'use client';

import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/components';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import type { PPPUploadJobStatus } from '../../types';

const PROGRESS_SEGMENTS = 20;

interface PPPUploadProgressDialogProps {
	readonly open: boolean;
	readonly uploading: boolean;
	readonly status: PPPUploadJobStatus | null;
	readonly error?: string | null;
	readonly onOpenChange: (open: boolean) => void;
}

function clampPercentage(value: number | undefined): number {
	if (typeof value !== 'number' || Number.isNaN(value)) return 0;
	return Math.min(100, Math.max(0, Math.round(value)));
}

export function PPPUploadProgressDialog({
	open,
	uploading,
	status,
	error,
	onOpenChange,
}: PPPUploadProgressDialogProps) {
	const { t } = useI18n();
	const percentage = clampPercentage(status?.progressPct);
	const filledSegments = Math.ceil((percentage / 100) * PROGRESS_SEGMENTS);
	const completed = !uploading && !error && !!status?.done;
	const hasErrors = completed && !!status?.result && status.result.failed > 0;

	const titleKey = error
		? 'surveys.ppp.progress.failedTitle'
		: hasErrors
			? 'surveys.ppp.progress.failedTitle'
			: completed
				? 'surveys.ppp.progress.completedTitle'
				: 'surveys.ppp.progress.title';
	const descriptionKey =
		percentage === 0 && uploading
			? 'surveys.ppp.progress.preparing'
			: 'surveys.ppp.progress.processing';

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen && uploading) return;
				onOpenChange(nextOpen);
			}}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t(titleKey)}</DialogTitle>
					<p className="text-sm text-zinc-500">{t(descriptionKey)}</p>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium text-zinc-700">
								{t('surveys.ppp.progress.progressLabel')}
							</span>
							<span className="font-semibold text-zinc-900">
								{t('surveys.ppp.progress.progressValue').replace(
									'{{percentage}}',
									String(percentage),
								)}
							</span>
						</div>
						<div
							className="flex h-2 gap-1"
							role="progressbar"
							aria-valuemin={0}
							aria-valuemax={100}
							aria-valuenow={percentage}
							aria-label={t('surveys.ppp.progress.progressLabel')}>
							{Array.from({ length: PROGRESS_SEGMENTS }, (_, index) => (
								<span
									key={index}
									className={cn(
										'h-full flex-1 rounded-full',
										index < filledSegments ? 'bg-red-600' : 'bg-zinc-100',
									)}
								/>
							))}
						</div>
						<p className="text-xs text-zinc-500">
							{t('surveys.ppp.progress.rowsLabel')}:{' '}
							{t('surveys.ppp.progress.rowsValue')
								.replace('{{processed}}', String(status?.processedRows ?? 0))
								.replace('{{total}}', String(status?.totalRows ?? 0))}
						</p>
					</div>

					{completed && status?.result && (
						<div className="grid grid-cols-2 gap-3">
							<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
								<p className="text-xs font-medium uppercase text-zinc-500">
									{t('surveys.ppp.progress.success')}
								</p>
								<p className="mt-1 text-2xl font-semibold text-zinc-900">{status.result.success}</p>
							</div>
							<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
								<p className="text-xs font-medium uppercase text-zinc-500">
									{t('surveys.ppp.progress.failed')}
								</p>
								<p className="mt-1 text-2xl font-semibold text-zinc-900">{status.result.failed}</p>
							</div>
						</div>
					)}

					{hasErrors && (
						<p className="text-sm text-red-700">{t('surveys.ppp.progress.errorsNote')}</p>
					)}

					{error && <p className="text-sm font-medium text-red-700">{error}</p>}
				</div>

				{!uploading && (
					<DialogFooter>
						<Button variant="secondary" onClick={() => onOpenChange(false)}>
							{t('dialog.close')}
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
