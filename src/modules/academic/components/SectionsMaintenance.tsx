'use client';

import { useEffect, useState } from 'react';
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ExclamationTriangleIcon,
	MagnifyingGlassIcon,
	PencilSquareIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	ConfirmDialog,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Toast,
} from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib/apiError';
import { tryTranslate } from '@/shared/utils';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants';
import {
	useCampuses,
	useCourseSectionMaintenanceMutations,
	useCourseSectionsMaintenance,
	useSectionModalityTypes,
} from '../hooks';
import type {
	CourseSectionMaintenanceCreate,
	CourseSectionMaintenanceItem,
	CourseSectionMaintenanceUpdate,
} from '../types';
import { SectionCreateDialog } from './SectionCreateDialog';
import { SectionEditDialog } from './SectionEditDialog';

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
			<Button variant="ghost" size="icon" onClick={onEdit} aria-label={editLabel} title={editLabel}>
				<PencilSquareIcon className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="text-red-600 hover:bg-red-50"
				onClick={onDelete}
				aria-label={deleteLabel}
				title={deleteLabel}>
				<TrashIcon className="h-4 w-4" />
			</Button>
		</div>
	);
}

export function SectionsMaintenance() {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const { toast, showToast, clearToast } = useApiErrorToast();

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
		// eslint-disable-next-line react-hooks/set-state-in-effect -- sync paging with external period/search
		setPage(1);
	}, [debouncedSearch, academicPeriodId]);

	const handleSearchChange = (value: string) => setSearch(value);

	const { data, isLoading, isFetching, isError, refetch } = useCourseSectionsMaintenance({
		academicPeriodId,
		page,
		pageSize: PAGE_SIZE,
		search: debouncedSearch,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const totalPages = data?.totalPages ?? 1;

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

	const editLabel = t('loads.sectionsMaintenance.actions.edit');
	const deleteLabel = t('loads.sectionsMaintenance.actions.delete');

	return (
		<Card>
			<div className="space-y-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div className="space-y-1">
						<h2 className="text-lg font-semibold text-gray-900">
							{t('loads.sectionsMaintenance.title')}
						</h2>
						<p className="text-sm text-gray-500">{t('loads.sectionsMaintenance.subtitle')}</p>
					</div>
					<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
						<div className="relative w-full sm:max-w-xs">
							<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
							<input
								type="search"
								value={search}
								onChange={(event) => handleSearchChange(event.target.value)}
								placeholder={t('loads.sectionsMaintenance.searchPlaceholder')}
								aria-label={t('loads.sectionsMaintenance.searchPlaceholder')}
								disabled={academicPeriodId == null}
								className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-zinc-50 disabled:text-zinc-400"
							/>
						</div>
						<Button
							variant="primary"
							size="sm"
							className="w-full sm:w-auto"
							disabled={academicPeriodId == null}
							onClick={() => {
								setCreateError(null);
								setCreating(true);
							}}>
							<PlusIcon className="h-4 w-4" />
							<span>{t('loads.sectionsMaintenance.actions.new')}</span>
						</Button>
					</div>
				</div>

				{academicPeriodId == null ? (
					<div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
						<p className="text-sm text-zinc-500">{t('loads.sectionsMaintenance.selectPeriod')}</p>
					</div>
				) : isError ? (
					<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
						<p className="text-sm text-zinc-500">
							{t('loads.sectionsMaintenance.error.loadFailed')}
						</p>
						<Button variant="surface" size="sm" onClick={() => refetch()}>
							{t('loads.sectionsMaintenance.retry')}
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
							{t('loads.sectionsMaintenance.empty.title')}
						</p>
						<p className="text-sm text-zinc-500">{t('loads.sectionsMaintenance.empty.subtitle')}</p>
					</div>
				) : (
					<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
						<div className="hidden overflow-x-auto md:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t('loads.sectionsMaintenance.col.courseCode')}</TableHead>
										<TableHead>{t('loads.sectionsMaintenance.col.sectionCode')}</TableHead>
										<TableHead>{t('loads.sectionsMaintenance.col.professorCode')}</TableHead>
										<TableHead>{t('loads.sectionsMaintenance.col.campusCode')}</TableHead>
										<TableHead>{t('loads.sectionsMaintenance.col.modality')}</TableHead>
										<TableHead className="text-right">
											{t('loads.sectionsMaintenance.col.actions')}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="font-mono text-zinc-800">{item.courseCode}</TableCell>
											<TableCell className="font-mono text-zinc-700">{item.sectionCode}</TableCell>
											<TableCell className="font-mono text-zinc-700">
												{item.professorCode}
											</TableCell>
											<TableCell className="font-mono text-zinc-700">{item.campusCode}</TableCell>
											<TableCell className="text-zinc-700">
												{localized(item.modalityTypeName, locale)}
											</TableCell>
											<TableCell>
												<RowActions
													onEdit={() => openEdit(item)}
													onDelete={() => setPendingDelete(item)}
													editLabel={editLabel}
													deleteLabel={deleteLabel}
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						<ul className="space-y-3 md:hidden">
							{items.map((item) => (
								<li
									key={item.id}
									className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 space-y-1">
											<p className="flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-500">
												<span className="text-zinc-800">{item.courseCode}</span>
												<span>·</span>
												<span>{item.sectionCode}</span>
											</p>
											<p className="text-sm text-zinc-600">
												{item.professorCode} · {item.campusCode}
											</p>
											<p className="text-sm text-zinc-500">
												{localized(item.modalityTypeName, locale)}
											</p>
										</div>
										<div className="shrink-0">
											<RowActions
												onEdit={() => openEdit(item)}
												onDelete={() => setPendingDelete(item)}
												editLabel={editLabel}
												deleteLabel={deleteLabel}
											/>
										</div>
									</div>
								</li>
							))}
						</ul>
					</div>
				)}

				{academicPeriodId != null && !isLoading && !isError && items.length > 0 && (
					<div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs text-zinc-500">
							{total} {t('loads.sectionsMaintenance.results')}
						</p>
						<div className="flex items-center justify-center gap-3">
							<Button
								variant="surface"
								size="sm"
								disabled={page <= 1 || isFetching}
								onClick={() => setPage((current) => Math.max(1, current - 1))}
								aria-label={t('loads.sectionsMaintenance.prev')}>
								<ChevronLeftIcon className="h-4 w-4" />
							</Button>
							<span className="text-sm text-zinc-600">
								{t('loads.sectionsMaintenance.page')} {page} / {totalPages}
							</span>
							<Button
								variant="surface"
								size="sm"
								disabled={page >= totalPages || isFetching}
								onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
								aria-label={t('loads.sectionsMaintenance.next')}>
								<ChevronRightIcon className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
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
