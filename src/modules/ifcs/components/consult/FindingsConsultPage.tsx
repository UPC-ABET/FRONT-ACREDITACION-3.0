'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, ErrorDialog, LoadingDialog, SuccessDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import { TYPE_CODES } from '../../constants';
import { useFindingsList, useOrgScope } from '../../hooks';
import { deleteFinding } from '../../services/ifcFindingsService';
import { optionsForLevel } from '../../services/scope';
import type { FindingRow, ScopeTree, SelectionValue } from '../../services/types';
import { AcademicPeriodSelect } from '../AcademicPeriodSelect';
import { ScopeDropdowns } from '../ScopeDropdowns';
import { DeleteFindingModal } from '../shared/DeleteFindingModal';
import { CONSULT_LABELS } from './consultLabels';
import { FindingsTable } from './FindingsTable';

export function FindingsConsultPage() {
	const { t, locale: lang } = useI18n();
	const router = useRouter();

	const [periodId, setPeriodId] = useState<number | null>(null);
	const [selections, setSelections] = useState<Record<number, SelectionValue>>({});

	const { scope, load: loadScope } = useOrgScope();
	const { rows, load: loadList, refetch } = useFindingsList();

	const [deleteTarget, setDeleteTarget] = useState<FindingRow | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [hasSearched, setHasSearched] = useState(false);

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
		setHasSearched(false);
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
		setHasSearched(true);
		await loadList(chartIds, periodId);
	}

	async function handleConfirmDelete() {
		if (!deleteTarget) return;
		setSubmitting(true);
		setErrorMsg(null);
		try {
			await deleteFinding(deleteTarget.id);
			setSuccessMsg(t('ifcFindings.toast.deleted'));
			setDeleteTarget(null);
			await refetch();
		} catch (e) {
			const message = e instanceof Error ? e.message : 'ifcFindings.error.deleteFailed';
			setErrorMsg(message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Card title={t('ifcFindings.page.title')}>
			<div className="space-y-6">
				<AcademicPeriodSelect value={periodId} onChange={handlePeriod} />

				{chartIncomplete && (
					<p className="text-sm text-red-600">{CONSULT_LABELS.chart_incomplete[lang]}</p>
				)}

				{!chartIncomplete && scope && scope.levels.length > 0 && (
					<ScopeDropdowns scope={scope} selections={selections} onSelect={handleSelect} />
				)}

				{!chartIncomplete && (
					<div className="flex justify-end">
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

				{!chartIncomplete && hasSearched && rows.length === 0 && !submitting && (
					<p className="text-sm text-zinc-500 italic text-center py-6">
						{CONSULT_LABELS.empty[lang]}
					</p>
				)}

				{!chartIncomplete && rows.length > 0 && (
					<FindingsTable
						rows={rows}
						onView={(findingId) => router.push(`/ifc-findings/${findingId}`)}
						onDelete={(row) => setDeleteTarget(row)}
					/>
				)}
			</div>

			<DeleteFindingModal
				target={deleteTarget}
				submitting={submitting}
				onConfirm={handleConfirmDelete}
				onClose={() => setDeleteTarget(null)}
			/>

			{submitting && <LoadingDialog isOpen label={t('loading.default')} />}
			{errorMsg && <ErrorDialog isOpen onClose={() => setErrorMsg(null)} message={t(errorMsg)} />}
			{successMsg && (
				<SuccessDialog isOpen onClose={() => setSuccessMsg(null)} message={successMsg} />
			)}
		</Card>
	);
}
