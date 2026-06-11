'use client';

import { useEffect, useMemo, useState } from 'react';
import {
	ArrowDownTrayIcon,
	BellAlertIcon,
	DocumentChartBarIcon,
	ExclamationTriangleIcon,
	MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	Select,
	Skeleton,
	SuccessDialog,
	TableEmptyState,
	Toast,
} from '@/shared/components';
import {
	useABET,
	useAuth,
	useI18n,
	useSchoolSourceData,
	useSchoolSourceOverride,
} from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { TYPE_CODES } from '@/shared/constants';
import { ORG_LABELS } from '../constants';
import {
	useIFCList,
	useIfcNotify,
	useOrgScope,
	usePdfDownload,
	useStatusReportDownload,
	useStatusTypes,
} from '../hooks';
import { getIfcSchools } from '../services';
import { effectiveStatus, optionsForLevel } from '../services/scope';
import type { IFCStatusFilter, ScopeTree, SelectionValue } from '../types';
import { IFCTable } from './IFCTable';
import { ScopeDropdowns } from './ScopeDropdowns';

function formatTemplate(template: string, vars: Record<string, string | number>): string {
	let out = template;
	for (const [k, v] of Object.entries(vars)) {
		out = out.replaceAll(`{{${k}}}`, String(v));
	}
	return out;
}

function runAutoSelect(
	tree: ScopeTree,
	sels: Record<number, SelectionValue>,
	fromLevel: number,
): Record<number, SelectionValue> {
	const next = { ...sels };
	const levels = tree.levels.filter((level) => level.levelNum >= fromLevel);
	for (const level of levels) {
		const opts = optionsForLevel(tree, level.levelNum, next);
		if (opts.length === 1) {
			next[level.levelNum] = opts[0].id;
		} else {
			break;
		}
	}
	return next;
}

type StatusOptionItem = { value: IFCStatusFilter; label: string };

export function IFCDashboard() {
	const { t, locale: lang } = useI18n();
	const [selections, setSelections] = useState<Record<number, SelectionValue>>({});
	const [statusFilter, setStatusFilter] = useState<IFCStatusFilter>('ALL');
	const [lastSearchedChartIds, setLastSearchedChartIds] = useState<number[] | null>(null);
	const [lastSearchedPeriodId, setLastSearchedPeriodId] = useState<number | null>(null);
	const [notifyError, setNotifyError] = useState<string | null>(null);
	const [notifySuccess, setNotifySuccess] = useState<string | null>(null);
	const [scopeErrorDismissed, setScopeErrorDismissed] = useState(false);
	const [listErrorDismissed, setListErrorDismissed] = useState(false);

	const {
		scope,
		loading: scopeLoading,
		error: scopeError,
		load: loadScope,
		setScope,
	} = useOrgScope();
	const { rows, loading: listLoading, error: listError, load: loadList, setRows } = useIFCList();
	const { data: statusTypes = [] } = useStatusTypes();
	const { notifyOne, notifyMany, notifyingChartId, notifyingAll } = useIfcNotify();

	const { user: authUser } = useAuth();
	const currentUserId = authUser?.id ?? null;
	const { academicPeriodId, schoolId } = useABET();

	useSchoolSourceOverride({
		key: `ifc-schools:${academicPeriodId ?? 'none'}`,
		fetch: () => (academicPeriodId == null ? Promise.resolve([]) : getIfcSchools()),
	});

	const { isEmpty: schoolSourceEmpty, isLoading: schoolsLoading } = useSchoolSourceData();
	const noSchools = academicPeriodId !== null && schoolSourceEmpty;

	useEffect(() => {
		setSelections({});
		setRows([]);
		setLastSearchedChartIds(null);
		setLastSearchedPeriodId(null);
		setScopeErrorDismissed(false);
		setListErrorDismissed(false);
		if (academicPeriodId === null || schoolId === null) {
			setScope(null);
			return;
		}
		let active = true;
		void loadScope().then((tree) => {
			if (!active || !tree || tree.levels.length === 0) return;
			const firstLevel = tree.levels[0].levelNum;
			setSelections(runAutoSelect(tree, {}, firstLevel));
		});
		return () => {
			active = false;
		};
	}, [academicPeriodId, schoolId, loadScope, setRows, setScope]);

	const chartIncomplete =
		scope !== null &&
		!scope.levels.some((level) =>
			level.options.some((option) => option.tag?.code === TYPE_CODES.CHART_ENTITY_TYPE.COURSE),
		);

	function handleSelect(levelNum: number, value: SelectionValue) {
		if (!scope) return;
		const next: Record<number, SelectionValue> = { ...selections, [levelNum]: value };
		scope.levels.forEach((l) => {
			if (l.levelNum > levelNum) next[l.levelNum] = null;
		});
		setSelections(runAutoSelect(scope, next, levelNum + 1));
	}

	const lastLevel = scope?.levels.at(-1)?.levelNum ?? null;
	const lastSel = lastLevel !== null ? (selections[lastLevel] ?? null) : null;
	const canSearch =
		academicPeriodId !== null && scope !== null && !chartIncomplete && lastSel !== null;

	async function handleSearch() {
		if (!canSearch || !scope || lastLevel === null || academicPeriodId === null) return;
		setListErrorDismissed(false);
		const chartIds =
			lastSel === 'ALL'
				? optionsForLevel(scope, lastLevel, selections).map((o) => o.id)
				: [Number(lastSel)];
		setLastSearchedChartIds(chartIds);
		setLastSearchedPeriodId(academicPeriodId);
		if (chartIds.length === 0) {
			setRows([]);
			return;
		}
		await loadList(chartIds);
	}

	const statusOptions: StatusOptionItem[] = useMemo(
		() => [
			{ value: 'ALL' as IFCStatusFilter, label: t('ifcs.status.all') },
			...statusTypes.map((s) => ({
				value: s.code as IFCStatusFilter,
				label: s.name[lang] ?? s.name.es ?? s.code,
			})),
		],
		[statusTypes, t, lang],
	);

	const selectedStatusOpt = useMemo(
		() => statusOptions.find((o) => o.value === statusFilter) ?? null,
		[statusOptions, statusFilter],
	);

	const visibleRows = useMemo(() => {
		if (statusFilter === 'ALL') return rows;
		return rows.filter((r) => effectiveStatus(r) === statusFilter);
	}, [rows, statusFilter]);

	const {
		downloadMany,
		downloadingAll,
		error: pdfError,
		clearError: clearPdfError,
	} = usePdfDownload();

	const {
		download: downloadReport,
		downloading: downloadingReport,
		error: reportError,
		clearError: clearReportError,
	} = useStatusReportDownload();

	const canDownloadReport =
		lastSearchedChartIds !== null &&
		lastSearchedChartIds.length > 0 &&
		lastSearchedPeriodId !== null;

	const approvedIds = useMemo<number[]>(
		() =>
			visibleRows
				.filter((r) => r.ifc && r.ifc.statusCode === TYPE_CODES.IFC_STATUS.APPROVED)
				.map((r) => Number(r.ifc!.id)),
		[visibleRows],
	);

	const notifiableChartIds = useMemo<number[]>(() => {
		return visibleRows
			.filter((r) => {
				const status = effectiveStatus(r);
				const coordinatorId = r.coordinatorUserId;
				const isOwn =
					currentUserId != null &&
					coordinatorId != null &&
					Number(coordinatorId) === Number(currentUserId);
				return (
					!isOwn &&
					status !== TYPE_CODES.IFC_STATUS.APPROVED &&
					status !== TYPE_CODES.IFC_STATUS.SUBMITTED
				);
			})
			.map((r) => Number(r.chartId));
	}, [visibleRows, currentUserId]);

	async function handleNotifyOne(chartId: number) {
		if (academicPeriodId === null) return;
		try {
			const r = await notifyOne(chartId);
			if (r.sent) {
				setNotifySuccess(t('ifcs.notify.toast.success'));
			} else {
				setNotifyError(t(`ifcs.notify.reason.${r.reason ?? 'unknown'}`));
			}
		} catch (e) {
			setNotifyError(getErrorMessage(e, 'ifcs.notify.error.generic'));
		}
	}

	async function handleNotifyAll() {
		if (academicPeriodId === null || notifiableChartIds.length === 0) return;
		try {
			const result = await notifyMany(notifiableChartIds);
			if (result.errors.length > 0) {
				setNotifyError(
					formatTemplate(t('ifcs.notify.toast.error'), { count: result.errors.length }),
				);
			} else if (result.skipped.length > 0 && result.sent.length === 0) {
				setNotifyError(t('ifcs.notify.toast.allSkipped'));
			} else if (result.skipped.length > 0) {
				setNotifySuccess(
					formatTemplate(t('ifcs.notify.toast.partial'), {
						sent: result.sent.length,
						skipped: result.skipped.length,
					}),
				);
			} else {
				setNotifySuccess(
					formatTemplate(t('ifcs.notify.toast.successAll'), { count: result.sent.length }),
				);
			}
		} catch (e) {
			setNotifyError(getErrorMessage(e, 'ifcs.notify.error.generic'));
		}
	}

	const hasResults = visibleRows.length > 0;
	const hasSearched = lastSearchedChartIds !== null;

	return (
		<Card title={t('ifcs.page.title')}>
			<div className="space-y-6">
				<div
					className={`rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 sm:p-6${
						chartIncomplete ? ' hidden' : ''
					}`}>
					{academicPeriodId === null ? (
						<p className="text-sm italic text-zinc-500">{t('ifcs.page.selectPeriod')}</p>
					) : schoolsLoading ? (
						<div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : noSchools ? (
						<p className="text-sm italic text-zinc-500">{t('ifcs.page.noSchools')}</p>
					) : (
						<div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{scopeLoading && (
								<>
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
								</>
							)}
							{!scopeLoading && !chartIncomplete && scope && scope.levels.length > 0 && (
								<ScopeDropdowns scope={scope} selections={selections} onSelect={handleSelect} />
							)}
						</div>
					)}

					{!noSchools && !chartIncomplete && (
						<div className="mt-6 flex flex-col gap-4 border-t border-zinc-200 pt-5 lg:flex-row lg:items-end lg:justify-between">
							<div className="w-full lg:w-72">
								<Select
									label={t('ifcs.table.statusFilter')}
									value={selectedStatusOpt}
									onChange={(_, opt) => {
										const next = (opt as { value?: IFCStatusFilter } | null)?.value;
										setStatusFilter((next ?? 'ALL') as IFCStatusFilter);
									}}
									options={statusOptions}
								/>
							</div>
							<div className="flex flex-wrap items-center gap-2 lg:justify-end">
								<Button variant="primary" size="lg" disabled={!canSearch} onClick={handleSearch}>
									<MagnifyingGlassIcon className="h-5 w-5" />
									{t('ifcs.page.searchBtn')}
								</Button>
								<Button
									variant="secondary"
									size="lg"
									disabled={!canDownloadReport || downloadingReport}
									onClick={() => downloadReport(lastSearchedChartIds!)}>
									<DocumentChartBarIcon className="h-5 w-5" />
									{downloadingReport ? t('loading.default') : t('ifcs.statusReport.btn')}
								</Button>
								{approvedIds.length > 1 && (
									<Button
										variant="secondary"
										size="lg"
										disabled={downloadingAll}
										onClick={() => downloadMany(approvedIds)}>
										<ArrowDownTrayIcon className="h-5 w-5" />
										{downloadingAll
											? t('loading.default')
											: `${t('ifcs.pdf.downloadAll')} (${approvedIds.length})`}
									</Button>
								)}
								{notifiableChartIds.length > 0 && academicPeriodId !== null && (
									<Button
										variant="secondary"
										size="lg"
										disabled={notifyingAll}
										onClick={handleNotifyAll}>
										<BellAlertIcon className="h-5 w-5" />
										{notifyingAll
											? t('loading.default')
											: `${t('ifcs.notify.btn.notifyAll')} (${notifiableChartIds.length})`}
									</Button>
								)}
							</div>
						</div>
					)}
				</div>

				{chartIncomplete && (
					<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-base text-red-800">
						<ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 text-red-600" />
						<p>{ORG_LABELS.chartIncomplete[lang]}</p>
					</div>
				)}

				{!noSchools && !chartIncomplete && listLoading && (
					<div className="space-y-3">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				)}

				{!noSchools && !chartIncomplete && !listLoading && (
					<div className="overflow-x-auto">
						<IFCTable
							rows={visibleRows}
							periodId={academicPeriodId}
							currentUserId={currentUserId}
							notifyingChartId={notifyingChartId}
							onNotify={handleNotifyOne}
						/>
						{hasSearched && !hasResults && <TableEmptyState message={t('ifcs.table.empty')} />}
					</div>
				)}

				{scopeError && !scopeErrorDismissed && (
					<Toast
						isOpen
						type="error"
						onClose={() => setScopeErrorDismissed(true)}
						message={tryTranslate(t, scopeError)}
					/>
				)}

				{listError && !listErrorDismissed && (
					<Toast
						isOpen
						type="error"
						onClose={() => setListErrorDismissed(true)}
						message={tryTranslate(t, listError)}
					/>
				)}

				{pdfError && (
					<Toast isOpen type="error" onClose={clearPdfError} message={tryTranslate(t, pdfError)} />
				)}

				{reportError && (
					<Toast
						isOpen
						type="error"
						onClose={clearReportError}
						message={tryTranslate(t, reportError)}
					/>
				)}

				{notifyError && (
					<Toast
						isOpen
						type="error"
						onClose={() => setNotifyError(null)}
						message={tryTranslate(t, notifyError)}
					/>
				)}

				{notifySuccess && (
					<SuccessDialog isOpen onClose={() => setNotifySuccess(null)} message={notifySuccess} />
				)}
			</div>
		</Card>
	);
}
