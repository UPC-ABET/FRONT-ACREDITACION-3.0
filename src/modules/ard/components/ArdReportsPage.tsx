'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Alert, Button, Card, PageHeader, Skeleton, TableEmptyState } from '@/shared/components/ui';
import { getErrorMessage, triggerBlobDownload } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { useABET, useI18n } from '@/providers';
import { TYPE_CODES } from '@/shared/constants';
import {
	optionsForLevel,
	ScopeDropdowns,
	useOrgScope,
	type ScopeTree,
	type SelectionValue,
} from '@/modules/organization';
import { useArdExport } from '../hooks';
import type { ArdExportRequest } from '../types';

const REPORT_LEVEL_CODES = new Set<string>([
	TYPE_CODES.CHART_ENTITY_TYPE.PROGRAM,
	TYPE_CODES.CHART_ENTITY_TYPE.AREA,
	TYPE_CODES.CHART_ENTITY_TYPE.SUBAREA,
]);

function filterReportScope(scope: ScopeTree): ScopeTree {
	return {
		...scope,
		levels: scope.levels.filter((level) =>
			level.options.some((option) => option.tag && REPORT_LEVEL_CODES.has(option.tag.code)),
		),
	};
}

function levelNumForCode(scope: ScopeTree, code: string): number | null {
	const level = scope.levels.find((item) =>
		item.options.some((option) => option.tag?.code === code),
	);
	return level ? level.levelNum : null;
}

function autoSelectSingletons(
	scope: ScopeTree,
	selections: Record<number, SelectionValue>,
	fromLevel: number,
): Record<number, SelectionValue> {
	const next = { ...selections };
	const levels = scope.levels.filter((level) => level.levelNum >= fromLevel);
	for (const level of levels) {
		const options = optionsForLevel(scope, level.levelNum, next);
		if (options.length === 1) next[level.levelNum] = options[0].id;
		else break;
	}
	return next;
}

export function ArdReportsPage() {
	const { t, locale } = useI18n();
	const { academicPeriodId, schoolId } = useABET();

	const { scope, loading, load: loadScope, setScope } = useOrgScope();
	const [selections, setSelections] = useState<Record<number, SelectionValue>>({});
	const exportReport = useArdExport();

	const reportScope = scope ? filterReportScope(scope) : null;

	useEffect(() => {
		/* eslint-disable react-hooks/set-state-in-effect -- reset selections and bootstrap scope when the external school/period changes */
		setSelections({});
		if (academicPeriodId === null || schoolId === null) {
			setScope(null);
			return;
		}
		/* eslint-enable react-hooks/set-state-in-effect */
		let active = true;
		void loadScope().then((tree) => {
			if (!active || !tree) return;
			const filtered = filterReportScope(tree);
			if (filtered.levels.length === 0) return;
			setSelections(autoSelectSingletons(filtered, {}, filtered.levels[0].levelNum));
		});
		return () => {
			active = false;
		};
	}, [academicPeriodId, schoolId, loadScope, setScope]);

	function handleSelect(levelNum: number, value: SelectionValue) {
		if (!reportScope) return;
		const next: Record<number, SelectionValue> = { ...selections, [levelNum]: value };
		reportScope.levels.forEach((level) => {
			if (level.levelNum > levelNum) next[level.levelNum] = null;
		});
		setSelections(autoSelectSingletons(reportScope, next, levelNum + 1));
	}

	const programLevelNum = reportScope
		? levelNumForCode(reportScope, TYPE_CODES.CHART_ENTITY_TYPE.PROGRAM)
		: null;
	const areaLevelNum = reportScope
		? levelNumForCode(reportScope, TYPE_CODES.CHART_ENTITY_TYPE.AREA)
		: null;
	const subareaLevelNum = reportScope
		? levelNumForCode(reportScope, TYPE_CODES.CHART_ENTITY_TYPE.SUBAREA)
		: null;

	const programSelection = programLevelNum !== null ? (selections[programLevelNum] ?? null) : null;
	const selectedProgramChartId = typeof programSelection === 'number' ? programSelection : null;

	const allLevelsChosen = reportScope
		? reportScope.levels.every((level) => (selections[level.levelNum] ?? null) !== null)
		: false;
	const canExport = selectedProgramChartId !== null && allLevelsChosen;

	function handleExport() {
		if (!reportScope || programLevelNum === null || selectedProgramChartId === null) return;

		const programOption = reportScope.levels
			.find((level) => level.levelNum === programLevelNum)
			?.options.find((option) => option.id === selectedProgramChartId);
		if (!programOption) return;

		const areaSelection = areaLevelNum !== null ? (selections[areaLevelNum] ?? null) : null;
		const subareaSelection =
			subareaLevelNum !== null ? (selections[subareaLevelNum] ?? null) : null;

		const body: ArdExportRequest = {
			programId: programOption.entityId,
			lang: locale === 'en' ? 'en' : 'es',
		};
		if (typeof subareaSelection === 'number') {
			body.subareaChartIds = [subareaSelection];
		} else if (typeof areaSelection === 'number') {
			body.areaChartIds = [areaSelection];
		}

		exportReport.mutate(body, {
			onSuccess: ({ blob, fileName }) => triggerBlobDownload(blob, fileName),
		});
	}

	return (
		<div className="space-y-6">
			<PageHeader title={t('ard.reports.title')} description={t('ard.reports.description')} />
			<Card>
				{academicPeriodId === null ? (
					<p className="text-sm italic text-zinc-500">{t('ard.reports.selectPeriod')}</p>
				) : schoolId === null ? (
					<p className="text-sm italic text-zinc-500">{t('ard.reports.selectSchool')}</p>
				) : loading ? (
					<div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				) : reportScope && reportScope.levels.length > 0 ? (
					<>
						<div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
							<ScopeDropdowns scope={reportScope} selections={selections} onSelect={handleSelect} />
						</div>
						{exportReport.isError && (
							<Alert variant="destructive" className="mt-6">
								{tryTranslate(t, getErrorMessage(exportReport.error, 'ard.reports.exportFailed'))}
							</Alert>
						)}
						<div className="mt-6 flex justify-end border-t border-zinc-200 pt-5">
							<Button disabled={!canExport} loading={exportReport.isPending} onClick={handleExport}>
								<Download className="h-4 w-4" />
								{t('ard.reports.export')}
							</Button>
						</div>
					</>
				) : (
					<TableEmptyState message={t('ard.reports.noScope')} />
				)}
			</Card>
		</div>
	);
}
