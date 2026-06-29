'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
	ExclamationTriangleIcon,
	PencilSquareIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	ConfirmDialog,
	DataTable,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Select,
	SubTitle,
	Title,
	Toast,
} from '@/shared';
import { useProgramsByModality, type ProgramResponse } from '@/modules/academic';
import { useABET, useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants';
import {
	useOutcomeCommissionOptions,
	useOutcomeMaintenanceMutations,
	useOutcomesMaintenance,
} from '../hooks';
import type {
	OutcomeMaintenanceCreate,
	OutcomeMaintenanceItem,
	OutcomeMaintenanceUpdate,
} from '../types';
import { OutcomeMaintenanceCreateDialog, OutcomeMaintenanceEditDialog } from '@/modules';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

function RowActions({
	onEdit,
	onDelete,
	editLabel,
	deleteLabel,
}: {
	onEdit: () => void;
	onDelete: () => void;
	editLabel: string;
	deleteLabel: string;
}) {
	return (
		<div className="flex items-center justify-end gap-1">
			<Button
				variant="ghost"
				size="icon"
				className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
				onClick={onEdit}
				aria-label={editLabel}
				title={editLabel}>
				<PencilSquareIcon className="h-5 w-5" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="text-red-600 hover:bg-red-50"
				onClick={onDelete}
				aria-label={deleteLabel}
				title={deleteLabel}>
				<TrashIcon className="h-5 w-5" />
			</Button>
		</div>
	);
}

export function OutcomesMaintenance() {
	const { t, locale } = useI18n();
	const { academicPeriodId, modalityTypeId } = useABET();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const { data: programs = [] } = useProgramsByModality(modalityTypeId);

	const [programId, setProgramId] = useState<number | null>(null);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [editing, setEditing] = useState<OutcomeMaintenanceItem | null>(null);
	const [editError, setEditError] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<OutcomeMaintenanceItem | null>(null);
	const [blockedReasons, setBlockedReasons] = useState<string[] | null>(null);

	const { create, update, remove } = useOutcomeMaintenanceMutations();
	const { data: commissions = [], isLoading: commissionsLoading } = useOutcomeCommissionOptions(
		programId,
		academicPeriodId,
	);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	const handleProgramChange = (value: number | null) => {
		setProgramId(value);
		setPage(1);
	};

	const { data, isLoading, isFetching, isError } = useOutcomesMaintenance({
		programId,
		academicPeriodId,
		page,
		pageSize: PAGE_SIZE,
		search: debouncedSearch,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const totalPages = data?.totalPages ?? 1;

	const programOptions = useMemo(
		() =>
			programs.map((program: ProgramResponse) => ({
				value: program.id,
				label: localized(program.name, locale) || program.code,
			})),
		[programs, locale],
	);

	const selectedProgram = programOptions.find((option) => option.value === programId) ?? null;

	const handleCreate = async (body: OutcomeMaintenanceCreate) => {
		setCreateError(null);
		try {
			await create.mutateAsync(body);
			showToast('loads.outcomesMaintenance.toast.created', 'success');
			setCreating(false);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setCreateError(
				tryTranslate(t, reason ?? getErrorMessage(error, 'loads.outcomesMaintenance.create.error')),
			);
		}
	};

	const handleSaveEdit = async (body: OutcomeMaintenanceUpdate) => {
		if (!editing) return;
		setEditError(null);
		try {
			await update.mutateAsync({ id: editing.id, body });
			showToast('loads.outcomesMaintenance.toast.updated', 'success');
			setEditing(null);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setEditError(
				tryTranslate(t, reason ?? getErrorMessage(error, 'loads.outcomesMaintenance.edit.error')),
			);
		}
	};

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		try {
			await remove.mutateAsync(pendingDelete.id);
			showToast('loads.outcomesMaintenance.toast.deleted', 'success');
			setPendingDelete(null);
		} catch (error) {
			const reasons = getApiErrorReasons(error);
			setPendingDelete(null);
			if (reasons.length > 0) {
				setBlockedReasons(reasons);
			} else {
				showToast(getErrorMessage(error, 'loads.outcomesMaintenance.delete.error'), 'error');
			}
		}
	};

	const openEdit = (item: OutcomeMaintenanceItem) => {
		setEditError(null);
		setEditing(item);
	};

	const editLabel = t('loads.outcomesMaintenance.actions.edit');
	const deleteLabel = t('loads.outcomesMaintenance.actions.delete');

	const needsSelection = academicPeriodId == null || programId == null;

	const columns = useMemo<ColumnDef<OutcomeMaintenanceItem>[]>(
		() => [
			{
				accessorKey: 'commissionCode',
				header: t('loads.outcomesMaintenance.col.commissionCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				accessorKey: 'outcomeCode',
				header: t('loads.outcomesMaintenance.col.outcomeCode'),
				meta: { cellClassName: 'font-mono text-zinc-800' },
			},
			{
				id: 'outcomeName',
				header: t('loads.outcomesMaintenance.col.outcomeName'),
				meta: { cellClassName: 'text-zinc-700' },
				cell: ({ row }) => localized(row.original.outcomeName, locale),
			},
			{
				id: 'outcomeDescription',
				header: t('loads.outcomesMaintenance.col.outcomeDescription'),
				cell: ({ row }) => (
					<span className="line-clamp-2 max-w-md text-zinc-500">
						{localized(row.original.outcomeDescription, locale)}
					</span>
				),
			},
			{
				id: 'actions',
				header: t('loads.outcomesMaintenance.col.actions'),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => (
					<RowActions
						onEdit={() => openEdit(row.original)}
						onDelete={() => setPendingDelete(row.original)}
						editLabel={editLabel}
						deleteLabel={deleteLabel}
					/>
				),
			},
		],
		[t, locale, editLabel, deleteLabel],
	);

	return (
		<Card>
			<div className="space-y-5">
				<div className="space-y-1">
					<Title
						title={t('loads.outcomesMaintenance.title')}
						className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900"
					/>
					<SubTitle
						name={t('loads.outcomesMaintenance.subtitle')}
						className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-zinc-500"
					/>
				</div>

				<DataTable
					columns={columns}
					data={items}
					searchPlaceholder={t('loads.outcomesMaintenance.searchPlaceholder')}
					searchValue={search}
					onSearchChange={handleSearchChange}
					aria-label={t('loads.outcomesMaintenance.title')}
					isLoading={isLoading}
					errorMessage={isError ? t('loads.outcomesMaintenance.error.loadFailed') : undefined}
					emptyMessage={
						academicPeriodId == null
							? t('loads.outcomesMaintenance.selectPeriod')
							: programId == null
								? t('loads.outcomesMaintenance.selectProgram')
								: t('loads.outcomesMaintenance.empty.title')
					}
					filters={
						<div className="w-full sm:w-56">
							<Select
								name="program"
								aria-label={t('loads.outcomesMaintenance.programLabel')}
								placeholder={t('loads.outcomesMaintenance.programPlaceholder')}
								isSearchable
								isClearable
								isDisabled={academicPeriodId == null}
								options={programOptions}
								value={selectedProgram}
								onChange={(_name, value) =>
									handleProgramChange(value && !Array.isArray(value) ? Number(value.value) : null)
								}
							/>
						</div>
					}
					serverPagination={{
						page,
						pageCount: totalPages,
						total,
						onPageChange: setPage,
						isFetching,
					}}
					actions={[
						{
							label: t('loads.outcomesMaintenance.actions.new'),
							onClick: () => {
								setCreateError(null);
								setCreating(true);
							},
							icon: <PlusIcon className="h-4 w-4" />,
							buttonProps: { variant: 'primary', disabled: needsSelection },
						},
					]}
				/>
			</div>

			{creating && programId != null && (
				<OutcomeMaintenanceCreateDialog
					programId={programId}
					commissions={commissions}
					commissionsLoading={commissionsLoading}
					saving={create.isPending}
					errorMessage={createError}
					onClose={() => setCreating(false)}
					onCreate={handleCreate}
				/>
			)}

			{editing && (
				<OutcomeMaintenanceEditDialog
					item={editing}
					saving={update.isPending}
					errorMessage={editError}
					onClose={() => setEditing(null)}
					onSave={handleSaveEdit}
				/>
			)}

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('loads.outcomesMaintenance.delete.title')}
				message={t('loads.outcomesMaintenance.delete.message')}
				confirmLabel={t('loads.outcomesMaintenance.actions.delete')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirmDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={remove.isPending}
			/>

			<Dialog
				open={blockedReasons != null}
				onOpenChange={(open) => {
					if (!open) setBlockedReasons(null);
				}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<div className="flex items-center gap-2 text-red-700">
							<ExclamationTriangleIcon className="h-5 w-5" />
							<DialogTitle>{t('loads.outcomesMaintenance.delete.blockedTitle')}</DialogTitle>
						</div>
						<DialogDescription>
							{t('loads.outcomesMaintenance.delete.blockedSubtitle')}
						</DialogDescription>
					</DialogHeader>
					<ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
						{(blockedReasons ?? []).map((reason) => (
							<li key={reason}>{tryTranslate(t, reason)}</li>
						))}
					</ul>
					<DialogFooter showCloseButton />
				</DialogContent>
			</Dialog>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</Card>
	);
}
