'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	LoadingDialog,
	SuccessDialog,
	TableEmptyState,
	Toast,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/api-error';
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
			setErrorMsg(getErrorMessage(e, 'ifcFindings.error.deleteFailed'));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Card title={t('ifcFindings.page.title')}>
			<div className="space-y-6">
				<div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 sm:p-6">
					<div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						<AcademicPeriodSelect value={periodId} onChange={handlePeriod} />
						{!chartIncomplete && scope && scope.levels.length > 0 && (
							<ScopeDropdowns scope={scope} selections={selections} onSelect={handleSelect} />
						)}
					</div>

					{!chartIncomplete && (
						<div className="mt-6 flex justify-end border-t border-zinc-200 pt-5">
							<Button variant="primary" size="lg" disabled={!canSearch} onClick={handleSearch}>
								<MagnifyingGlassIcon className="h-5 w-5" />
								{t('ifcs.page.searchBtn')}
							</Button>
						</div>
					)}
				</div>

				{chartIncomplete && (
					<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-base text-red-800">
						<ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 text-red-600" />
						<p>{CONSULT_LABELS.chart_incomplete[lang]}</p>
					</div>
				)}

				{!chartIncomplete && hasSearched && rows.length === 0 && !submitting && (
					<TableEmptyState message={CONSULT_LABELS.empty[lang]} />
				)}

				{!chartIncomplete && rows.length > 0 && (
					<div className="overflow-x-auto">
						<FindingsTable
							rows={rows}
							onView={(findingId) => router.push(`/ifc-findings/${findingId}`)}
							onDelete={(row) => setDeleteTarget(row)}
						/>
					</div>
				)}
			</div>

			<DeleteFindingModal
				target={deleteTarget}
				submitting={submitting}
				onConfirm={handleConfirmDelete}
				onClose={() => setDeleteTarget(null)}
			/>

			{submitting && <LoadingDialog isOpen label={t('loading.default')} />}
			{errorMsg && (
				<Toast isOpen type="error" onClose={() => setErrorMsg(null)} message={t(errorMsg)} />
			)}
			{successMsg && (
				<SuccessDialog isOpen onClose={() => setSuccessMsg(null)} message={successMsg} />
			)}
		</Card>
	);
}
