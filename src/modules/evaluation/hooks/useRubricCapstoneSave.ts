'use client';

import { useCallback, useMemo, useState } from 'react';
import { useI18n } from '@/providers';
import { rubricsService } from '../services';
import type { CriteriaItem, RubricDetail } from '../types';
import { verificationOutcomes } from '../utils/capstoneUtils';

interface UseRubricCapstoneSaveOptions {
	rubricId: string;
	draftRubric: RubricDetail;
	canEdit: boolean;
	onNotify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
	saveSuccessMessage: string;
}

export function useRubricCapstoneSave({
	rubricId,
	draftRubric,
	canEdit,
	onNotify,
	saveSuccessMessage,
}: UseRubricCapstoneSaveOptions) {
	const { t, locale } = useI18n();
	const [isSaving, setIsSaving] = useState(false);

	const saveAllowed = useMemo(() => {
		const criteriaFilled = (c: CriteriaItem) => c.description[locale as 'en' | 'es'].trim().length > 0;

		const outcomeComplete = (
			outcome: (typeof draftRubric.commissions)[number]['outcomes'][number],
		) => {
			const q = outcome.questions[0];
			return q !== undefined && q.criteria.length > 0 && q.criteria.every(criteriaFilled);
		};

		const isComplete = (commission: (typeof draftRubric.commissions)[number]) => {
			const outcomes = verificationOutcomes(commission);
			return outcomes.length > 0 && outcomes.every(outcomeComplete);
		};

		const hasAnyFilled = (commission: (typeof draftRubric.commissions)[number]) =>
			verificationOutcomes(commission).some((o) => {
				const q = o.questions[0];
				return q !== undefined && q.criteria.some(criteriaFilled);
			});

		const isPartial = (commission: (typeof draftRubric.commissions)[number]) =>
			hasAnyFilled(commission) && !isComplete(commission);

		const hasComplete = draftRubric.commissions.some(isComplete);
		const hasPartial = draftRubric.commissions.some(isPartial);
		return hasComplete && !hasPartial;
	}, [draftRubric.commissions, locale]);

	const handleSave = useCallback(async () => {
		if (!canEdit || !saveAllowed) return;
		setIsSaving(true);
		try {
			const questions = draftRubric.commissions.flatMap((commission) =>
				verificationOutcomes(commission).map((outcome) => {
					const q = outcome.questions[0];
					const qId = q && !q.id.startsWith('temp-') ? Number(q.id) : undefined;
					return {
						...(qId !== undefined && { id: qId }),
						outcome_id: Number(outcome.id),
						question: { es: outcome.outcomeDescription.es, en: outcome.outcomeDescription.en },
						criterias: (q?.criteria ?? []).map((c) => {
							const cId = !c.id.startsWith('temp-') ? Number(c.id) : undefined;
							return {
								...(cId !== undefined && { id: cId }),
								criteria: { es: c.description.es, en: c.description.en },
								min_value: 0,
								max_value: 0,
							};
						}),
					};
				}),
			);
			await rubricsService.update(rubricId, { questions });
			onNotify('success', saveSuccessMessage);
		} catch {
			onNotify('error', t('rubrics.editor.capstone.saveError'));
		} finally {
			setIsSaving(false);
		}
	}, [canEdit, saveAllowed, draftRubric.commissions, rubricId, onNotify, saveSuccessMessage, t]);

	return { saveAllowed, isSaving, handleSave };
}
