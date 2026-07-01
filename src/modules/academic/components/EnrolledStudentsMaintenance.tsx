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
} from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants';
import {
	useCampuses,
	useEnrolledStudentMaintenanceMutations,
	useEnrolledStudentsMaintenance,
	useProgramsByModality,
	useSectionModalityTypes,
} from '../hooks';
import type {
	EnrolledStudentMaintenanceCreate,
	EnrolledStudentMaintenanceItem,
	EnrolledStudentMaintenanceUpdate,
	ProgramResponse,
} from '../types';
import { EnrolledStudentCreateDialog, EnrolledStudentMaintenanceEditDialog } from '@/modules';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

export function EnrolledStudentsMaintenance() {
	const { t, locale } = useI18n();
	const { academicPeriodId, modalityTypeId } = useABET();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const { data: programs = [] } = useProgramsByModality(modalityTypeId);
	const { data: campuses = [] } = useCampuses();
	const { data: modalityTypes = [] } = useSectionModalityTypes();

	const [programId, setProgramId] = useState<number | null>(null);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [editing, setEditing] = useState<EnrolledStudentMaintenanceItem | null>(null);
	const [editError, setEditError] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<EnrolledStudentMaintenanceItem | null>(null);
	const [blockedReasons, setBlockedReasons] = useState<string[] | null>(null);

	const { create, update, remove } = useEnrolledStudentMaintenanceMutations();

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
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging to the first page when the external academic period changes
		setPage(1);
	}, [academicPeriodId]);

	const { data, isLoading, isFetching, isError } = useEnrolledStudentsMaintenance({
		academicPeriodId,
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
			programs.map((program: ProgramResponse) => ({
				value: program.id,
				label: localized(program.name, locale) || program.code,
			})),
		[programs, locale],
	);
	const selectedProgram = programOptions.find((option) => option.value === programId) ?? null;

	const handleCreate = async (body: EnrolledStudentMaintenanceCreate) => {
		setCreateError(null);
		try {
			await create.mutateAsync(body);
			showToast('loads.enrolledStudentsMaintenance.toast.created', 'success');
			setCreating(false);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setCreateError(
				tryTranslate(
					t,
					reason ?? getErrorMessage(error, 'loads.enrolledStudentsMaintenance.create.error'),
				),
			);
		}
	};

	const handleSaveEdit = async (body: EnrolledStudentMaintenanceUpdate) => {
		if (!editing) return;
		setEditError(null);
		try {
			await update.mutateAsync({ id: editing.id, body });
			showToast('loads.enrolledStudentsMaintenance.toast.updated', 'success');
			setEditing(null);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setEditError(
				tryTranslate(
					t,
					reason ?? getErrorMessage(error, 'loads.enrolledStudentsMaintenance.edit.error'),
				),
			);
		}
	};

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		try {
			await remove.mutateAsync(pendingDelete.id);
			showToast('loads.enrolledStudentsMaintenance.toast.deleted', 'success');
			setPendingDelete(null);
		} catch (error) {
			const reasons = getApiErrorReasons(error);
			setPendingDelete(null);
			if (reasons.length > 0) {
				setBlockedReasons(reasons);
			} else {
				showToast(
					getErrorMessage(error, 'loads.enrolledStudentsMaintenance.delete.error'),
					'error',
				);
			}
		}
	};

	const openEdit = (item: EnrolledStudentMaintenanceItem) => {
		setEditError(null);
		setEditing(item);
	};

	const noPeriodSelected = academicPeriodId == null;

	const columns = useMemo<ColumnDef<EnrolledStudentMaintenanceItem>[]>(
		() => [
			{
				accessorKey: 'studentCode',
				header: t('loads.enrolledStudentsMaintenance.col.studentCode'),
				meta: { cellClassName: 'font-mono text-zinc-800' },
			},
			{
				accessorKey: 'firstName',
				header: t('loads.enrolledStudentsMaintenance.col.firstName'),
				meta: { cellClassName: 'text-zinc-700' },
			},
			{
				accessorKey: 'lastName',
				header: t('loads.enrolledStudentsMaintenance.col.lastName'),
				meta: { cellClassName: 'text-zinc-700' },
			},
			{
				id: 'campus',
				header: t('loads.enrolledStudentsMaintenance.col.campus'),
				meta: { cellClassName: 'text-zinc-700' },
				cell: ({ row }) => localized(row.original.campusName, locale),
			},
			{
				id: 'program',
				header: t('loads.enrolledStudentsMaintenance.col.program'),
				meta: { cellClassName: 'text-zinc-700' },
				cell: ({ row }) => localized(row.original.programName, locale),
			},
			{
				id: 'modality',
				header: t('loads.enrolledStudentsMaintenance.col.modality'),
				meta: { cellClassName: 'text-zinc-700' },
				cell: ({ row }) => localized(row.original.modalityTypeName, locale),
			},
			{
				id: 'actions',
				header: t('loads.enrolledStudentsMaintenance.col.actions'),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							onClick={() => openEdit(row.original)}
							aria-label={t('loads.enrolledStudentsMaintenance.actions.edit')}
							title={t('loads.enrolledStudentsMaintenance.actions.edit')}>
							<PencilSquareIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setPendingDelete(row.original)}
							aria-label={t('loads.enrolledStudentsMaintenance.actions.delete')}
							title={t('loads.enrolledStudentsMaintenance.actions.delete')}>
							<TrashIcon className="h-5 w-5" />
						</Button>
					</div>
				),
			},
		],
		[t, locale],
	);

	return (
		<Card>
			<div className="space-y-5">
				<div className="space-y-1">
					<Title
						title={t('loads.enrolledStudentsMaintenance.title')}
						className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
					/>
					<SubTitle
						name={t('loads.enrolledStudentsMaintenance.subtitle')}
						className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
					/>
				</div>

				<DataTable
					columns={columns}
					data={items}
					searchPlaceholder={t('loads.enrolledStudentsMaintenance.searchPlaceholder')}
					searchValue={search}
					onSearchChange={handleSearchChange}
					filters={
						<div className="w-full sm:w-56">
							<Select
								name="program"
								aria-label={t('loads.enrolledStudentsMaintenance.programLabel')}
								placeholder={t('loads.enrolledStudentsMaintenance.programPlaceholder')}
								isSearchable
								isClearable
								isDisabled={noPeriodSelected}
								options={programOptions}
								value={selectedProgram}
								onChange={(_name, value) =>
									handleProgramChange(value && !Array.isArray(value) ? Number(value.value) : null)
								}
							/>
						</div>
					}
					aria-label={t('loads.enrolledStudentsMaintenance.title')}
					isLoading={isLoading}
					errorMessage={
						isError ? t('loads.enrolledStudentsMaintenance.error.loadFailed') : undefined
					}
					emptyMessage={
						noPeriodSelected
							? t('loads.enrolledStudentsMaintenance.selectPeriod')
							: t('loads.enrolledStudentsMaintenance.empty.title')
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
							label: t('loads.enrolledStudentsMaintenance.actions.new'),
							onClick: () => {
								setCreateError(null);
								setCreating(true);
							},
							icon: <PlusIcon className="h-4 w-4" />,
							buttonProps: { variant: 'primary', disabled: noPeriodSelected },
						},
					]}
				/>
			</div>

			{creating && (
				<EnrolledStudentCreateDialog
					programs={programs}
					campuses={campuses}
					modalityTypes={modalityTypes}
					saving={create.isPending}
					errorMessage={createError}
					onClose={() => setCreating(false)}
					onCreate={handleCreate}
				/>
			)}

			{editing && (
				<EnrolledStudentMaintenanceEditDialog
					item={editing}
					programs={programs}
					campuses={campuses}
					modalityTypes={modalityTypes}
					saving={update.isPending}
					errorMessage={editError}
					onClose={() => setEditing(null)}
					onSave={handleSaveEdit}
				/>
			)}

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('loads.enrolledStudentsMaintenance.delete.title')}
				message={t('loads.enrolledStudentsMaintenance.delete.message')}
				confirmLabel={t('loads.enrolledStudentsMaintenance.actions.delete')}
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
							<DialogTitle>
								{t('loads.enrolledStudentsMaintenance.delete.blockedTitle')}
							</DialogTitle>
						</div>
						<DialogDescription>
							{t('loads.enrolledStudentsMaintenance.delete.blockedSubtitle')}
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
