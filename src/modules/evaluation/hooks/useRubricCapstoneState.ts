'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CriteriaItem, RubricDetail } from '../types';

export function updateOutcomeCriteria(
	rubric: RubricDetail,
	commissionId: string,
	outcomeId: string,
	updater: (criteria: CriteriaItem[]) => CriteriaItem[],
): RubricDetail {
	return {
		...rubric,
		commissions: rubric.commissions.map((commission) => {
			if (commission.id !== commissionId) return commission;
			const outcomes = commission.outcomes.map((outcome) => {
				if (outcome.id !== outcomeId) return outcome;
				const q = outcome.questions[0];
				if (!q) return outcome;
				return { ...outcome, questions: [{ ...q, criteria: updater(q.criteria) }] };
			});
			const verification = outcomes.filter((o) => o.outcomeType === 'verificacion');
			const isComplete =
				verification.length > 0 &&
				verification.every((o) => (o.questions[0]?.criteria.length ?? 0) > 0);
			return { ...commission, outcomes, isComplete };
		}),
	};
}

interface UseRubricCapstoneStateOptions {
	rubric: RubricDetail;
	queryKey: readonly unknown[];
}

export function useRubricCapstoneState({ rubric, queryKey }: UseRubricCapstoneStateOptions) {
	const queryClient = useQueryClient();

	const [activeCommissionId, setActiveCommissionId] = useState(
		() => rubric.commissions[0]?.id ?? '',
	);
	const [draftRubric, setDraftRubric] = useState<RubricDetail>(rubric);

	const activeCommission = useMemo(
		() => draftRubric.commissions.find((c) => c.id === activeCommissionId),
		[draftRubric.commissions, activeCommissionId],
	);

	const mergeRubric = (fn: (prev: RubricDetail) => RubricDetail) => {
		setDraftRubric((prev) => fn(prev));
		queryClient.setQueryData<RubricDetail>(queryKey, (prev) => (prev ? fn(prev) : prev));
	};

	return { draftRubric, activeCommissionId, setActiveCommissionId, activeCommission, mergeRubric };
}
