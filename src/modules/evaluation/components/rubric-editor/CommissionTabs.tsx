'use client';

import { useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Checkbox } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { CommissionTab } from '@/modules';
import { verificationOutcomes } from '@/modules/evaluation/utils';

function commissionTabStatus(
	commission: CommissionTab,
	locale: 'en' | 'es',
): 'complete' | 'partial' | 'empty' {
	const outcomes = verificationOutcomes(commission);
	const criteriaFilled = (
		c: CommissionTab['outcomes'][number]['questions'][number]['criteria'][number],
	) => c.description[locale].trim().length > 0;
	const outcomeComplete = (o: CommissionTab['outcomes'][number]) => {
		const q = o.questions[0];
		return q !== undefined && q.criteria.length > 0 && q.criteria.every(criteriaFilled);
	};
	const hasAny = outcomes.some((o) => {
		const q = o.questions[0];
		return q !== undefined && q.criteria.some(criteriaFilled);
	});
	const allComplete = outcomes.length > 0 && outcomes.every(outcomeComplete);
	if (allComplete) return 'complete';
	if (hasAny) return 'partial';
	return 'empty';
}

interface CommissionTabsProps {
	commissions: CommissionTab[];
	activeCommissionId: string;
	onCommissionChange: (id: string) => void;
	checkboxTooltipIncomplete: string;
}

export function CommissionTabs({
	commissions,
	activeCommissionId,
	onCommissionChange,
	checkboxTooltipIncomplete,
}: CommissionTabsProps) {
	const { locale, t } = useI18n();
	const [checked, setChecked] = useState<Record<string, boolean>>({});

	return (
		<div className="bg-white">
			<nav className="flex flex-wrap gap-1" aria-label="Commissions">
				{commissions.map((commission) => {
					const status = commissionTabStatus(commission, locale);
					const complete = status === 'complete';
					const isActive = commission.id === activeCommissionId;

					return (
						<div
							key={commission.id}
							role="tab"
							tabIndex={0}
							aria-selected={isActive}
							onClick={() => onCommissionChange(commission.id)}
							onKeyDown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									onCommissionChange(commission.id);
								}
							}}
							className={`flex cursor-pointer items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
								isActive
									? 'border-zinc-300 bg-zinc-100 text-zinc-900'
									: 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-800'
							}`}>
							<span
								role="presentation"
								onClick={(event) => event.stopPropagation()}
								onMouseDown={(event) => event.stopPropagation()}
								onKeyDown={(event) => event.stopPropagation()}
								className="inline-flex">
								<Checkbox
									checked={Boolean(checked[commission.id])}
									disabled={!complete}
									title={!complete ? checkboxTooltipIncomplete : undefined}
									onCheckedChange={(value) => {
										if (!complete) return;
										setChecked((prev) => ({ ...prev, [commission.id]: Boolean(value) }));
									}}
								/>
							</span>
							{status === 'complete' ? (
								<CheckCircleIcon
									className="h-4 w-4 shrink-0 text-emerald-500"
									aria-label={t('rubrics.commission.status.complete')}
								/>
							) : status === 'partial' ? (
								<ExclamationTriangleIcon
									className="h-4 w-4 shrink-0 text-amber-500"
									aria-label={t('rubrics.commission.status.incomplete')}
								/>
							) : (
								<span
									className="inline-block h-4 w-4 shrink-0 rounded-full bg-zinc-200"
									aria-hidden
								/>
							)}
							<span className="font-semibold">{commission.code}</span>
						</div>
					);
				})}
			</nav>
		</div>
	);
}
