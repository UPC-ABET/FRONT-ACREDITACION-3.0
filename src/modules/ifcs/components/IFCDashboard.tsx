'use client';

import { useMemo, useState } from 'react';
import { Button, Card, Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { ORG_LABELS, TYPE_CODES } from '../constants';
import { useIFCList, useOrgScope, useStatusTypes } from '../hooks';
import { effectiveStatus, optionsForLevel } from '../services/scope';
import type { IFCStatusFilter, ScopeTree, SelectionValue } from '../services/types';
import { AcademicPeriodSelect } from './AcademicPeriodSelect';
import { IFCTable } from './IFCTable';
import { ScopeDropdowns } from './ScopeDropdowns';

type StatusOptionItem = { value: IFCStatusFilter; label: string };

export function IFCDashboard() {
	const { t, locale: lang } = useI18n();
	const [periodId, setPeriodId] = useState<number | null>(null);
	const [selections, setSelections] = useState<Record<number, SelectionValue>>({});
	const [statusFilter, setStatusFilter] = useState<IFCStatusFilter>('ALL');

	const { scope, load: loadScope } = useOrgScope();
	const { rows, load: loadList, setRows } = useIFCList();
	const { types: statusTypes } = useStatusTypes();

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
					</div>
				)}

				{!chartIncomplete && <IFCTable rows={visibleRows} periodId={periodId} />}
			</div>
		</Card>
	);
}
