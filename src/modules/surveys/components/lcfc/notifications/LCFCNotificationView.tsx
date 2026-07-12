'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
	Button,
	DataTable,
	Toast,
	Toggle,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/shared/components';
import { tryTranslate } from '@/shared';
import { PaperAirplaneIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { useI18n, useABET } from '@/providers';
import { useLCFCNotification, useLCFCSections } from '../../../hooks';
import { SendSummaryBody } from '../../shared/SendSummaryBody';
import type { LCFCSectionSummary } from '../../../types';
import { LCFCNotificationProgressDialog } from './LCFCNotificationProgressDialog';

const SECTIONS_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

interface LCFCNotificationViewProps {
	programId?: number;
}

export function LCFCNotificationView({ programId }: LCFCNotificationViewProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const {
		sending,
		error: sendError,
		status: sendStatus,
		summary,
		loadingSummary,
		loadSummary,
		send,
	} = useLCFCNotification();
	const {
		sections,
		total,
		totalPages,
		loading: sectionsLoading,
		load: loadSections,
	} = useLCFCSections();

	const [page, setPage] = useState(1);
	// searchInput follows the keystrokes; search is its debounced value sent to the backend.
	const [searchInput, setSearchInput] = useState('');
	const [search, setSearch] = useState('');
	const [resend, setResend] = useState(false);
	// courseSectionId currently being (re)sent, for the per-row spinner; 0 = the "send all" button.
	const [sendingSectionId, setSendingSectionId] = useState<number | null>(null);
	const [sendDialogOpen, setSendDialogOpen] = useState(false);
	const [progressDialogOpen, setProgressDialogOpen] = useState(false);
	const [progressTargetLabel, setProgressTargetLabel] = useState('');
	const [sendErrorDismissed, setSendErrorDismissed] = useState(false);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	const isValid = !!academicPeriodId;

	useEffect(() => {
		const id = setTimeout(() => {
			setPage(1);
			setSearch(searchInput.trim());
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(id);
	}, [searchInput]);

	// Changing the career filter restarts from the first page (adjust-state-during-render pattern).
	const [prevProgramId, setPrevProgramId] = useState(programId);
	if (prevProgramId !== programId) {
		setPrevProgramId(programId);
		setPage(1);
	}

	useEffect(() => {
		// With no program selected the backend lists every configured course across all programs;
		// the search then applies globally. The period travels in the x-academic-period-id header.
		if (academicPeriodId) {
			loadSections({ programId, search, page, pageSize: SECTIONS_PAGE_SIZE });
		}
	}, [academicPeriodId, programId, search, page, loadSections]);

	// Build the request shared by "send all" and per-row resend. The deadline is configured
	// in the Configuration tab and applied by the backend, so it isn't sent here. The survey
	// lives in this same app, so the base URL is always our own origin.
	function buildRequest(courseSectionId?: number, forceResend?: boolean) {
		return {
			academicPeriodId: academicPeriodId as number,
			surveyBaseUrl: window.location.origin,
			resend: forceResend ?? resend,
			// Omit programId when no program is selected so the backend targets every program.
			...(programId ? { programId } : {}),
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

	function handleOpenSendDialog() {
		if (!requireValid()) return;
		setResend(false);
		setSendDialogOpen(true);
		loadSummary({ programId, resend: false });
	}

	function handleToggleResend(checked: boolean) {
		setResend(checked);
		loadSummary({ programId, resend: checked });
	}

	function handleConfirmSendAll() {
		if (!requireValid()) return;
		setSendDialogOpen(false);
		setSendErrorDismissed(false);
		setSendingSectionId(0);
		setProgressTargetLabel(t('surveys.lcfc.notifications.progress.targetAll'));
		setProgressDialogOpen(true);
		send(
			buildRequest(),
			() => {
				setSendingSectionId(null);
				setToast({ open: true, type: 'success', msg: t('surveys.lcfc.notifications.toast.sent') });
			},
			() => setSendingSectionId(null),
		);
	}

	function handleResendSection(course: LCFCSectionSummary) {
		if (!requireValid()) return;
		const courseSectionId = course.courseSectionId as number;
		setSendErrorDismissed(false);
		setSendingSectionId(courseSectionId);
		setProgressTargetLabel(
			t('surveys.lcfc.notifications.progress.targetSection')
				.replace('{{course}}', course.courseName)
				.replace('{{section}}', course.sectionCode),
		);
		setProgressDialogOpen(true);
		// Per-row action always resends (reuses token + refreshes deadline) for that section.
		send(
			buildRequest(courseSectionId, true),
			() => {
				setSendingSectionId(null);
				setToast({ open: true, type: 'success', msg: t('surveys.lcfc.notifications.toast.sent') });
			},
			() => setSendingSectionId(null),
		);
	}

	const columns = useMemo<ColumnDef<LCFCSectionSummary>[]>(
		() => [
			{
				accessorKey: 'courseName',
				header: t('surveys.lcfc.notifications.colCourse'),
			},
			{
				accessorKey: 'sectionCode',
				header: t('surveys.lcfc.notifications.colSection'),
			},
			{
				id: 'actions',
				header: t('surveys.lcfc.notifications.colActions'),
				// NOSONAR — cell renderers are render functions, not React components
				cell: ({ row }) => (
					<Button
						size="icon"
						variant="ghost"
						className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
						disabled={!isValid || sending}
						loading={sending && sendingSectionId === row.original.courseSectionId}
						onClick={() => handleResendSection(row.original)}
						aria-label={t('surveys.lcfc.notifications.resendRow')}>
						<BellAlertIcon className="h-5 w-5" />
					</Button>
				),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps -- handleResendSection is re-created per render; the deps cover everything it reads (period/program via buildRequest)
		[t, isValid, sending, sendingSectionId, programId, academicPeriodId],
	);

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	const translatedSendError = sendError ? tryTranslate(t, sendError) : '';
	const visibleToast =
		sendError && !sendErrorDismissed
			? { open: true, type: 'error' as const, msg: translatedSendError }
			: toast;

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

				<p className="text-xs text-zinc-500">{t('surveys.lcfc.notifications.deadlineInConfig')}</p>

				<Button onClick={handleOpenSendDialog} disabled={!isValid || sending}>
					<PaperAirplaneIcon className="h-4 w-4 mr-2" />
					{sending && sendingSectionId === 0
						? t('surveys.lcfc.notifications.sending')
						: t('surveys.lcfc.notifications.sendAll')}
				</Button>
			</div>

			{/* Per-section table (server-paginated + searched): resend to a single course section. */}
			<DataTable
				columns={columns}
				data={sections}
				searchValue={searchInput}
				onSearchChange={setSearchInput}
				searchPlaceholder={t('surveys.lcfc.notifications.searchPlaceholder')}
				serverPagination={{
					page,
					pageCount: totalPages,
					total,
					onPageChange: setPage,
					isFetching: sectionsLoading,
				}}
				isLoading={sectionsLoading && sections.length === 0}
			/>

			<Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('surveys.lcfc.notifications.sendDialog.title')}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<p className="text-sm text-zinc-600">
							{t('surveys.lcfc.notifications.sendDialog.body')}
						</p>

						<div>
							<Toggle
								label={t('surveys.lcfc.notifications.resendLabel')}
								checked={resend}
								onChange={handleToggleResend}
							/>
							<p className="text-xs text-zinc-500 mt-1">
								{t('surveys.lcfc.notifications.resendHint')}
							</p>
						</div>

						<SendSummaryBody
							loading={loadingSummary}
							summary={summary}
							loadingLabel={t('surveys.lcfc.notifications.sendDialog.summaryLoading')}
							emptyMessage={t(
								resend
									? 'surveys.lcfc.notifications.sendDialog.summaryEmptyResend'
									: 'surveys.lcfc.notifications.sendDialog.summaryEmpty',
							)}
							programsLabel={t('surveys.lcfc.notifications.sendDialog.summaryPrograms')}
							studentsLabel={t('surveys.lcfc.notifications.sendDialog.summaryStudents')}
							byProgramTitle={t('surveys.lcfc.notifications.sendDialog.summaryByProgramTitle')}
						/>
					</div>
					<DialogFooter showCloseButton>
						<Button
							onClick={handleConfirmSendAll}
							disabled={loadingSummary || !summary || summary.totalStudents === 0}>
							{t('surveys.lcfc.notifications.sendDialog.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Toast
				isOpen={visibleToast.open}
				type={visibleToast.type}
				message={visibleToast.msg}
				onClose={() => {
					if (sendError && !sendErrorDismissed) {
						setSendErrorDismissed(true);
						return;
					}
					setToast({ ...toast, open: false });
				}}
			/>

			<LCFCNotificationProgressDialog
				open={progressDialogOpen}
				sending={sending}
				status={sendStatus}
				error={translatedSendError || null}
				targetLabel={progressTargetLabel || t('surveys.lcfc.notifications.progress.targetAll')}
				onOpenChange={setProgressDialogOpen}
			/>
		</div>
	);
}
