'use client';

import { useEffect, useState } from 'react';
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	MagnifyingGlassIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	ConfirmDialog,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	SubTitle,
	Title,
	Toast,
} from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { useClassRepresentativeMutations, useClassRepresentativesMaintenance } from '../hooks';
import type { ClassRepresentativeMaintenanceItem } from '../types';
import { ClassRepresentativeCreateDialog } from './ClassRepresentativeCreateDialog';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

export function ClassRepresentativesMaintenance() {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [pendingRemove, setPendingRemove] = useState<ClassRepresentativeMaintenanceItem | null>(
		null,
	);

	const { assign, remove } = useClassRepresentativeMutations();

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging to the first page when the external academic period changes
		setPage(1);
	}, [academicPeriodId]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	const { data, isLoading, isFetching, isError, refetch } = useClassRepresentativesMaintenance({
		academicPeriodId,
		page,
		pageSize: PAGE_SIZE,
		search: debouncedSearch,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const totalPages = data?.totalPages ?? 1;

	const handleAssign = async (body: { sectionCode: string; studentCode: string }) => {
		setCreateError(null);
		try {
			await assign.mutateAsync(body);
			showToast('loads.classRepresentativesMaintenance.toast.assigned', 'success');
			setCreating(false);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setCreateError(
				tryTranslate(
					t,
					reason ?? getErrorMessage(error, 'loads.classRepresentativesMaintenance.create.error'),
				),
			);
		}
	};

	const handleConfirmRemove = async () => {
		if (!pendingRemove) return;
		try {
			await remove.mutateAsync({
				studentCode: pendingRemove.studentCode,
				sectionCode: pendingRemove.sectionCode,
			});
			showToast('loads.classRepresentativesMaintenance.toast.removed', 'success');
			setPendingRemove(null);
		} catch (error) {
			setPendingRemove(null);
			showToast(
				getErrorMessage(error, 'loads.classRepresentativesMaintenance.remove.error'),
				'error',
			);
		}
	};

	const removeLabel = t('loads.classRepresentativesMaintenance.actions.remove');
	const noPeriodSelected = academicPeriodId == null;

	return (
		<Card>
			<div className="space-y-5">
				<div className="space-y-1">
					<Title
						title={t('loads.classRepresentativesMaintenance.title')}
						className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
					/>
					<SubTitle
						name={t('loads.classRepresentativesMaintenance.subtitle')}
						className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
					/>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div className="relative w-full sm:max-w-xs">
						<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
						<input
							type="search"
							value={search}
							onChange={(event) => handleSearchChange(event.target.value)}
							placeholder={t('loads.classRepresentativesMaintenance.searchPlaceholder')}
							aria-label={t('loads.classRepresentativesMaintenance.searchPlaceholder')}
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
						<span>{t('loads.classRepresentativesMaintenance.actions.new')}</span>
					</Button>
				</div>

				{noPeriodSelected ? (
					<div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
						<p className="text-sm text-zinc-500">
							{t('loads.classRepresentativesMaintenance.selectPeriod')}
						</p>
					</div>
				) : isError ? (
					<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
						<p className="text-sm text-zinc-500">
							{t('loads.classRepresentativesMaintenance.error.loadFailed')}
						</p>
						<Button variant="surface" size="sm" onClick={() => refetch()}>
							{t('loads.classRepresentativesMaintenance.retry')}
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
							{t('loads.classRepresentativesMaintenance.empty.title')}
						</p>
						<p className="text-sm text-zinc-500">
							{t('loads.classRepresentativesMaintenance.empty.subtitle')}
						</p>
					</div>
				) : (
					<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
						<div className="hidden overflow-x-auto md:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t('loads.classRepresentativesMaintenance.col.courseName')}
										</TableHead>
										<TableHead>
											{t('loads.classRepresentativesMaintenance.col.courseCode')}
										</TableHead>
										<TableHead>
											{t('loads.classRepresentativesMaintenance.col.sectionCode')}
										</TableHead>
										<TableHead>
											{t('loads.classRepresentativesMaintenance.col.studentCode')}
										</TableHead>
										<TableHead>
											{t('loads.classRepresentativesMaintenance.col.studentName')}
										</TableHead>
										<TableHead className="text-right">
											{t('loads.classRepresentativesMaintenance.col.actions')}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{items.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="font-medium text-zinc-900">
												{localized(item.courseName, locale)}
											</TableCell>
											<TableCell className="font-mono text-zinc-700">{item.courseCode}</TableCell>
											<TableCell className="font-mono text-zinc-700">{item.sectionCode}</TableCell>
											<TableCell className="font-mono text-zinc-700">{item.studentCode}</TableCell>
											<TableCell className="text-zinc-700">
												{item.studentFirstName} {item.studentLastName}
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-end">
													<Button
														variant="ghost"
														size="icon"
														className="text-red-600 hover:bg-red-50"
														onClick={() => setPendingRemove(item)}
														aria-label={removeLabel}
														title={removeLabel}>
														<TrashIcon className="h-4 w-4" />
													</Button>
												</div>
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
											<p className="truncate font-medium text-zinc-900">
												{localized(item.courseName, locale)}
											</p>
											<p className="font-mono text-xs text-zinc-400">
												{item.courseCode} · {item.sectionCode}
											</p>
											<p className="text-sm text-zinc-500">
												{item.studentFirstName} {item.studentLastName}
											</p>
											<p className="font-mono text-xs text-zinc-400">{item.studentCode}</p>
										</div>
										<div className="shrink-0">
											<Button
												variant="ghost"
												size="icon"
												className="text-red-600 hover:bg-red-50"
												onClick={() => setPendingRemove(item)}
												aria-label={removeLabel}
												title={removeLabel}>
												<TrashIcon className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</li>
							))}
						</ul>
					</div>
				)}

				{!noPeriodSelected && !isLoading && !isError && items.length > 0 && (
					<div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs text-zinc-500">
							{total} {t('loads.classRepresentativesMaintenance.results')}
						</p>
						<div className="flex items-center justify-center gap-3">
							<Button
								variant="surface"
								size="sm"
								disabled={page <= 1 || isFetching}
								onClick={() => setPage((current) => Math.max(1, current - 1))}
								aria-label={t('loads.classRepresentativesMaintenance.prev')}>
								<ChevronLeftIcon className="h-4 w-4" />
							</Button>
							<span className="text-sm text-zinc-600">
								{t('loads.classRepresentativesMaintenance.page')} {page} / {totalPages}
							</span>
							<Button
								variant="surface"
								size="sm"
								disabled={page >= totalPages || isFetching}
								onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
								aria-label={t('loads.classRepresentativesMaintenance.next')}>
								<ChevronRightIcon className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{creating && (
				<ClassRepresentativeCreateDialog
					saving={assign.isPending}
					errorMessage={createError}
					onClose={() => setCreating(false)}
					onSave={handleAssign}
				/>
			)}

			<ConfirmDialog
				isOpen={pendingRemove != null}
				onClose={() => setPendingRemove(null)}
				title={t('loads.classRepresentativesMaintenance.remove.title')}
				message={t('loads.classRepresentativesMaintenance.remove.message')}
				confirmLabel={t('loads.classRepresentativesMaintenance.actions.remove')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirmRemove}
				onDecline={() => setPendingRemove(null)}
				isLoading={remove.isPending}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</Card>
	);
}
