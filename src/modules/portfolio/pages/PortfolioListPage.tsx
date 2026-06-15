'use client';

import { type ReactNode, useEffect, useState } from 'react';
import {
	ArrowDownTrayIcon,
	MagnifyingGlassIcon,
	PlusIcon,
	XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, ConfirmDialog, Select, Skeleton, SuccessDialog, Toast } from '@/shared/components/ui';
import { useABET, useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import { usePrograms } from '@/modules/academic';
import { PORTFOLIO_STATUS, type FilterPortfolioProjectDto, type PortfolioProjectResponse, type PortfolioStatus } from '../types';
import { useDeletePortfolioProject, usePortfolioProjects } from '../hooks';
import { portfolioProjectsService } from '../services';
import { PortfolioBulkUpload, PortfolioCreateForm, PortfolioTable } from '../components';

type SelectOption = { label: string; value: number };
type StatusOption = { label: string; value: PortfolioStatus | 'ALL' };

const PAGE_SIZE = 20;

export function PortfolioListPage() {
	const { t, locale } = useI18n();
	const { academicPeriodId, modalityTypeId } = useABET();

	const [appliedFilters, setAppliedFilters] = useState<FilterPortfolioProjectDto>({});
	const [page, setPage] = useState(1);
	const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<PortfolioStatus | 'ALL'>('ALL');
	const [isFromUPCFilter, setIsFromUPCFilter] = useState<boolean | null>(null);

	useEffect(() => {
		if (academicPeriodId != null) {
			setAppliedFilters({
				academicPeriodId,
				...(modalityTypeId ? { modalityTypeId } : {}),
			});
			setPage(1);
		}
	}, [academicPeriodId, modalityTypeId]);

	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showBulkUpload, setShowBulkUpload] = useState(false);
	const [projectToDelete, setProjectToDelete] = useState<PortfolioProjectResponse | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [toastError, setToastError] = useState<string | null>(null);
	const [exportLoading, setExportLoading] = useState(false);

	const { data: programs = [] } = usePrograms(
		{ isActive: true, ...(modalityTypeId ? { modalityTypeId } : {}) },
	);

	const { data: projectsData, isLoading, isError, error } = usePortfolioProjects(
		appliedFilters,
		page,
		PAGE_SIZE,
		{ enabled: academicPeriodId !== null },
	);
	const { mutateAsync: deleteProject, isPending: deleting } = useDeletePortfolioProject();

	const loc = locale as 'es' | 'en';
	const programOptions: SelectOption[] = programs.map((p) => ({
		label: p.name[loc] ?? p.name.es,
		value: p.id,
	}));

	const statusOptions: StatusOption[] = [
		{ label: t('portfolio.status.all'), value: 'ALL' },
		{ label: t('portfolio.status.pending'), value: PORTFOLIO_STATUS.PENDING },
		{ label: t('portfolio.status.preApproved'), value: PORTFOLIO_STATUS.PRE_APPROVED },
		{ label: t('portfolio.status.reviewed'), value: PORTFOLIO_STATUS.REVIEWED },
		{ label: t('portfolio.status.approved'), value: PORTFOLIO_STATUS.APPROVED },
		{ label: t('portfolio.status.disapproved'), value: PORTFOLIO_STATUS.DISAPPROVED },
	];

	const originOptions = [
		{ label: t('portfolio.filter.originAll'), value: 'ALL' as const },
		{ label: t('portfolio.filter.originUpc'), value: 'UPC' as const },
		{ label: t('portfolio.filter.originExternal'), value: 'EXTERNAL' as const },
	];

	const selectedProgramOpt = programOptions.find((o) => o.value === selectedProgramId) ?? null;
	const selectedStatusOpt = statusOptions.find((o) => o.value === selectedStatus) ?? statusOptions[0];
	let selectedOriginOpt = originOptions[0];
	if (isFromUPCFilter !== null) {
		selectedOriginOpt = isFromUPCFilter ? originOptions[1] : originOptions[2];
	}

	function handleSearch() {
		const newFilters: FilterPortfolioProjectDto = {
			...(academicPeriodId ? { academicPeriodId } : {}),
			...(modalityTypeId ? { modalityTypeId } : {}),
			...(selectedProgramId ? { programId: selectedProgramId } : {}),
			...(selectedStatus === 'ALL' ? {} : { status: selectedStatus }),
			...(isFromUPCFilter === null ? {} : { isFromUPC: isFromUPCFilter }),
		};
		setAppliedFilters(newFilters);
		setPage(1);
	}

	function handleClearFilters() {
		setSelectedProgramId(null);
		setSelectedStatus('ALL');
		setIsFromUPCFilter(null);
		setAppliedFilters({
			...(academicPeriodId ? { academicPeriodId } : {}),
			...(modalityTypeId ? { modalityTypeId } : {}),
		});
		setPage(1);
	}

	async function handleDeleteConfirm() {
		if (!projectToDelete) return;
		try {
			await deleteProject(projectToDelete.id);
			setProjectToDelete(null);
			setSuccessMessage(t('portfolio.toast.deleted'));
		} catch (e) {
			setProjectToDelete(null);
			setToastError(getErrorMessage(e, t('portfolio.error.deleteFailed')));
		}
	}

	async function handleExport() {
		setExportLoading(true);
		try {
			await portfolioProjectsService.export(appliedFilters);
		} catch (e) {
			setToastError(getErrorMessage(e, t('portfolio.error.exportFailed')));
		} finally {
			setExportLoading(false);
		}
	}

	const rows = projectsData?.data ?? [];
	const totalCount = projectsData?.totalCount ?? 0;
	const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

	const hasActiveFilters =
		selectedProgramId != null || selectedStatus !== 'ALL' || isFromUPCFilter !== null;

	function renderTable(): ReactNode {
		if (academicPeriodId === null) return null;
		if (isLoading) {
			return (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={`skeleton-row-${i}`} className="h-10 w-full" />
					))}
				</div>
			);
		}
		if (isError) {
			return (
				<p className="text-sm text-red-600">
					{getErrorMessage(error, t('portfolio.error.loadFailed'))}
				</p>
			);
		}
		return (
			<>
				<div className="flex items-center justify-between px-1">
					<p className="text-xs font-medium text-zinc-500">
						{totalCount} {t('portfolio.page.resultsCount')}
					</p>
				</div>
				<PortfolioTable rows={rows} onDelete={setProjectToDelete} />
				{totalPages > 1 && (
					<div className="flex items-center justify-center gap-4 py-4">
						<Button
							variant="secondary"
							size="sm"
							disabled={page <= 1}
							onClick={() => setPage((p) => p - 1)}
							className="rounded-md bg-red-50 px-4 py-2 text-sm font-bold text-red-600 border-none hover:bg-red-100 disabled:bg-zinc-100 disabled:text-zinc-400 transition-all">
							{t('table.pagination.previous')}
						</Button>
						<div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest bg-zinc-100 px-3 py-1 rounded-full">
							{t('table.pagination.page')} {page} {t('table.pagination.of')} {totalPages}
						</div>
						<Button
							variant="secondary"
							size="sm"
							disabled={page >= totalPages}
							onClick={() => setPage((p) => p + 1)}
							className="rounded-md bg-red-50 px-4 py-2 text-sm font-bold text-red-600 border-none hover:bg-red-100 disabled:bg-zinc-100 disabled:text-zinc-400 transition-all">
							{t('table.pagination.next')}
						</Button>
					</div>
				)}
			</>
		);
	}

	return (
		<Card title={t('portfolio.page.title')}>
			<div className="space-y-6">
				<div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 space-y-4">
					{academicPeriodId === null ? (
						<p className="text-sm italic text-zinc-500">{t('portfolio.page.selectPeriod')}</p>
					) : (
						<>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
								<Select
									label={t('portfolio.filter.program')}
									value={selectedProgramOpt}
									options={programOptions}
									onChange={(_, opt) =>
										setSelectedProgramId((opt as SelectOption | null)?.value ?? null)
									}
									isClearable
								/>
								<Select
									label={t('portfolio.filter.status')}
									value={selectedStatusOpt}
									options={statusOptions}
									onChange={(_, opt) =>
										setSelectedStatus(
											(opt as StatusOption | null)?.value ?? 'ALL',
										)
									}
								/>
								<Select
									label={t('portfolio.filter.origin')}
									value={selectedOriginOpt}
									options={originOptions}
									onChange={(_, opt) => {
										const v = (opt as { value: string } | null)?.value;
										let filterVal: boolean | null = null;
										if (v === 'UPC') filterVal = true;
										else if (v === 'EXTERNAL') filterVal = false;
										setIsFromUPCFilter(filterVal);
									}}
								/>
							</div>
							<div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4">
								<Button variant="primary" size="md" onClick={handleSearch}>
									<MagnifyingGlassIcon className="h-5 w-5" />
									{t('portfolio.page.searchBtn')}
								</Button>
								{hasActiveFilters && (
									<Button variant="secondary" size="md" onClick={handleClearFilters}>
										<XMarkIcon className="h-5 w-5" />
										{t('portfolio.page.clearFilters')}
									</Button>
								)}
								<div className="ml-auto flex flex-wrap gap-2">
									<Button
										variant="surface"
										size="md"
										disabled={exportLoading || rows.length === 0}
										onClick={handleExport}>
										<ArrowDownTrayIcon className="h-5 w-5" />
										{exportLoading ? t('loading.default') : t('portfolio.page.exportBtn')}
									</Button>
									<Button
										variant="secondary"
										size="md"
										onClick={() => setShowBulkUpload((v) => !v)}>
										{showBulkUpload
											? t('portfolio.page.hideBulkUpload')
											: t('portfolio.page.showBulkUpload')}
									</Button>
									<Button
										variant="primary"
										size="md"
										disabled={!modalityTypeId}
										onClick={() => setShowCreateForm(true)}>
										<PlusIcon className="h-5 w-5" />
										{t('portfolio.page.createBtn')}
									</Button>
								</div>
							</div>
						</>
					)}
				</div>

				{showBulkUpload && academicPeriodId !== null && (
					<div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-5">
						<p className="mb-3 text-sm font-semibold text-zinc-700">
							{t('portfolio.page.bulkUploadTitle')}
						</p>
						<PortfolioBulkUpload
							academicPeriodId={academicPeriodId}
							modalityTypeId={modalityTypeId}
							onSuccess={() => {
								setSuccessMessage(t('portfolio.toast.bulkUploaded'));
								handleSearch();
							}}
						/>
					</div>
				)}

				{renderTable()}
			</div>

			<PortfolioCreateForm
				isOpen={showCreateForm}
				onClose={() => setShowCreateForm(false)}
				onSuccess={() => {
					setShowCreateForm(false);
					setSuccessMessage(t('portfolio.toast.created'));
					handleSearch();
				}}
				modalityTypeId={modalityTypeId}
			/>

			<ConfirmDialog
				isOpen={projectToDelete != null}
				onClose={() => setProjectToDelete(null)}
				onConfirm={handleDeleteConfirm}
				onDecline={() => setProjectToDelete(null)}
				title={t('portfolio.delete.title')}
				message={t('portfolio.delete.body').replace('{{name}}', projectToDelete?.name ?? '')}
				confirmLabel={t('portfolio.delete.confirm')}
				isLoading={deleting}
			/>

			{successMessage && (
				<SuccessDialog
					isOpen
					onClose={() => setSuccessMessage(null)}
					message={successMessage}
				/>
			)}

			{toastError && (
				<Toast isOpen type="error" onClose={() => setToastError(null)} message={toastError} />
			)}
		</Card>
	);
}
