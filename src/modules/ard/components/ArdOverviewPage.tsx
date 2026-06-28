'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
	Alert,
	Button,
	Card,
	ConfirmDialog,
	DataTable,
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	PageHeader,
	Select,
} from '@/shared/components/ui';
import { getApiErrorReasons } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { useABET, useGlobalAcademicFiltersVisibilityOverride, useI18n } from '@/providers';
import type { I18nText } from '@/shared/types';
import { useCampuses, useProgramsByModality } from '@/modules/academic';
import { useCreateArd, useDeleteArd, useArdMaintenance, useUpdateArd } from '../hooks';
import type { ArdMaintenanceItem } from '../types';

const PAGE_SIZE = 20;

// Prefer the specific backend reason (e.g. `error.ard.duplicateArd` in `data[]`) over the
// generic envelope message.
function resolveErrorKey(error: unknown, fallback: string): string {
	const [reason] = getApiErrorReasons(error);
	if (reason) return reason;
	return error instanceof Error ? error.message : fallback;
}

export function ArdOverviewPage() {
	const { t, locale } = useI18n();
	const router = useRouter();
	const searchParams = useSearchParams();
	const createdCode = searchParams.get('created');
	const { academicPeriodId, modalityTypeId } = useABET();

	useGlobalAcademicFiltersVisibilityOverride({ school: false });

	const [meetingDate, setMeetingDate] = useState('');
	const [campusId, setCampusId] = useState<number | null>(null);
	const [programId, setProgramId] = useState<number | null>(null);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);
	const [submitting, setSubmitting] = useState(false);
	const submittingRef = useRef(false);
	const [editing, setEditing] = useState<ArdMaintenanceItem | null>(null);
	const [editDate, setEditDate] = useState('');
	const [pendingDelete, setPendingDelete] = useState<ArdMaintenanceItem | null>(null);

	const { data: campuses = [] } = useCampuses();
	const { data: programs = [] } = useProgramsByModality(modalityTypeId);
	const createArd = useCreateArd();
	const updateArd = useUpdateArd();
	const deleteArd = useDeleteArd();

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	const maintenanceQuery = useArdMaintenance({
		page,
		pageSize: PAGE_SIZE,
		campusId: campusId ?? undefined,
		programId: programId ?? undefined,
		meetingDate: meetingDate || undefined,
		search: debouncedSearch.trim() || undefined,
	});
	const list = maintenanceQuery.data;
	const rows = list?.items ?? [];

	const localize = (text: I18nText | undefined) => text?.[locale] ?? text?.es ?? text?.en ?? '';

	const campusOptions = campuses.map((campus) => ({
		label: `${campus.code} - ${campus.name[locale] ?? campus.code}`,
		value: campus.id,
	}));
	const programOptions = programs.map((program) => ({
		label: `${program.code} - ${program.name[locale] ?? program.code}`,
		value: program.id,
	}));

	const selectedCampus = campusOptions.find((option) => option.value === campusId) ?? null;
	const selectedProgram = programOptions.find((option) => option.value === programId) ?? null;

	const filtersComplete =
		meetingDate !== '' && campusId !== null && programId !== null && academicPeriodId !== null;

	const handleCreate = async () => {
		// Synchronous ref guard blocks a fast double-click before React re-renders with the
		// pending state, so a single click can never create more than one ARD.
		if (!filtersComplete || submittingRef.current) return;
		submittingRef.current = true;
		setSubmitting(true);

		try {
			const view = await createArd.mutateAsync({
				meetingDate: new Date(meetingDate).toISOString(),
				campusId: campusId as number,
				programId: programId as number,
			});

			// Keep the button blocked while navigating away to fill in the details.
			router.push(`/ard/${view.id}?edit=1`);
		} catch {
			submittingRef.current = false;
			setSubmitting(false);
		}
	};

	const handleSaveEdit = () => {
		if (!editing || editDate === '') return;
		updateArd.mutate(
			{ id: editing.id, body: { meetingDate: new Date(editDate).toISOString() } },
			{ onSuccess: () => setEditing(null) },
		);
	};

	const handleConfirmDelete = () => {
		if (!pendingDelete) return;
		deleteArd.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
	};

	const columns = useMemo<ColumnDef<ArdMaintenanceItem>[]>(
		() => [
			{ accessorKey: 'code', header: t('ard.table.code') },
			{
				id: 'meetingDate',
				header: t('ard.table.meetingDate'),
				cell: ({ row }) => row.original.meetingDate.slice(0, 10),
			},
			{ accessorKey: 'campusCode', header: t('ard.table.campus') },
			{
				id: 'program',
				header: t('ard.table.program'),
				cell: ({ row }) => localize(row.original.programName),
			},
			{ accessorKey: 'detailsCount', header: t('ard.table.details') },
			{
				id: 'createdAt',
				header: t('ard.table.createdAt'),
				cell: ({ row }) => row.original.createdAt.slice(0, 10),
			},
			{
				id: 'actions',
				header: t('ard.table.actions'),
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							title={t('ard.actions.view')}
							aria-label={t('ard.actions.view')}
							onClick={() => router.push(`/ard/${row.original.id}`)}>
							<EyeIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							title={t('ard.actions.edit')}
							aria-label={t('ard.actions.edit')}
							onClick={() => {
								setEditing(row.original);
								setEditDate(row.original.meetingDate.slice(0, 10));
							}}>
							<PencilSquareIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							title={t('ard.actions.delete')}
							aria-label={t('ard.actions.delete')}
							onClick={() => setPendingDelete(row.original)}>
							<TrashIcon className="h-5 w-5" />
						</Button>
					</div>
				),
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps -- localize depends on locale
		[t, locale],
	);

	return (
		<div className="space-y-6">
			<PageHeader title={t('ard.overview.title')} description={t('ard.overview.description')} />

			{createdCode && (
				<Alert variant="success">{t('ard.overview.created').replace('{code}', createdCode)}</Alert>
			)}
			{academicPeriodId === null && (
				<Alert variant="warning">{t('ard.overview.selectPeriod')}</Alert>
			)}
			{createArd.isError && (
				<Alert variant="destructive">
					{tryTranslate(t, resolveErrorKey(createArd.error, 'error.ard.createFailed'))}
				</Alert>
			)}
			{deleteArd.isError && (
				<Alert variant="destructive">
					{tryTranslate(t, resolveErrorKey(deleteArd.error, 'ard.errors.deleteFailed'))}
				</Alert>
			)}

			<Card>
				<div className="grid gap-6 md:grid-cols-3">
					<Input
						type="date"
						label={t('ard.overview.meetingDate')}
						value={meetingDate}
						onChange={(event) => {
							setMeetingDate(event.target.value);
							setPage(1);
						}}
					/>
					<Select
						label={t('ard.overview.campus')}
						value={selectedCampus}
						options={campusOptions}
						isSearchable
						isClearable
						onChange={(_, option) => {
							const selected = Array.isArray(option) ? option[0] : option;
							setCampusId(selected ? Number(selected.value) : null);
							setPage(1);
						}}
					/>
					<Select
						label={t('ard.overview.program')}
						value={selectedProgram}
						options={programOptions}
						isSearchable
						isClearable
						onChange={(_, option) => {
							const selected = Array.isArray(option) ? option[0] : option;
							setProgramId(selected ? Number(selected.value) : null);
							setPage(1);
						}}
					/>
				</div>
			</Card>

			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold text-zinc-900">{t('ard.overview.listTitle')}</h2>
				<Button
					onClick={() => void handleCreate()}
					disabled={!filtersComplete || submitting}
					loading={submitting}>
					<Plus className="h-4 w-4" />
					{t('ard.actions.new')}
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={rows}
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder={t('ard.overview.searchPlaceholder')}
				isLoading={maintenanceQuery.isLoading}
				errorMessage={maintenanceQuery.isError ? t('ard.table.error') : undefined}
				emptyMessage={t('ard.overview.empty')}
				serverPagination={{
					page,
					pageCount: list?.totalPages ?? 1,
					total: list?.total ?? 0,
					onPageChange: setPage,
					isFetching: maintenanceQuery.isFetching,
				}}
				aria-label={t('ard.overview.listTitle')}
			/>

			<Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>{t('ard.overview.edit.title')}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Input
							type="date"
							label={t('ard.overview.meetingDate')}
							value={editDate}
							onChange={(event) => setEditDate(event.target.value)}
						/>
						{updateArd.isError && (
							<p className="text-xs text-red-600">
								{tryTranslate(t, resolveErrorKey(updateArd.error, 'error.ard.updateFailed'))}
							</p>
						)}
					</div>
					<DialogFooter>
						<DialogClose render={<Button variant="surface">{t('ard.actions.cancel')}</Button>} />
						<Button
							onClick={handleSaveEdit}
							disabled={editDate === ''}
							loading={updateArd.isPending}>
							{t('ard.actions.save')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				isOpen={pendingDelete !== null}
				onClose={() => setPendingDelete(null)}
				title={t('ard.overview.delete.title')}
				message={
					pendingDelete
						? t('ard.overview.delete.message').replace('{code}', pendingDelete.code)
						: ''
				}
				confirmLabel={t('ard.actions.delete')}
				declineLabel={t('ard.actions.cancel')}
				onConfirm={handleConfirmDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={deleteArd.isPending}
			/>
		</div>
	);
}
