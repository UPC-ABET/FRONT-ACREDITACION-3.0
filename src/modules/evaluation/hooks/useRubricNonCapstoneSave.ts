'use client';

import { useCallback, useState } from 'react';
import { useI18n } from '@/providers';
import { rubricsService } from '../services';
import type { RubricQuestion } from '../types';

interface UseRubricNonCapstoneSaveOptions {
	rubricId: string;
	questions: RubricQuestion[];
	canEdit: boolean;
	isFilled: boolean;
	continuousValid: boolean;
	sumValid: boolean;
	rangeValid: boolean;
	onNotify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
	saveSuccessMessage: string;
}

export function useRubricNonCapstoneSave({
	rubricId,
	questions,
	canEdit,
	isFilled,
	continuousValid,
	sumValid,
	rangeValid,
	onNotify,
	saveSuccessMessage,
}: UseRubricNonCapstoneSaveOptions) {
	const { t } = useI18n();
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = useCallback(async () => {
		if (!canEdit || !isFilled || !continuousValid || !sumValid || !rangeValid) return;
		setIsSaving(true);
		try {
			await rubricsService.update(rubricId, {
				questions: questions.map((q) => {
					const qId = q.id && !q.id.startsWith('temp-') ? Number(q.id) : undefined;
					return {
						...(qId !== undefined && { id: qId }),
						question: { es: q.questionText.es, en: q.questionText.en },
						criterias: q.criteria.map((c) => {
							const cId = c.id && !c.id.startsWith('temp-') ? Number(c.id) : undefined;
							return {
								...(cId !== undefined && { id: cId }),
								criteria: { es: c.criteriaText.es, en: c.criteriaText.en },
								min_value: c.minValue as number,
								max_value: c.maxValue as number,
							};
						}),
					};
				}),
			});
			onNotify('success', saveSuccessMessage);
		} catch {
			onNotify('error', t('rubrics.editor.nonCapstone.saveError'));
		} finally {
			setIsSaving(false);
		}
	}, [
		canEdit,
		isFilled,
		continuousValid,
		sumValid,
		rangeValid,
		rubricId,
		questions,
		onNotify,
		saveSuccessMessage,
		t,
	]);

	return { isSaving, handleSave };
}
