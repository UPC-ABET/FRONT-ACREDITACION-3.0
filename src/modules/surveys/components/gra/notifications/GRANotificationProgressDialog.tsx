'use client';

import { useI18n } from '@/providers';
import { SurveyJobProgressDialog } from '../../shared/SurveyJobProgressDialog';
import type { GRANotificationJobStatus } from '../../../types';

interface GRANotificationProgressDialogProps {
	readonly open: boolean;
	readonly sending: boolean;
	readonly status: GRANotificationJobStatus | null;
	readonly error?: string | null;
	readonly onOpenChange: (open: boolean) => void;
}

export function GRANotificationProgressDialog({
	open,
	sending,
	status,
	error,
	onOpenChange,
}: GRANotificationProgressDialogProps) {
	const { t } = useI18n();
	const percentage = status?.progressPct ?? 0;
	const completed = !sending && !error && percentage >= 100;

	const titleKey = error
		? 'surveys.gra.notifications.progress.failedTitle'
		: completed
			? 'surveys.gra.notifications.progress.completedTitle'
			: 'surveys.gra.notifications.progress.title';

	return (
		<SurveyJobProgressDialog
			open={open}
			busy={sending}
			percentage={percentage}
			title={t(titleKey)}
			description={t(
				percentage === 0 && sending
					? 'surveys.gra.notifications.progress.preparing'
					: 'surveys.gra.notifications.progress.sending',
			)}
			stats={[
				{ labelKey: 'surveys.gra.notifications.progress.sent', value: status?.emailsSent ?? 0 },
				{ labelKey: 'surveys.gra.notifications.progress.failed', value: status?.emailsFailed ?? 0 },
			]}
			error={error}
			onOpenChange={onOpenChange}>
			{!!status?.errors?.length && (
				<div className="space-y-1">
					<p className="text-xs font-medium uppercase text-zinc-500">
						{t('surveys.gra.notifications.progress.errorDetails')}
					</p>
					<div className="max-h-32 overflow-y-auto rounded-lg border border-red-100 bg-red-50 p-2 space-y-1">
						{status.errors.map((msg) => (
							<p key={msg} className="text-xs text-red-700 break-words">
								{msg}
							</p>
						))}
					</div>
				</div>
			)}
		</SurveyJobProgressDialog>
	);
}
