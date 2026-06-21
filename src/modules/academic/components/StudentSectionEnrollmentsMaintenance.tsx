'use client';

import { useEffect, useMemo, useState } from 'react';
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	MagnifyingGlassIcon,
	PlusIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	ConfirmDialog,
	Select,
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
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
	useProgramsByModality,
	useStudentSectionEnrollmentMaintenanceMutations,
	useStudentSectionEnrollmentsMaintenance,
} from '../hooks';
import type {
	ProgramResponse,
	StudentSectionEnrollmentMaintenanceCreate,
	StudentSectionEnrollmentMaintenanceItem,
	StudentSectionEnrollmentMaintenanceUpdate,
} from '../types';
import {
	StudentSectionEnrollmentCreateDialog,
	StudentSectionEnrollmentEditDialog,
} from '@/modules';
import {
	StudentSectionEnrollmentCard,
	StudentSectionEnrollmentRow,
} from './StudentSectionEnrollmentRow';
import { StudentSectionEnrollmentBlockedDialog } from './StudentSectionEnrollmentBlockedDialog';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

export function StudentSectionEnrollmentsMaintenance() {
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
	const [editing, setEditing] = useState<StudentSectionEnrollmentMaintenanceItem | null>(null);
	const [editError, setEditError] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] =
		useState<StudentSectionEnrollmentMaintenanceItem | null>(null);
	const [blockedReasons, setBlockedReasons] = useState<string[] | null>(null);

	const { create, update, remove } = useStudentSectionEnrollmentMaintenanceMutations();

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
		setPage(1);
	}, [academicPeriodId]);

	const { data, isLoading, isFetching, isError, refetch } = useStudentSectionEnrollmentsMaintenance(
		{
			academicPeriodId,
			programId,
			page,
			pageSize: PAGE_SIZE,
			search: debouncedSearch,
		},
	);

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

	const handleCreate = async (body: StudentSectionEnrollmentMaintenanceCreate) => {
		setCreateError(null);
		try {
			await create.mutateAsync(body);
			showToast('loads.studentSectionEnrollmentsMaintenance.toast.created', 'success');
			setCreating(false);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setCreateError(
				tryTranslate(
					t,
					reason ??
						getErrorMessage(error, 'loads.studentSectionEnrollmentsMaintenance.create.error'),
				),
			);
		}
	};

	const handleSaveEdit = async (body: StudentSectionEnrollmentMaintenanceUpdate) => {
		if (!editing) return;
		setEditError(null);
		try {
			await update.mutateAsync({ id: editing.id, body });
			showToast('loads.studentSectionEnrollmentsMaintenance.toast.updated', 'success');
			setEditing(null);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setEditError(
				tryTranslate(
					t,
					reason ?? getErrorMessage(error, 'loads.studentSectionEnrollmentsMaintenance.edit.error'),
				),
			);
		}
	};

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		try {
			await remove.mutateAsync(pendingDelete.id);
			showToast('loads.studentSectionEnrollmentsMaintenance.toast.deleted', 'success');
			setPendingDelete(null);
		} catch (error) {
			const reasons = getApiErrorReasons(error);
			setPendingDelete(null);
			if (reasons.length > 0) {
				setBlockedReasons(reasons);
			} else {
				showToast(
					getErrorMessage(error, 'loads.studentSectionEnrollmentsMaintenance.delete.error'),
					'error',
				);
			}
		}
	};

	const openEdit = (item: StudentSectionEnrollmentMaintenanceItem) => {
		setEditError(null);
		setEditing(item);
	};

	const editLabel = t('loads.studentSectionEnrollmentsMaintenance.actions.edit');
	const deleteLabel = t('loads.studentSectionEnrollmentsMaintenance.actions.delete');

	const noPeriodSelected = academicPeriodId == null;

	return (
		<Card>
			<div className="space-y-5">
				<div className="space-y-1">
					<Title
						title={t('loads.studentSectionEnrollmentsMaintenance.title')}
						className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
					/>
					<SubTitle
						name={t('loads.studentSectionEnrollmentsMaintenance.subtitle')}
						className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
					/>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div className="w-full sm:max-w-xs">
						<Select
							name="program"
							label={t('loads.studentSectionEnrollmentsMaintenance.programLabel')}
							placeholder={t('loads.studentSectionEnrollmentsMaintenance.programPlaceholder')}
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
					<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
						<div className="relative w-full sm:max-w-xs">
							<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
							<input
								type="search"
								value={search}
								onChange={(event) => handleSearchChange(event.target.value)}
								placeholder={t('loads.studentSectionEnrollmentsMaintenance.searchPlaceholder')}
								aria-label={t('loads.studentSectionEnrollmentsMaintenance.searchPlaceholder')}
								disabled={noPeriodSelected}
								className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-zinc-50 disabled:text-zinc-400"
							/>
						</div>
						<Button
							variant="primary"
							size="sm"
							className="w-full sm:w-auto"
							disabled={noPeriodSelected}
							onClick={() => {
								setCreateError(null);
								setCreating(true);
							}}>
							<PlusIcon className="h-4 w-4" />
							<span>{t('loads.studentSectionEnrollmentsMaintenance.actions.new')}</span>
						</Button>
					</div>
				</div>

				{noPeriodSelected ? (
					<div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
						<p className="text-sm text-zinc-500">
							{t('loads.studentSectionEnrollmentsMaintenance.selectPeriod')}
						</p>
					</div>
				) : isError ? (
					<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
						<p className="text-sm text-zinc-500">
							{t('loads.studentSectionEnrollmentsMaintenance.error.loadFailed')}
						</p>
						<Button variant="surface" size="sm" onClick={() => refetch()}>
							{t('loads.studentSectionEnrollmentsMaintenance.retry')}
						</Button>
					</div>
				) : isLoading ? (
					<div className="space-y-2" aria-busy>
						{Array.from({ length: 6 }).map((_, index) => (
							<div key={index} className="h-12 animate-pulse rounded-lg bg-zinc-100" />
						))}
					</div>
				) : items.length === 0 ? (
					<div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
						<p className="text-sm font-medium text-zinc-700">
							{t('loads.studentSectionEnrollmentsMaintenance.empty.title')}
						</p>
						<p className="text-sm text-zinc-500">
							{t('loads.studentSectionEnrollmentsMaintenance.empty.subtitle')}
						</p>
					</div>
				) : (
					<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
						<div className="hidden overflow-x-auto md:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t('loads.studentSectionEnrollmentsMaintenance.col.courseName')}
										</TableHead>
										<TableHead>
											{t('loads.studentSectionEnrollmentsMaintenance.col.courseCode')}
										</TableHead>
										<TableHead>
											{t('loads.studentSectionEnrollmentsMaintenance.col.sectionCode')}
										</TableHead>
										<TableHead>
											{t('loads.studentSectionEnrollmentsMaintenance.col.studentCode')}
										</TableHead>
										<TableHead>
											{t('loads.studentSectionEnrollmentsMaintenance.col.studentName')}
										</TableHead>
										<TableHead className="text-right">
											{t('loads.studentSectionEnrollmentsMaintenance.col.actions')}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map((item) => (
										<StudentSectionEnrollmentRow
											key={item.id}
											item={item}
											locale={locale}
											editLabel={editLabel}
											deleteLabel={deleteLabel}
											onEdit={openEdit}
											onDelete={setPendingDelete}
										/>
									))}
								</TableBody>
							</Table>
						</div>

						<ul className="space-y-3 md:hidden">
							{items.map((item) => (
								<StudentSectionEnrollmentCard
									key={item.id}
									item={item}
									locale={locale}
									editLabel={editLabel}
									deleteLabel={deleteLabel}
									onEdit={openEdit}
									onDelete={setPendingDelete}
								/>
							))}
						</ul>
					</div>
				)}

				{!noPeriodSelected && !isLoading && !isError && items.length > 0 && (
					<div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs text-zinc-500">
							{total} {t('loads.studentSectionEnrollmentsMaintenance.results')}
						</p>
						<div className="flex items-center justify-center gap-3">
							<Button
								variant="surface"
								size="sm"
								disabled={page <= 1 || isFetching}
								onClick={() => setPage((current) => Math.max(1, current - 1))}
								aria-label={t('loads.studentSectionEnrollmentsMaintenance.prev')}>
								<ChevronLeftIcon className="h-4 w-4" />
							</Button>
							<span className="text-sm text-zinc-600">
								{t('loads.studentSectionEnrollmentsMaintenance.page')} {page} / {totalPages}
							</span>
							<Button
								variant="surface"
								size="sm"
								disabled={page >= totalPages || isFetching}
								onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
								aria-label={t('loads.studentSectionEnrollmentsMaintenance.next')}>
								<ChevronRightIcon className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{creating && (
				<StudentSectionEnrollmentCreateDialog
					saving={create.isPending}
					errorMessage={createError}
					onClose={() => setCreating(false)}
					onCreate={handleCreate}
				/>
			)}

			{editing && (
				<StudentSectionEnrollmentEditDialog
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
				title={t('loads.studentSectionEnrollmentsMaintenance.delete.title')}
				message={t('loads.studentSectionEnrollmentsMaintenance.delete.message')}
				confirmLabel={t('loads.studentSectionEnrollmentsMaintenance.actions.delete')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirmDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={remove.isPending}
			/>

			<StudentSectionEnrollmentBlockedDialog
				reasons={blockedReasons}
				onOpenChange={(open) => {
					if (!open) setBlockedReasons(null);
				}}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</Card>
	);
}
