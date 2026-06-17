'use client';

import React, { useEffect, useState } from 'react';
import { Button, Input, Toast, Toggle } from '@/shared/components';
import { PaperAirplaneIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { useI18n, useABET } from '@/providers';
import { useLCFCNotification, useLCFCConfiguration } from '../../../hooks';

interface LCFCNotificationViewProps {
	programId?: number;
}

export function LCFCNotificationView({ programId }: LCFCNotificationViewProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const { sending, error: sendError, send } = useLCFCNotification();
	const { courses, load: loadCourses } = useLCFCConfiguration();

	const [maxRegisterDate, setMaxRegisterDate] = useState('');
	const [resend, setResend] = useState(false);
	// courseSectionId currently being (re)sent, for the per-row spinner; 0 = the "send all" button.
	const [sendingSectionId, setSendingSectionId] = useState<number | null>(null);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	const isValid = !!academicPeriodId && maxRegisterDate !== '';

	useEffect(() => {
		if (academicPeriodId && programId) loadCourses(academicPeriodId, programId);
	}, [academicPeriodId, programId, loadCourses]);

	React.useEffect(() => {
		if (sendError) {
			setToast({ open: true, type: 'error', msg: sendError });
			setSendingSectionId(null);
		}
	}, [sendError]);

	// Build the request shared by "send all" and per-row resend. The date input yields
	// "YYYY-MM-DD"; anchor the deadline to the end of that day in the user's timezone so
	// the survey stays open the whole selected day (UTC midnight would expire it same-day).
	// The survey lives in this same app, so the base URL is always our own origin.
	function buildRequest(courseSectionId?: number, forceResend?: boolean) {
		return {
			academicPeriodId: academicPeriodId as number,
			programId: programId ?? 0,
			maxRegisterDate: new Date(`${maxRegisterDate}T23:59:59`).toISOString(),
			surveyBaseUrl: window.location.origin,
			resend: forceResend ?? resend,
			...(courseSectionId ? { courseSectionId } : {}),
		};
	}

	function requireValid(): boolean {
		if (!isValid || !academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.lcfc.notifications.toast.required') });
			return false;
		}
		return true;
	}

	function handleSendAll() {
		if (!requireValid()) return;
		setSendingSectionId(0);
		send(buildRequest(), () => {
			setSendingSectionId(null);
			setToast({ open: true, type: 'success', msg: t('surveys.lcfc.notifications.toast.sent') });
		});
	}

	function handleResendSection(courseSectionId: number) {
		if (!requireValid()) return;
		setSendingSectionId(courseSectionId);
		// Per-row action always resends (reuses token + refreshes deadline) for that section.
		send(buildRequest(courseSectionId, true), () => {
			setSendingSectionId(null);
			setToast({ open: true, type: 'success', msg: t('surveys.lcfc.notifications.toast.sent') });
		});
	}

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	const activeCourses = courses.filter((c) => c.isActive && c.courseSectionId);

	return (
		<div className="space-y-6">
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
						<p className="text-xs text-zinc-500 mt-1">
							{t('surveys.lcfc.notifications.resendHint')}
						</p>
					</div>
				</div>

				<Button onClick={handleSendAll} disabled={!isValid || sending}>
					<PaperAirplaneIcon className="h-4 w-4 mr-2" />
					{sending && sendingSectionId === 0
						? t('surveys.lcfc.notifications.sending')
						: t('surveys.lcfc.notifications.sendAll')}
				</Button>
			</div>

			{/* Per-section summary table: resend to a single course section. */}
			{activeCourses.length > 0 && (
				<div className="rounded-xl border border-zinc-200 overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-zinc-50 text-zinc-600">
							<tr>
								<th className="text-left font-medium px-4 py-2">
									{t('surveys.lcfc.notifications.colCourse')}
								</th>
								<th className="text-left font-medium px-4 py-2">
									{t('surveys.lcfc.notifications.colSection')}
								</th>
								<th className="text-right font-medium px-4 py-2">
									{t('surveys.lcfc.notifications.colActions')}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-100">
							{activeCourses.map((course) => (
								<tr key={course.id}>
									<td className="px-4 py-2 text-zinc-800">{course.courseName}</td>
									<td className="px-4 py-2 text-zinc-600">{course.sectionCode ?? course.code}</td>
									<td className="px-4 py-2 text-right">
										<Button
											size="sm"
											variant="surface"
											disabled={!isValid || sending}
											loading={sending && sendingSectionId === course.courseSectionId}
											onClick={() => handleResendSection(course.courseSectionId as number)}
											aria-label={t('surveys.lcfc.notifications.resendRow')}>
											<BellAlertIcon className="h-4 w-4 mr-1" />
											{t('surveys.lcfc.notifications.resendRow')}
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
