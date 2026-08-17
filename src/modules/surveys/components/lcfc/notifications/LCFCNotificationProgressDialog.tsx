'use client';

import { interpolate } from '@/shared/utils';
import { useI18n } from '@/providers';
import {
	SurveyJobProgressDialog,
	type SurveyJobProgressStat,
} from '../../shared/SurveyJobProgressDialog';
import type { LCFCNotificationJobStatus } from '../../../types';

interface LCFCNotificationProgressDialogProps {
	readonly open: boolean;
	readonly sending: boolean;
	readonly status: LCFCNotificationJobStatus | null;
	readonly error?: string | null;
	readonly targetLabel: string;
	readonly onOpenChange: (open: boolean) => void;
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
	const percentage = status?.progressPct ?? 0;
	const completed = !sending && !error && percentage >= 100;
	const skippedAlreadySent = status?.skippedAlreadySent ?? 0;
	const skippedAlreadyCompleted = status?.skippedAlreadyCompleted ?? 0;

	// Everything was skipped because those students were already notified: without this hint
	// the dialog reads "finished, 0 sent" and looks like a silent failure.
	const showResendHint =
		completed &&
		(status?.emailsSent ?? 0) === 0 &&
		(status?.emailsFailed ?? 0) === 0 &&
		skippedAlreadySent > 0;

	const stats: SurveyJobProgressStat[] = [
		{ labelKey: 'surveys.lcfc.notifications.progress.sent', value: status?.emailsSent ?? 0 },
		{ labelKey: 'surveys.lcfc.notifications.progress.failed', value: status?.emailsFailed ?? 0 },
	];
	if (skippedAlreadySent > 0 || skippedAlreadyCompleted > 0) {
		stats.push(
			{
				labelKey: 'surveys.lcfc.notifications.progress.skippedAlreadySent',
				value: skippedAlreadySent,
			},
			{
				labelKey: 'surveys.lcfc.notifications.progress.skippedCompleted',
				value: skippedAlreadyCompleted,
			},
		);
	}

	const titleKey = error
		? 'surveys.lcfc.notifications.progress.failedTitle'
		: completed
			? 'surveys.lcfc.notifications.progress.completedTitle'
			: 'surveys.lcfc.notifications.progress.title';

	return (
		<SurveyJobProgressDialog
			open={open}
			busy={sending}
			percentage={percentage}
			title={t(titleKey)}
			description={interpolate(
				t(
					percentage === 0 && sending
						? 'surveys.lcfc.notifications.progress.preparing'
						: 'surveys.lcfc.notifications.progress.sending',
				),
				{ target: targetLabel },
			)}
			stats={stats}
			note={showResendHint ? t('surveys.lcfc.notifications.progress.resendHint') : null}
			error={error}
			onOpenChange={onOpenChange}
		/>
	);
}
