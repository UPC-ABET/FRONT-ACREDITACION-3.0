'use client';

import { useMemo, useState } from 'react';
import {
	ArrowDownTrayIcon,
	BellAlertIcon,
	DocumentChartBarIcon,
	ExclamationTriangleIcon,
	MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, ErrorDialog, Select, SuccessDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import { getAuthCookie } from '@/shared/lib';
import { ORG_LABELS, TYPE_CODES } from '../constants';
import {
	useIFCList,
	useIfcNotify,
	useOrgScope,
	usePdfDownload,
	useStatusReportDownload,
	useStatusTypes,
} from '../hooks';
import { effectiveStatus, optionsForLevel } from '../services/scope';
import type { IFCStatusFilter, ScopeTree, SelectionValue } from '../services/types';
import { AcademicPeriodSelect } from './AcademicPeriodSelect';
import { IFCTable } from './IFCTable';
import { ScopeDropdowns } from './ScopeDropdowns';

function tryTranslate(t: (k: string) => string, key: string) {
	const translated = t(key);
	return translated === key ? key : translated;
}

function formatTemplate(template: string, vars: Record<string, string | number>): string {
	let out = template;
	for (const [k, v] of Object.entries(vars)) {
		out = out.replaceAll(`{{${k}}}`, String(v));
	}
	return out;
}

type StatusOptionItem = { value: IFCStatusFilter; label: string };

export function IFCDashboard() {
	const { t, locale: lang } = useI18n();
	const [periodId, setPeriodId] = useState<number | null>(null);
	const [selections, setSelections] = useState<Record<number, SelectionValue>>({});
	const [statusFilter, setStatusFilter] = useState<IFCStatusFilter>('ALL');
	const [lastSearchedChartIds, setLastSearchedChartIds] = useState<number[] | null>(null);
	const [lastSearchedPeriodId, setLastSearchedPeriodId] = useState<number | null>(null);
	const [notifyError, setNotifyError] = useState<string | null>(null);
	const [notifySuccess, setNotifySuccess] = useState<string | null>(null);

	const { scope, load: loadScope } = useOrgScope();
	const { rows, load: loadList, setRows } = useIFCList();
	const { types: statusTypes } = useStatusTypes();
	const { notifyOne, notifyMany, notifyingChartId, notifyingAll } = useIfcNotify();

	const currentUserId = useMemo<number | null>(() => {
		if (typeof window === 'undefined') return null;
		try {
			const raw = getAuthCookie('token');
			const user = raw ? JSON.parse(raw) : null;
			return user?.id != null ? Number(user.id) : null;
		} catch {
			return null;
		}
	}, []);

	const chartIncomplete =
		scope !== null &&
		!scope.levels.some(
			(l) => l.type_code === TYPE_CODES.CHART_LEVEL_TYPE.COURSE_COORDINATOR && l.options.length > 0,
		);

	function runAutoSelect(
		tree: ScopeTree,
		sels: Record<number, SelectionValue>,
		fromLevel: number,
	): Record<number, SelectionValue> {
		const next = { ...sels };
		const levels = tree.levels.filter((l) => l.level_num >= fromLevel);
		for (const lvl of levels) {
			const opts = optionsForLevel(tree, lvl.level_num, next);
			if (opts.length === 1) {
				next[lvl.level_num] = opts[0].id;
			} else {
				break;
			}
		}
		return next;
	}

	async function handlePeriod(p: number) {
		setPeriodId(p);
		setSelections({});
		setRows([]);
		setLastSearchedChartIds(null);
		setLastSearchedPeriodId(null);
		const tree = await loadScope(p);
		if (tree && tree.levels.length > 0) {
			const first = tree.levels[0].level_num;
			setSelections(runAutoSelect(tree, {}, first));
		}
	}

	function handleSelect(level_num: number, value: SelectionValue) {
		if (!scope) return;
		const next: Record<number, SelectionValue> = { ...selections, [level_num]: value };
		scope.levels.forEach((l) => {
			if (l.level_num > level_num) next[l.level_num] = null;
		});
		setSelections(runAutoSelect(scope, next, level_num + 1));
	}

	const lastLevel = scope?.levels.at(-1)?.level_num ?? null;
	const lastSel = lastLevel !== null ? (selections[lastLevel] ?? null) : null;
	const canSearch = periodId !== null && scope !== null && !chartIncomplete && lastSel !== null;

	async function handleSearch() {
		if (!canSearch || !scope || lastLevel === null || periodId === null) return;
		const chartIds =
			lastSel === 'ALL'
				? optionsForLevel(scope, lastLevel, selections).map((o) => o.id)
				: [Number(lastSel)];
		setLastSearchedChartIds(chartIds);
		setLastSearchedPeriodId(periodId);
		if (chartIds.length === 0) {
			setRows([]);
			return;
		}
		await loadList(chartIds, periodId);
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
				.filter((r) => r.ifc && r.ifc.status_code === TYPE_CODES.IFC_STATUS.APPROVED)
				.map((r) => Number(r.ifc!.id)),
		[visibleRows],
	);

	const notifiableChartIds = useMemo<number[]>(() => {
		return visibleRows
			.filter((r) => {
				const status = effectiveStatus(r);
				const coordinatorId = r.coordinator_user_id;
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
			.map((r) => Number(r.chart_id));
	}, [visibleRows, currentUserId]);

	async function handleNotifyOne(chartId: number) {
		if (periodId === null) return;
		try {
			const r = await notifyOne(chartId, periodId);
			if (r.sent) {
				setNotifySuccess(t('ifcs.notify.toast.success'));
			} else {
				setNotifyError(t(`ifcs.notify.reason.${r.reason ?? 'unknown'}`));
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'ifcs.notify.error.generic';
			setNotifyError(msg);
		}
	}

	async function handleNotifyAll() {
		if (periodId === null || notifiableChartIds.length === 0) return;
		try {
			const result = await notifyMany(notifiableChartIds, periodId);
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
			const msg = e instanceof Error ? e.message : 'ifcs.notify.error.generic';
			setNotifyError(msg);
		}
	}

	const hasResults = visibleRows.length > 0;
	const hasSearched = lastSearchedChartIds !== null;

	return (
		<Card title={t('ifcs.page.title')}>
			<div className="space-y-6">
				<div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 sm:p-6">
					<div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						<AcademicPeriodSelect value={periodId} onChange={handlePeriod} />
						{!chartIncomplete && scope && scope.levels.length > 0 && (
							<ScopeDropdowns scope={scope} selections={selections} onSelect={handleSelect} />
						)}
					</div>

					{!chartIncomplete && (
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
									onClick={() => downloadReport(lastSearchedChartIds!, lastSearchedPeriodId!)}>
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
								{notifiableChartIds.length > 0 && periodId !== null && (
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
						<p>{ORG_LABELS.chart_incomplete[lang]}</p>
					</div>
				)}

				{!chartIncomplete && (
					<div className="overflow-x-auto">
						<IFCTable
							rows={visibleRows}
							periodId={periodId}
							currentUserId={currentUserId}
							notifyingChartId={notifyingChartId}
							onNotify={handleNotifyOne}
						/>
						{hasSearched && !hasResults && (
							<p className="py-8 text-center text-base italic text-zinc-500">
								{t('ifcs.table.empty')}
							</p>
						)}
					</div>
				)}

				{pdfError && (
					<ErrorDialog isOpen onClose={clearPdfError} message={tryTranslate(t, pdfError)} />
				)}

				{reportError && (
					<ErrorDialog isOpen onClose={clearReportError} message={tryTranslate(t, reportError)} />
				)}

				{notifyError && (
					<ErrorDialog
						isOpen
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
