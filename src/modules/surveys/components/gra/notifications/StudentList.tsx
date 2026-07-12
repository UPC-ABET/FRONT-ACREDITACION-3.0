'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
	DataTable,
	Button,
	Badge,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	Toast,
	Toggle,
} from '@/shared/components';
import {
	TrashIcon,
	PaperAirplaneIcon,
	UserPlusIcon,
	BellAlertIcon,
} from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { getErrorMessage } from '@/shared/lib';
import { useGRAStudents, useGRASendNotifications } from '../../../hooks';
import { AddStudentPanel } from './AddStudentPanel';
import { GRANotificationProgressDialog } from './GRANotificationProgressDialog';
import { SendSummaryBody } from '../../shared/SendSummaryBody';
import { SURVEY_BASE_URL, resendGRANotification } from '../../../services';
import type { GRAStudent, GRAEmailSendRequest } from '../../../types';
import {
	NOTIFICATION_STATUS,
	NOTIFICATION_STATUS_LABEL_KEY,
} from '../../../constants/notificationStatus';

interface StudentListProps {
	readonly programId: number;
	readonly academicPeriodId: number;
}

export function StudentList({ programId, academicPeriodId }: StudentListProps) {
	const { t, locale } = useI18n();
	const { students, error, load, remove } = useGRAStudents();
	const {
		summary,
		loadingSummary,
		loadSummary,
		sending,
		status,
		error: sendError,
		send,
		reset,
	} = useGRASendNotifications();
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [sendDialogOpen, setSendDialogOpen] = useState(false);
	const [progressDialogOpen, setProgressDialogOpen] = useState(false);
	const [addStudentOpen, setAddStudentOpen] = useState(false);
	const [resendingId, setResendingId] = useState<number | null>(null);
	// "Reenviar a quienes ya recibieron" — same toggle LCFC uses on its send flow.
	const [includeAlreadySent, setIncludeAlreadySent] = useState(false);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		load({ programId: programId, academicPeriodId: academicPeriodId });
	}, [programId, academicPeriodId, load]);

	function handleDelete(id: number) {
		remove(id, () => {
			setDeleteId(null);
			setToast({
				open: true,
				type: 'success',
				msg: t('surveys.gra.notifications.toast.studentDeleted'),
			});
			load({ programId: programId, academicPeriodId: academicPeriodId });
		});
	}

	function handleOpenSendDialog() {
		reset();
		setIncludeAlreadySent(false);
		setSendDialogOpen(true);
		loadSummary(programId || undefined, false);
	}

	function handleToggleIncludeAlreadySent(checked: boolean) {
		setIncludeAlreadySent(checked);
		loadSummary(programId || undefined, checked);
	}

	function handleConfirmSend() {
		const req: GRAEmailSendRequest = {
			academicPeriodId: academicPeriodId,
			programId: programId,
			surveyBaseUrl: SURVEY_BASE_URL,
			resend: includeAlreadySent,
		};
		setSendDialogOpen(false);
		setProgressDialogOpen(true);
		send(req, () => {
			setToast({
				open: true,
				type: 'success',
				msg: t('surveys.gra.notifications.toast.surveySent'),
			});
			load({ programId: programId, academicPeriodId: academicPeriodId });
		});
	}

	function handleStudentAdded() {
		setAddStudentOpen(false);
		load({ programId: programId, academicPeriodId: academicPeriodId });
	}

	const handleResend = useCallback(
		async (notificationId: number) => {
			setResendingId(notificationId);
			try {
				await resendGRANotification(notificationId, locale);
				setToast({
					open: true,
					type: 'success',
					msg: t('surveys.gra.notifications.toast.resent'),
				});
				load({ programId: programId, academicPeriodId: academicPeriodId });
			} catch (e) {
				setToast({ open: true, type: 'error', msg: tryTranslate(t, getErrorMessage(e)) });
			} finally {
				setResendingId(null);
			}
		},
		[locale, t, load, programId, academicPeriodId],
	);

	const columns = useMemo<ColumnDef<GRAStudent>[]>(
		() => [
			{
				accessorKey: 'studentCode',
				header: t('surveys.gra.notifications.columns.code'),
			},
			{
				accessorKey: 'studentName',
				header: t('surveys.gra.notifications.columns.name'),
			},
			{
				accessorKey: 'studentEmail',
				header: t('surveys.gra.notifications.columns.email'),
			},
			{
				accessorKey: 'sendStatus',
				header: t('surveys.gra.notifications.columns.sendStatus'),
				// NOSONAR — cell renderers are render functions, not React components
				cell: ({ getValue }) => {
					const status = (getValue() as string) ?? NOTIFICATION_STATUS.PENDING;
					const labelKey =
						NOTIFICATION_STATUS_LABEL_KEY[status as keyof typeof NOTIFICATION_STATUS_LABEL_KEY] ??
						'surveys.gra.notifications.status.pending';
					return (
						<Badge variant={status === NOTIFICATION_STATUS.SENT ? 'default' : 'outline'}>
							{t(labelKey)}
						</Badge>
					);
				},
			},
			{
				accessorKey: 'responseStatus',
				header: t('surveys.gra.notifications.columns.responseStatus'),
				// NOSONAR — cell renderers are render functions, not React components
				cell: ({ getValue }) => {
					const status = getValue() as string | undefined;
					if (!status) return <span className="text-zinc-400 text-xs">—</span>;
					const labelKey =
						NOTIFICATION_STATUS_LABEL_KEY[status as keyof typeof NOTIFICATION_STATUS_LABEL_KEY];
					return (
						<Badge variant={status === NOTIFICATION_STATUS.RESPONDED ? 'success' : 'outline'}>
							{labelKey ? t(labelKey) : status}
						</Badge>
					);
				},
			},
			{
				id: 'actions',
				header: t('surveys.gra.notifications.columns.actions'),
				// NOSONAR — cell renderers are render functions, not React components
				cell: ({ row }) => {
					const alreadyResponded = row.original.responseStatus === NOTIFICATION_STATUS.RESPONDED;
					return (
						<div className="flex items-center justify-end gap-1">
							{!alreadyResponded && (
								<Button
									size="icon"
									variant="ghost"
									className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
									disabled={resendingId === row.original.notificationId}
									loading={resendingId === row.original.notificationId}
									onClick={() => handleResend(row.original.notificationId)}
									aria-label={t('surveys.gra.notifications.resend')}>
									<BellAlertIcon className="h-5 w-5" />
								</Button>
							)}
							<Button
								size="icon"
								variant="ghost"
								className="text-red-600 hover:bg-red-50"
								onClick={() => setDeleteId(row.original.notificationId)}
								aria-label={t('surveys.gra.notifications.delete')}>
								<TrashIcon className="h-5 w-5" />
							</Button>
						</div>
					);
				},
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
			},
		],
		[t, resendingId, handleResend],
	);

	const translatedSendError = sendError ? tryTranslate(t, sendError) : null;

	return (
		<div className="space-y-4">
			{error && (
				<p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
					{tryTranslate(t, error)}
				</p>
			)}

			<div className="flex flex-wrap items-center justify-between gap-3">
				<h3 className="text-lg font-bold text-zinc-800 uppercase">
					{t('surveys.gra.notifications.title').replace('{{count}}', String(students.length))}
				</h3>
				<div className="flex flex-wrap items-center gap-2">
					<Button variant="surface" onClick={() => setAddStudentOpen(true)}>
						<UserPlusIcon className="h-4 w-4 mr-2" />
						{t('surveys.gra.notifications.addStudent')}
					</Button>
					<Button onClick={handleOpenSendDialog}>
						<PaperAirplaneIcon className="h-4 w-4 mr-2" />
						{t('surveys.gra.notifications.sendSurvey')}
					</Button>
				</div>
			</div>

			<DataTable columns={columns} data={students} />

			<Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('surveys.gra.notifications.deleteTitle')}</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-zinc-600 py-2">{t('surveys.gra.notifications.deleteBody')}</p>
					<DialogFooter showCloseButton>
						<Button variant="warning" onClick={() => deleteId !== null && handleDelete(deleteId)}>
							{t('surveys.gra.notifications.delete')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t('surveys.gra.notifications.addStudentTitle')}</DialogTitle>
					</DialogHeader>
					<AddStudentPanel onStudentAdded={handleStudentAdded} />
				</DialogContent>
			</Dialog>

			<Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('surveys.gra.notifications.sendDialog.title')}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<p className="text-sm text-zinc-600">
							{t('surveys.gra.notifications.sendDialog.bodyBefore')}
							<strong>{t('surveys.gra.notifications.sendDialog.bodyEmphasis')}</strong>
							{t('surveys.gra.notifications.sendDialog.bodyAfter')}
						</p>

						<div>
							<Toggle
								label={t('surveys.gra.notifications.resendLabel')}
								checked={includeAlreadySent}
								onChange={handleToggleIncludeAlreadySent}
							/>
							<p className="text-xs text-zinc-500 mt-1">
								{t('surveys.gra.notifications.resendHint')}
							</p>
						</div>

						<SendSummaryBody
							loading={loadingSummary}
							summary={summary}
							loadingLabel={t('surveys.gra.notifications.sendDialog.summaryLoading')}
							emptyMessage={t(
								includeAlreadySent
									? 'surveys.gra.notifications.sendDialog.summaryEmptyResend'
									: 'surveys.gra.notifications.sendDialog.summaryEmpty',
							)}
							programsLabel={t('surveys.gra.notifications.sendDialog.summaryPrograms')}
							studentsLabel={t('surveys.gra.notifications.sendDialog.summaryStudents')}
							byProgramTitle={t('surveys.gra.notifications.sendDialog.summaryByProgramTitle')}
						/>
					</div>
					<DialogFooter showCloseButton>
						<Button
							onClick={handleConfirmSend}
							disabled={loadingSummary || !summary || summary.totalStudents === 0}>
							{t('surveys.gra.notifications.sendDialog.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<GRANotificationProgressDialog
				open={progressDialogOpen}
				sending={sending}
				status={status}
				error={translatedSendError}
				onOpenChange={setProgressDialogOpen}
			/>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
