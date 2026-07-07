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
import type { LCFCNotificationJobStatus } from '../../../types';

const PROGRESS_SEGMENTS = 20;

interface LCFCNotificationProgressDialogProps {
	readonly open: boolean;
	readonly sending: boolean;
	readonly status: LCFCNotificationJobStatus | null;
	readonly error?: string | null;
	readonly targetLabel: string;
	readonly onOpenChange: (open: boolean) => void;
}

function clampPercentage(value: number | undefined): number {
	if (typeof value !== 'number' || Number.isNaN(value)) return 0;
	return Math.min(100, Math.max(0, Math.round(value)));
}

export function LCFCNotificationProgressDialog({
	open,
	sending,
	status,
	error,
	targetLabel,
	onOpenChange,
}: LCFCNotificationProgressDialogProps) {
	const { t } = useI18n();
	const percentage = clampPercentage(status?.progressPct);
	const filledSegments = Math.ceil((percentage / 100) * PROGRESS_SEGMENTS);
	const completed = !sending && !error && percentage >= 100;
	const titleKey = error
		? 'surveys.lcfc.notifications.progress.failedTitle'
		: completed
			? 'surveys.lcfc.notifications.progress.completedTitle'
			: 'surveys.lcfc.notifications.progress.title';
	const descriptionKey =
		percentage === 0 && sending
			? 'surveys.lcfc.notifications.progress.preparing'
			: 'surveys.lcfc.notifications.progress.sending';

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen && sending) return;
				onOpenChange(nextOpen);
			}}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t(titleKey)}</DialogTitle>
					<p className="text-sm text-zinc-500">
						{t(descriptionKey).replace('{{target}}', targetLabel)}
					</p>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="font-medium text-zinc-700">
								{t('surveys.lcfc.notifications.progress.progressLabel')}
							</span>
							<span className="font-semibold text-zinc-900">
								{t('surveys.lcfc.notifications.progress.progressValue').replace(
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
							aria-label={t('surveys.lcfc.notifications.progress.progressLabel')}>
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
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
							<p className="text-xs font-medium uppercase text-zinc-500">
								{t('surveys.lcfc.notifications.progress.sent')}
							</p>
							<p className="mt-1 text-2xl font-semibold text-zinc-900">{status?.emailsSent ?? 0}</p>
						</div>
						<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
							<p className="text-xs font-medium uppercase text-zinc-500">
								{t('surveys.lcfc.notifications.progress.failed')}
							</p>
							<p className="mt-1 text-2xl font-semibold text-zinc-900">
								{status?.emailsFailed ?? 0}
							</p>
						</div>
					</div>

					{error && <p className="text-sm font-medium text-red-700">{error}</p>}
				</div>

				{!sending && (
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
