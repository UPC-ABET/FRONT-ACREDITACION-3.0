'use client';

import React, { useEffect, useState } from 'react';
import { Select, Button, Input, Toast } from '@/shared/components';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { useLCFCNotification, useLCFCCycles, useLCFCNotificationForm } from '../../../hooks';
import { useABET } from '@/providers';

export function LCFCNotificationView() {
	const { t } = useI18n();
	const { modalityTypeId } = useABET();
	const { cycles, load: loadCycles } = useLCFCCycles();
	const { sending, error: sendError, send } = useLCFCNotification();
	const { form, isValid, setSelectedCycle, setSurveyBaseUrl, setMaxRegisterDate } =
		useLCFCNotificationForm();

	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		loadCycles(modalityTypeId);
	}, [modalityTypeId, loadCycles]);

	useEffect(() => {
		if (sendError) setToast({ open: true, type: 'error', msg: sendError });
	}, [sendError]);

	function handleSend() {
		if (!isValid) {
			setToast({
				open: true,
				type: 'error',
				msg: t('surveys.lcfc.notifications.toast.required'),
			});
			return;
		}
		send(
			{
				academicPeriodId: form.selectedCycle!.value,
				programId: 0,
				maxRegisterDate: new Date(form.maxRegisterDate).toISOString(),
				surveyBaseUrl: form.surveyBaseUrl.trim(),
			},
			() =>
				setToast({
					open: true,
					type: 'success',
					msg: t('surveys.lcfc.notifications.toast.sent'),
				}),
		);
	}

	const cycleOptions = cycles.map((c) => ({ label: c.name, value: c.id }));

	return (
		<div className="max-w-lg space-y-6">
			<div>
				<h3 className="text-base font-bold text-zinc-800">
					{t('surveys.lcfc.notifications.title')}
				</h3>
				<p className="text-sm text-zinc-500 mt-1">
					{t('surveys.lcfc.notifications.description')}
				</p>
			</div>

			<div className="space-y-4">
				<Select
					label={t('surveys.lcfc.notifications.cycleLabel')}
					options={cycleOptions}
					value={form.selectedCycle}
					onChange={(_, val) =>
						setSelectedCycle(val as { label: string; value: number } | null)
					}
					placeholder={t('surveys.lcfc.notifications.cyclePlaceholder')}
					isSearchable
				/>

				<Input
					label={t('surveys.lcfc.notifications.urlLabel')}
					value={form.surveyBaseUrl}
					onChange={(e) => setSurveyBaseUrl(e.target.value)}
					placeholder={t('surveys.lcfc.notifications.urlPlaceholder')}
					type="url"
				/>

				<Input
					label={t('surveys.lcfc.notifications.dateLabel')}
					value={form.maxRegisterDate}
					onChange={(e) => setMaxRegisterDate(e.target.value)}
					type="date"
				/>
			</div>

			<Button onClick={handleSend} disabled={!isValid || sending}>
				<PaperAirplaneIcon className="h-4 w-4 mr-2" />
				{sending
					? t('surveys.lcfc.notifications.sending')
					: t('surveys.lcfc.notifications.send')}
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
