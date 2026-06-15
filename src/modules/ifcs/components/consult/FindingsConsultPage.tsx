'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	LoadingDialog,
	PageHeader,
	Skeleton,
	SuccessDialog,
	TableEmptyState,
	Toast,
} from '@/shared/components';
import { useABET, useI18n, useSchoolSourceData, useSchoolSourceOverride } from '@/providers';
import { resolveApiErrorContent, type ApiErrorContent } from '@/shared/utils/tryTranslate';
import { TYPE_CODES } from '@/shared/constants';
import { useFindingsList, useOrgScope } from '../../hooks';
import { deleteFinding } from '../../services/ifcFindingsService';
import { getIfcSchools } from '../../services';
import { optionsForLevel } from '../../services/scope';
import type { FindingRow, ScopeTree, SelectionValue } from '../../types';
import { ScopeDropdowns } from '../ScopeDropdowns';
import { DeleteFindingModal } from '../shared/DeleteFindingModal';
import { CONSULT_LABELS } from './consultLabels';
import { FindingsTable } from './FindingsTable';

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

export function FindingsConsultPage() {
	const { t, locale: lang } = useI18n();
	const router = useRouter();

	const { academicPeriodId, schoolId } = useABET();
	const [selections, setSelections] = useState<Record<number, SelectionValue>>({});

	useSchoolSourceOverride({
		key: `ifc-schools:${academicPeriodId ?? 'none'}`,
		fetch: () => (academicPeriodId == null ? Promise.resolve([]) : getIfcSchools()),
	});

	const { isEmpty: schoolSourceEmpty, isLoading: schoolsLoading } = useSchoolSourceData();
	const noSchools = academicPeriodId !== null && schoolSourceEmpty;

	const { scope, load: loadScope, setScope } = useOrgScope();
	const { rows, load: loadList, refetch } = useFindingsList();

	const [deleteTarget, setDeleteTarget] = useState<FindingRow | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState<ApiErrorContent | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [hasSearched, setHasSearched] = useState(false);

	const chartIncomplete =
		scope !== null &&
		!scope.levels.some((level) =>
			level.options.some((option) => option.tag?.code === TYPE_CODES.CHART_ENTITY_TYPE.COURSE),
		);

	useEffect(() => {
		setSelections({});
		setHasSearched(false);
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
	}, [academicPeriodId, schoolId, loadScope, setScope]);

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
		const chartIds =
			lastSel === 'ALL'
				? optionsForLevel(scope, lastLevel, selections).map((o) => o.id)
				: [Number(lastSel)];
		setHasSearched(true);
		await loadList(chartIds);
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
			setErrorMsg(resolveApiErrorContent(t, e, 'ifcFindings.error.deleteFailed'));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader title={t('ifcFindings.page.title')} />
			<Card className={chartIncomplete ? 'hidden' : ''}>
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
						{!chartIncomplete && scope && scope.levels.length > 0 && (
							<ScopeDropdowns scope={scope} selections={selections} onSelect={handleSelect} />
						)}
					</div>
				)}

				{!noSchools && !chartIncomplete && (
					<div className="mt-6 flex justify-end border-t border-zinc-200 pt-5">
						<Button variant="primary" size="lg" disabled={!canSearch} onClick={handleSearch}>
							<MagnifyingGlassIcon className="h-5 w-5" />
							{t('ifcs.page.searchBtn')}
						</Button>
					</div>
				)}
			</Card>

			{chartIncomplete && (
				<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-base text-red-800">
					<ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 text-red-600" />
					<p>{CONSULT_LABELS.chartIncomplete[lang]}</p>
				</div>
			)}

			{!noSchools && !chartIncomplete && hasSearched && rows.length === 0 && !submitting && (
				<TableEmptyState message={CONSULT_LABELS.empty[lang]} />
			)}

			{!noSchools && !chartIncomplete && rows.length > 0 && (
				<div className="overflow-x-auto">
					<FindingsTable
						rows={rows}
						onView={(findingId) => router.push(`/ifc-findings/${findingId}`)}
						onDelete={(row) => setDeleteTarget(row)}
					/>
				</div>
			)}

			<DeleteFindingModal
				target={deleteTarget}
				submitting={submitting}
				onConfirm={handleConfirmDelete}
				onClose={() => setDeleteTarget(null)}
			/>

			{submitting && <LoadingDialog isOpen label={t('loading.default')} />}
			{errorMsg && (
				<Toast
					isOpen
					type="error"
					onClose={() => setErrorMsg(null)}
					message={errorMsg.title}
					reasons={errorMsg.reasons}
				/>
			)}
			{successMsg && (
				<SuccessDialog isOpen onClose={() => setSuccessMsg(null)} message={successMsg} />
			)}
		</div>
	);
}
