'use client';

import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { verificationOutcomes } from '../../utils/capstoneUtils';
import { CommissionTab, CriteriaItem } from '../../types';

interface CommissionValidatorProps {
	commissions: CommissionTab[];
	locale: 'en' | 'es';
	labelComplete: string;
	labelIncomplete: string;
}

function criteriaFilled(c: CriteriaItem, locale: 'en' | 'es'): boolean {
	return c.description[locale].trim().length > 0;
}

function outcomeComplete(outcome: CommissionTab['outcomes'][number], locale: 'en' | 'es'): boolean {
	const q = outcome.questions[0];
	if (!q || q.criteria.length === 0) return false;
	return q.criteria.every((c) => criteriaFilled(c, locale));
}

function commissionStats(commission: CommissionTab, locale: 'en' | 'es') {
	const outcomes = verificationOutcomes(commission);
	const done = outcomes.filter((o) => outcomeComplete(o, locale)).length;
	const total = outcomes.length;
	const full = total > 0 && done === total;
	const partial =
		!full &&
		outcomes.some((o) => {
			const q = o.questions[0];
			return q !== undefined && q.criteria.some((c) => criteriaFilled(c, locale));
		});
	return { done, total, full, partial };
}

export function CommissionValidator({
	commissions,
	locale,
	labelComplete,
	labelIncomplete,
}: CommissionValidatorProps) {
	return (
		<ul className="text-sm">
			{commissions.map((commission) => {
				const { done, total, full, partial } = commissionStats(commission, locale);

				if (!full && !partial) return null;

				return (
					<li
						key={commission.id}
						className={`flex items-start gap-2 rounded-md px-2 py-2 rounded-lg ${
							full ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
						}`}>
						{full ? (
							<CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
						) : (
							<ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
						)}

						<span className="flex items-center justify-center gap-2">
							<span className="font-semibold">{commission.code}</span>
							{full
								? labelComplete
										.replace('{{done}}', String(done))
										.replace('{{total}}', String(total))
								: labelIncomplete
										.replace('{{done}}', String(done))
										.replace('{{total}}', String(total))}
						</span>
					</li>
				);
			})}
		</ul>
	);
}
