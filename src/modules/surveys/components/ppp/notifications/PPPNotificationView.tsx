'use client';

import React, { useState } from 'react';
import { Button, Input, Toast } from '@/shared/components';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useI18n, useABET } from '@/providers';
import { usePPPNotification } from '../../../hooks';
import { SurveyTemplateSelect } from '../../shared/SurveyTemplateSelect';

interface PPPNotificationViewProps {
	programId: number;
}

export function PPPNotificationView({ programId }: PPPNotificationViewProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const { sending, error: sendError, send } = usePPPNotification();

	const [notificationMessageId, setNotificationMessageId] = useState<number | null>(null);
	const [surveyBaseUrl, setSurveyBaseUrl] = useState('');
	const [maxRegisterDate, setMaxRegisterDate] = useState('');
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	const isValid = !!academicPeriodId && surveyBaseUrl.trim() !== '';

	React.useEffect(() => {
		if (sendError) setToast({ open: true, type: 'error', msg: sendError });
	}, [sendError]);

	function handleSend() {
		if (!isValid || !academicPeriodId) {
			setToast({
				open: true,
				type: 'error',
				msg: t('surveys.ppp.notifications.toast.required'),
			});
			return;
		}
		send(
			{
				academicPeriodId,
				programId: programId ?? 0,
				surveyBaseUrl: surveyBaseUrl.trim(),
				...(maxRegisterDate ? { maxRegisterDate: new Date(maxRegisterDate).toISOString() } : {}),
				...(notificationMessageId ? { notificationMessageId } : {}),
			},
			() =>
				setToast({
					open: true,
					type: 'success',
					msg: t('surveys.ppp.notifications.toast.sent'),
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
					{t('surveys.ppp.notifications.title')}
				</h3>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.ppp.notifications.description')}</p>
			</div>

			<div className="space-y-4">
				<SurveyTemplateSelect
					surveyTypeCode="PPP"
					programId={programId || undefined}
					value={notificationMessageId}
					onChange={setNotificationMessageId}
				/>

				<Input
					label={t('surveys.ppp.notifications.urlLabel')}
					value={surveyBaseUrl}
					onChange={(e) => setSurveyBaseUrl(e.target.value)}
					placeholder={t('surveys.ppp.notifications.urlPlaceholder')}
					type="url"
				/>

				<Input
					label={t('surveys.ppp.notifications.dateLabel')}
					value={maxRegisterDate}
					onChange={(e) => setMaxRegisterDate(e.target.value)}
					type="date"
				/>
			</div>

			<Button onClick={handleSend} disabled={!isValid || sending}>
				<PaperAirplaneIcon className="h-4 w-4 mr-2" />
				{sending ? t('surveys.ppp.notifications.sending') : t('surveys.ppp.notifications.send')}
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
