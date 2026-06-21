'use client';

import { Spinner } from '@/shared/components';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import type { RubricCriteriaDetailsResponse, ProjectDetailsStudentResponse } from '../../types';
import { PLSelector, type PerformanceLevel } from './CapstonePerformanceLevelSelector';

interface CapstoneRubricRowProps {
	criteria: RubricCriteriaDetailsResponse;
	criterias: RubricCriteriaDetailsResponse[];
	idx: number;
	outcomeCode: string;
	outcomeDesc: string;
	locale: string;
	isLoadingLevels: boolean;
	performanceLevels: PerformanceLevel[];
	duplicateMode: boolean;
	dupSelections: Record<number, number | null>;
	selections: Record<number, Record<number, number | null>>;
	students: ProjectDetailsStudentResponse[];
	nrNaTypeIds: Set<number>;
	qualifStatuses: Record<number, number | null>;
	readOnly: boolean;
	onSelect: (criteriaId: number, projectStudentId: number, value: number) => void;
	onDupSelect: (criteriaId: number, value: number) => void;
}

export function CapstoneRubricRow({
	criteria,
	criterias,
	idx,
	outcomeCode,
	outcomeDesc,
	locale,
	isLoadingLevels,
	performanceLevels,
	duplicateMode,
	dupSelections,
	selections,
	students,
	nrNaTypeIds,
	qualifStatuses,
	readOnly,
	onSelect,
	onDupSelect,
}: CapstoneRubricRowProps) {
	const { t } = useI18n();
	const criteriaDesc = criteria.text[locale as 'es' | 'en'] ?? criteria.text.es;
	const isFirstInOutcome = idx === 0;
	const isLastInOutcome = idx === criterias.length - 1;

	return (
		<tr
			key={criteria.id}
			className={cn('align-top', isLastInOutcome && 'border-b border-zinc-200')}>
			{isFirstInOutcome && (
				<td rowSpan={criterias.length} className="border-b border-zinc-200 px-4 py-4 align-middle">
					<p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Outcome</p>
					<p className="text-sm font-semibold">{outcomeCode}</p>
					<p className="mt-1 text-xs leading-snug text-zinc-500">{outcomeDesc}</p>
				</td>
			)}

			<td className="px-4 py-4">
				<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-snug text-zinc-600">
					{criteriaDesc}
				</div>
			</td>

			<td className="px-4 py-4">
				{isLoadingLevels ? (
					<Spinner size="sm" aria-label={t('projects.evaluate.capstone.loadingLevels')} />
				) : !performanceLevels.length ? (
					<p className="text-xs text-zinc-400">{t('projects.evaluate.capstone.noLevels')}</p>
				) : duplicateMode ? (
					<PLSelector
						levels={performanceLevels}
						selected={dupSelections[criteria.id] ?? null}
						locale={locale}
						onChange={(val) => onDupSelect(criteria.id, val)}
						disabled={readOnly}
					/>
				) : (
					<div className="flex flex-col gap-2">
						{students
							.filter((st) => !nrNaTypeIds.has(qualifStatuses[st.id] ?? -1))
							.map((st) => {
								const current = selections[criteria.id]?.[st.id] ?? null;
								return (
									<div key={st.id} className="flex flex-wrap items-center gap-2">
										<span className="w-28 shrink-0 truncate text-xs font-medium text-zinc-700">
											{st.firstName} {st.lastName}
										</span>
										<PLSelector
											levels={performanceLevels}
											selected={current}
											locale={locale}
											onChange={(val) => onSelect(criteria.id, st.id, val)}
											disabled={readOnly}
										/>
									</div>
								);
							})}
					</div>
				)}
			</td>
		</tr>
	);
}
