'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
	Input,
	Toast,
} from '@/shared/components';
import { TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { useGRAStudents, useGRAEmail } from '../../../hooks';
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
	const { t } = useI18n();
	const { students, error, load, remove } = useGRAStudents();
	const { sending, send } = useGRAEmail(0);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [sendDialogOpen, setSendDialogOpen] = useState(false);
	const [surveyBaseUrl, setSurveyBaseUrl] = useState('');
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

	function handleSendAll() {
		const req: GRAEmailSendRequest = {
			academicPeriodId: academicPeriodId,
			programId: programId,
			surveyBaseUrl: surveyBaseUrl.trim(),
		};
		send(req, () => {
			setSendDialogOpen(false);
			setToast({
				open: true,
				type: 'success',
				msg: t('surveys.gra.notifications.toast.surveySent'),
			});
		});
	}

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
				cell: ({ row }) => (
					<Button
						size="sm"
						variant="warning"
						onClick={() => setDeleteId(row.original.notificationId)}
						aria-label={t('surveys.gra.notifications.delete')}>
						<TrashIcon className="h-4 w-4" />
					</Button>
				),
			},
		],
		[t],
	);

	return (
		<div className="space-y-4">
			{error && (
				<p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
					{tryTranslate(t, error)}
				</p>
			)}

			<DataTable
				columns={columns}
				data={students}
				title={t('surveys.gra.notifications.title').replace('{{count}}', String(students.length))}
				actions={[
					{
						label: t('surveys.gra.notifications.sendSurvey'),
						onClick: () => setSendDialogOpen(true),
						icon: <PaperAirplaneIcon className="h-4 w-4" />,
					},
				]}
			/>

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
						<Input
							label={t('surveys.gra.notifications.sendDialog.urlLabel')}
							value={surveyBaseUrl}
							onChange={(e) => setSurveyBaseUrl(e.target.value)}
							placeholder={t('surveys.gra.notifications.sendDialog.urlPlaceholder')}
							type="url"
						/>
					</div>
					<DialogFooter showCloseButton>
						<Button onClick={handleSendAll} disabled={sending || !surveyBaseUrl.trim()}>
							{sending
								? t('surveys.gra.notifications.sendDialog.sending')
								: t('surveys.gra.notifications.sendDialog.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
