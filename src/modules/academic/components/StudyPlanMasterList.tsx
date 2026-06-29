'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
	ExclamationTriangleIcon,
	EyeIcon,
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
} from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib/apiError';
import { tryTranslate } from '@/shared/utils';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants';
import {
	useProgramsByModality,
	useStudyPlanMaintenanceMutations,
	useStudyPlansMaintenance,
} from '../hooks';
import type {
	StudyPlanMaintenanceCreate,
	StudyPlanMaintenanceItem,
	StudyPlanMaintenanceUpdate,
} from '../types';
import { StudyPlanCreateDialog, StudyPlanEditDialog } from '@/modules';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

export function StudyPlanMasterList({ onView }: { onView: (studyPlanId: number) => void }) {
	const { t, locale } = useI18n();
	const { modalityTypeId } = useABET();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const { data: programs = [] } = useProgramsByModality(modalityTypeId);

	const [programId, setProgramId] = useState<number | null>(null);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [editing, setEditing] = useState<StudyPlanMaintenanceItem | null>(null);
	const [editError, setEditError] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<StudyPlanMaintenanceItem | null>(null);
	const [blockedReasons, setBlockedReasons] = useState<string[] | null>(null);

	const { create, update, remove } = useStudyPlanMaintenanceMutations();

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

	useEffect(() => {
		/* eslint-disable react-hooks/set-state-in-effect -- reset paging and program filter when the external modality type changes */
		setPage(1);
		setProgramId(null);
		/* eslint-enable react-hooks/set-state-in-effect */
	}, [modalityTypeId]);

	const { data, isLoading, isFetching, isError } = useStudyPlansMaintenance({
		modalityTypeId,
		programId,
		page,
		pageSize: PAGE_SIZE,
		search: debouncedSearch,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const totalPages = data?.totalPages ?? 1;

	const programOptions = useMemo(
		() =>
			programs.map((program) => ({
				value: program.id,
				label: localized(program.name, locale) || program.code,
			})),
		[programs, locale],
	);
	const selectedProgram = programOptions.find((option) => option.value === programId) ?? null;

	const handleCreate = async (body: StudyPlanMaintenanceCreate) => {
		setCreateError(null);
		try {
			await create.mutateAsync(body);
			showToast('loads.studyPlansMaintenance.toast.created', 'success');
			setCreating(false);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setCreateError(
				tryTranslate(
					t,
					reason ?? getErrorMessage(error, 'loads.studyPlansMaintenance.create.error'),
				),
			);
		}
	};

	const handleSaveEdit = async (body: StudyPlanMaintenanceUpdate) => {
		if (!editing) return;
		setEditError(null);
		try {
			await update.mutateAsync({ id: editing.id, body });
			showToast('loads.studyPlansMaintenance.toast.updated', 'success');
			setEditing(null);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setEditError(
				tryTranslate(t, reason ?? getErrorMessage(error, 'loads.studyPlansMaintenance.edit.error')),
			);
		}
	};

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		try {
			await remove.mutateAsync(pendingDelete.id);
			showToast('loads.studyPlansMaintenance.toast.deleted', 'success');
			setPendingDelete(null);
		} catch (error) {
			const reasons = getApiErrorReasons(error);
			setPendingDelete(null);
			if (reasons.length > 0) {
				setBlockedReasons(reasons);
			} else {
				showToast(getErrorMessage(error, 'loads.studyPlansMaintenance.delete.error'), 'error');
			}
		}
	};

	const openEdit = (item: StudyPlanMaintenanceItem) => {
		setEditError(null);
		setEditing(item);
	};

	const noModalitySelected = modalityTypeId == null;

	const columns = useMemo<ColumnDef<StudyPlanMaintenanceItem>[]>(
		() => [
			{
				accessorKey: 'code',
				header: t('loads.studyPlansMaintenance.col.code'),
				meta: { cellClassName: 'font-mono text-zinc-800' },
			},
			{
				id: 'program',
				header: t('loads.studyPlansMaintenance.col.program'),
				meta: { cellClassName: 'text-zinc-700' },
				cell: ({ row }) => localized(row.original.programName, locale),
			},
			{
				id: 'actions',
				header: t('loads.studyPlansMaintenance.col.actions'),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							onClick={() => onView(row.original.id)}
							aria-label={t('loads.studyPlansMaintenance.actions.view')}
							title={t('loads.studyPlansMaintenance.actions.view')}>
							<EyeIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							onClick={() => openEdit(row.original)}
							aria-label={t('loads.studyPlansMaintenance.actions.edit')}
							title={t('loads.studyPlansMaintenance.actions.edit')}>
							<PencilSquareIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setPendingDelete(row.original)}
							aria-label={t('loads.studyPlansMaintenance.actions.delete')}
							title={t('loads.studyPlansMaintenance.actions.delete')}>
							<TrashIcon className="h-5 w-5" />
						</Button>
					</div>
				),
			},
		],
		[t, locale, onView],
	);

	return (
		<Card>
			<div className="space-y-5">
				<div className="space-y-1">
					<Title
						title={t('loads.studyPlansMaintenance.title')}
						className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
					/>
					<SubTitle
						name={t('loads.studyPlansMaintenance.subtitle')}
						className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
					/>
				</div>

				<div className="w-full sm:max-w-xs">
					<Select
						name="program"
						label={t('loads.studyPlansMaintenance.programLabel')}
						placeholder={t('loads.studyPlansMaintenance.programPlaceholder')}
						isSearchable
						isClearable
						isDisabled={noModalitySelected}
						options={programOptions}
						value={selectedProgram}
						onChange={(_name, value) =>
							handleProgramChange(value && !Array.isArray(value) ? Number(value.value) : null)
						}
					/>
				</div>

				<DataTable
					columns={columns}
					data={items}
					searchPlaceholder={t('loads.studyPlansMaintenance.searchPlaceholder')}
					searchValue={search}
					onSearchChange={handleSearchChange}
					aria-label={t('loads.studyPlansMaintenance.title')}
					isLoading={isLoading}
					errorMessage={isError ? t('loads.studyPlansMaintenance.error.loadFailed') : undefined}
					emptyMessage={
						noModalitySelected
							? t('loads.studyPlansMaintenance.selectModality')
							: t('loads.studyPlansMaintenance.empty.title')
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
							label: t('loads.studyPlansMaintenance.actions.new'),
							onClick: () => {
								setCreateError(null);
								setCreating(true);
							},
							icon: <PlusIcon className="h-4 w-4" />,
							buttonProps: { variant: 'primary', disabled: noModalitySelected },
						},
					]}
				/>
			</div>

			{creating && (
				<StudyPlanCreateDialog
					programs={programs}
					saving={create.isPending}
					errorMessage={createError}
					onClose={() => setCreating(false)}
					onCreate={handleCreate}
				/>
			)}

			{editing && (
				<StudyPlanEditDialog
					item={editing}
					programs={programs}
					saving={update.isPending}
					errorMessage={editError}
					onClose={() => setEditing(null)}
					onSave={handleSaveEdit}
				/>
			)}

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('loads.studyPlansMaintenance.delete.title')}
				message={t('loads.studyPlansMaintenance.delete.message')}
				confirmLabel={t('loads.studyPlansMaintenance.actions.delete')}
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
							<DialogTitle>{t('loads.studyPlansMaintenance.delete.blockedTitle')}</DialogTitle>
						</div>
						<DialogDescription>
							{t('loads.studyPlansMaintenance.delete.blockedSubtitle')}
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
