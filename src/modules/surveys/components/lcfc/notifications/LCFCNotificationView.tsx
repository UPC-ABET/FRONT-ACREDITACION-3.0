'use client';

import React, { useState } from 'react';
import { Button, Input, Toast, Toggle } from '@/shared/components';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useI18n, useABET } from '@/providers';
import { useLCFCNotification } from '../../../hooks';

interface LCFCNotificationViewProps {
	programId?: number;
}

export function LCFCNotificationView({ programId }: LCFCNotificationViewProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const { sending, error: sendError, send } = useLCFCNotification();

	const [maxRegisterDate, setMaxRegisterDate] = useState('');
	const [resend, setResend] = useState(false);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	const isValid = !!academicPeriodId && maxRegisterDate !== '';

	React.useEffect(() => {
		if (sendError) setToast({ open: true, type: 'error', msg: sendError });
	}, [sendError]);

	function handleSend() {
		if (!isValid || !academicPeriodId) {
			setToast({
				open: true,
				type: 'error',
				msg: t('surveys.lcfc.notifications.toast.required'),
			});
			return;
		}
		send(
			{
				academicPeriodId,
				programId: programId ?? 0,
				// The date input yields "YYYY-MM-DD"; anchor the deadline to the end of that
				// day in the user's timezone (23:59:59) so the survey stays open the whole
				// selected day. Using `new Date("YYYY-MM-DD")` would be UTC midnight, which
				// makes the token "expired" for the entire day.
				maxRegisterDate: new Date(`${maxRegisterDate}T23:59:59`).toISOString(),
				// The survey lives in this same app, so the base URL is always our own
				// origin (e.g. https://accreditation.tcupc.pe). No need to ask for it.
				surveyBaseUrl: window.location.origin,
				resend,
			},
			() =>
				setToast({
					open: true,
					type: 'success',
					msg: t('surveys.lcfc.notifications.toast.sent'),
				}),
		);
	}

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="max-w-lg space-y-6">
			<div>
				<h3 className="text-base font-bold text-zinc-800">
					{t('surveys.lcfc.notifications.title')}
				</h3>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.lcfc.notifications.description')}</p>
			</div>

			<div className="space-y-4">
				<Input
					label={t('surveys.lcfc.notifications.dateLabel')}
					value={maxRegisterDate}
					onChange={(e) => setMaxRegisterDate(e.target.value)}
					type="date"
				/>

				<div>
					<Toggle
						label={t('surveys.lcfc.notifications.resendLabel')}
						checked={resend}
						onChange={setResend}
					/>
					<p className="text-xs text-zinc-500 mt-1">{t('surveys.lcfc.notifications.resendHint')}</p>
				</div>
			</div>

			<Button onClick={handleSend} disabled={!isValid || sending}>
				<PaperAirplaneIcon className="h-4 w-4 mr-2" />
				{sending ? t('surveys.lcfc.notifications.sending') : t('surveys.lcfc.notifications.send')}
			</Button>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
