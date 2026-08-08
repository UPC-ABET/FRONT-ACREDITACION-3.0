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
import { useABET, useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants';
import {
	useCampuses,
	useCourseSectionMaintenanceMutations,
	useCourseSectionsMaintenance,
	useProgramsByModality,
	useSectionModalityTypes,
} from '../hooks';
import type {
	CourseSectionMaintenanceCreate,
	CourseSectionMaintenanceItem,
	CourseSectionMaintenanceUpdate,
	ProgramResponse,
} from '../types';
import { SectionCreateDialog, SectionEditDialog } from '@/modules';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

function fullName(firstName: string | null, lastName: string | null): string {
	return [firstName, lastName].filter(Boolean).join(' ');
}

export function SectionsMaintenance() {
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
	const [editing, setEditing] = useState<CourseSectionMaintenanceItem | null>(null);
	const [editError, setEditError] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<CourseSectionMaintenanceItem | null>(null);
	const [blockedReasons, setBlockedReasons] = useState<string[] | null>(null);

	const { data: campuses = [] } = useCampuses();
	const { data: modalityTypes = [] } = useSectionModalityTypes();
	const { create, update, remove } = useCourseSectionMaintenanceMutations();

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- sync paging with external period/modality/search
		setPage(1);
	}, [debouncedSearch, academicPeriodId, modalityTypeId]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- program options are scoped to modality; a stale selection would silently keep filtering by a program from the previous modality
		setProgramId(null);
	}, [modalityTypeId]);

	const handleSearchChange = (value: string) => setSearch(value);

	const handleProgramChange = (value: number | null) => {
		setProgramId(value);
		setPage(1);
	};

	const { data, isLoading, isFetching, isError } = useCourseSectionsMaintenance({
		academicPeriodId,
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
			programs.map((program: ProgramResponse) => ({
				value: program.id,
				label: localized(program.name, locale) || program.code,
			})),
		[programs, locale],
	);
	const selectedProgram = programOptions.find((option) => option.value === programId) ?? null;

	const handleCreate = async (body: CourseSectionMaintenanceCreate) => {
		setCreateError(null);
		try {
			await create.mutateAsync(body);
			showToast('loads.sectionsMaintenance.toast.created', 'success');
			setCreating(false);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setCreateError(
				tryTranslate(t, reason ?? getErrorMessage(error, 'loads.sectionsMaintenance.create.error')),
			);
		}
	};

	const handleSaveEdit = async (body: CourseSectionMaintenanceUpdate) => {
		if (!editing) return;
		setEditError(null);
		try {
			await update.mutateAsync({ id: editing.id, body });
			showToast('loads.sectionsMaintenance.toast.updated', 'success');
			setEditing(null);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setEditError(
				tryTranslate(t, reason ?? getErrorMessage(error, 'loads.sectionsMaintenance.edit.error')),
			);
		}
	};

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		try {
			await remove.mutateAsync(pendingDelete.id);
			showToast('loads.sectionsMaintenance.toast.deleted', 'success');
			setPendingDelete(null);
		} catch (error) {
			const reasons = getApiErrorReasons(error);
			setPendingDelete(null);
			if (reasons.length > 0) {
				setBlockedReasons(reasons);
			} else {
				showToast(getErrorMessage(error, 'loads.sectionsMaintenance.delete.error'), 'error');
			}
		}
	};

	const openEdit = (item: CourseSectionMaintenanceItem) => {
		setEditError(null);
		setEditing(item);
	};

	const noPeriodSelected = academicPeriodId == null;

	const columns = useMemo<ColumnDef<CourseSectionMaintenanceItem>[]>(
		() => [
			{
				id: 'courseName',
				header: t('loads.sectionsMaintenance.col.courseName'),
				meta: { cellClassName: 'text-zinc-800' },
				cell: ({ row }) => localized(row.original.courseName, locale),
			},
			{
				accessorKey: 'courseCode',
				header: t('loads.sectionsMaintenance.col.courseCode'),
				meta: { cellClassName: 'font-mono text-zinc-800' },
			},
			{
				accessorKey: 'sectionCode',
				header: t('loads.sectionsMaintenance.col.sectionCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				accessorKey: 'professorCode',
				header: t('loads.sectionsMaintenance.col.professorCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				id: 'professorName',
				header: t('loads.sectionsMaintenance.col.professorName'),
				meta: { cellClassName: 'text-zinc-700' },
				cell: ({ row }) =>
					fullName(row.original.professorFirstName, row.original.professorLastName),
			},
			{
				accessorKey: 'campusCode',
				header: t('loads.sectionsMaintenance.col.campusCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				id: 'modality',
				header: t('loads.sectionsMaintenance.col.modality'),
				meta: { cellClassName: 'text-zinc-700' },
				cell: ({ row }) => localized(row.original.modalityTypeName, locale),
			},
			{
				id: 'actions',
				header: t('loads.sectionsMaintenance.col.actions'),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							onClick={() => openEdit(row.original)}
							aria-label={t('loads.sectionsMaintenance.actions.edit')}
							title={t('loads.sectionsMaintenance.actions.edit')}>
							<PencilSquareIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setPendingDelete(row.original)}
							aria-label={t('loads.sectionsMaintenance.actions.delete')}
							title={t('loads.sectionsMaintenance.actions.delete')}>
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
						title={t('loads.sectionsMaintenance.title')}
						className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
					/>
					<SubTitle
						name={t('loads.sectionsMaintenance.subtitle')}
						className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
					/>
				</div>

				<DataTable
					columns={columns}
					data={items}
					searchPlaceholder={t('loads.sectionsMaintenance.searchPlaceholder')}
					searchValue={search}
					onSearchChange={handleSearchChange}
					filters={
						<div className="w-full sm:w-56">
							<Select
								name="program"
								aria-label={t('loads.sectionsMaintenance.programLabel')}
								placeholder={t('loads.sectionsMaintenance.programPlaceholder')}
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
					aria-label={t('loads.sectionsMaintenance.title')}
					isLoading={isLoading}
					errorMessage={isError ? t('loads.sectionsMaintenance.error.loadFailed') : undefined}
					emptyMessage={
						noPeriodSelected
							? t('loads.sectionsMaintenance.selectPeriod')
							: t('loads.sectionsMaintenance.empty.title')
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
							label: t('loads.sectionsMaintenance.actions.new'),
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
				<SectionCreateDialog
					campuses={campuses}
					modalityTypes={modalityTypes}
					saving={create.isPending}
					errorMessage={createError}
					onClose={() => setCreating(false)}
					onCreate={handleCreate}
				/>
			)}

			{editing && (
				<SectionEditDialog
					item={editing}
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
				title={t('loads.sectionsMaintenance.delete.title')}
				message={t('loads.sectionsMaintenance.delete.message')}
				confirmLabel={t('loads.sectionsMaintenance.actions.delete')}
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
							<DialogTitle>{t('loads.sectionsMaintenance.delete.blockedTitle')}</DialogTitle>
						</div>
						<DialogDescription>
							{t('loads.sectionsMaintenance.delete.blockedSubtitle')}
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
