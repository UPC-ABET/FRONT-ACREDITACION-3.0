'use client';

import { useMemo, useState } from 'react';
import { Button, Card, ErrorDialog, Select, SuccessDialog } from '@/shared/components';
import { useI18n } from '@/providers';
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
			const raw = localStorage.getItem('token');
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
		// No /list fetch here — Search button is the single trigger.
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

	return (
		<Card title={t('ifcs.page.title')}>
			<div className="space-y-6">
				<AcademicPeriodSelect value={periodId} onChange={handlePeriod} />

				{chartIncomplete && (
					<p className="text-sm text-red-600">{ORG_LABELS.chart_incomplete[lang]}</p>
				)}

				{!chartIncomplete && scope && scope.levels.length > 0 && (
					<ScopeDropdowns scope={scope} selections={selections} onSelect={handleSelect} />
				)}

				{!chartIncomplete && (
					<div className="flex flex-wrap items-end gap-3">
						<div className="min-w-[220px]">
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
						<Button
							variant="primary"
							size="md"
							disabled={!canSearch}
							title={canSearch ? undefined : t('ifcs.page.searchDisabled')}
							onClick={handleSearch}>
							{t('ifcs.page.searchBtn')}
						</Button>
						<Button
							variant="secondary"
							size="md"
							disabled={!canDownloadReport || downloadingReport}
							title={
								canDownloadReport ? undefined : t('ifcs.statusReport.tooltipNoScope')
							}
							onClick={() =>
								downloadReport(lastSearchedChartIds!, lastSearchedPeriodId!)
							}>
							{downloadingReport
								? t('loading.default')
								: t('ifcs.statusReport.btn')}
						</Button>
						{approvedIds.length > 1 && (
							<Button
								variant="secondary"
								size="md"
								disabled={downloadingAll}
								onClick={() => downloadMany(approvedIds)}>
								{downloadingAll
									? t('loading.default')
									: `${t('ifcs.pdf.downloadAll')} (${approvedIds.length})`}
							</Button>
						)}
						{notifiableChartIds.length > 0 && periodId !== null && (
							<Button
								variant="secondary"
								size="md"
								disabled={notifyingAll}
								onClick={handleNotifyAll}>
								{notifyingAll
									? t('loading.default')
									: `${t('ifcs.notify.btn.notifyAll')} (${notifiableChartIds.length})`}
							</Button>
						)}
					</div>
				)}

				{!chartIncomplete && (
					<IFCTable
						rows={visibleRows}
						periodId={periodId}
						currentUserId={currentUserId}
						notifyingChartId={notifyingChartId}
						onNotify={handleNotifyOne}
					/>
				)}

				{pdfError && (
					<ErrorDialog
						isOpen
						onClose={clearPdfError}
						message={tryTranslate(t, pdfError)}
					/>
				)}

				{reportError && (
					<ErrorDialog
						isOpen
						onClose={clearReportError}
						message={tryTranslate(t, reportError)}
					/>
				)}

				{notifyError && (
					<ErrorDialog
						isOpen
						onClose={() => setNotifyError(null)}
						message={tryTranslate(t, notifyError)}
					/>
				)}

				{notifySuccess && (
					<SuccessDialog
						isOpen
						onClose={() => setNotifySuccess(null)}
						message={notifySuccess}
					/>
				)}
			</div>
		</Card>
	);
}
