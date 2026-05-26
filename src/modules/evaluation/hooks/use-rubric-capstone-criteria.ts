'use client';

import { useState } from 'react';
import type { CriteriaItem, RubricDetail } from '../types';
import { updateOutcomeCriteria } from './use-rubric-capstone-state';

interface UseRubricCapstoneCriteriaOptions {
	locale: string;
	mergeRubric: (fn: (prev: RubricDetail) => RubricDetail) => void;
}

export function useRubricCapstoneCriteria({
	locale,
	mergeRubric,
}: UseRubricCapstoneCriteriaOptions) {
	const [savingKey, setSavingKey] = useState<string | null>(null);

	const handleAddCriteria = (commissionId: string, outcomeId: string) => {
		mergeRubric((prev) =>
			updateOutcomeCriteria(prev, commissionId, outcomeId, (criteria) => [
				...criteria,
				{ id: `temp-${Date.now()}`, description: { en: '', es: '' }, minValue: 0, maxValue: 0 },
			]),
		);
	};

	const handlePatchCriteria = async (
		commissionId: string,
		outcomeId: string,
		criteriaId: string,
		text: string,
	) => {
		setSavingKey(criteriaId);
		try {
			mergeRubric((prev) =>
				updateOutcomeCriteria(prev, commissionId, outcomeId, (criteria) =>
					criteria.map((c) =>
						c.id === criteriaId ? { ...c, description: { ...c.description, [locale]: text } } : c,
					),
				),
			);
		} finally {
			setSavingKey(null);
		}
	};

	const handleCreateCriteria = async (commissionId: string, outcomeId: string, text: string) => {
		setSavingKey(`${outcomeId}__create`);
		try {
			mergeRubric((prev) =>
				updateOutcomeCriteria(prev, commissionId, outcomeId, (criteria) => {
					const tempIndex = criteria.findIndex((c) => c.id.startsWith('temp-'));
					const next: CriteriaItem = {
						id: `temp-${Date.now()}`,
						description: { en: text, es: text },
						minValue: 0,
						maxValue: 0,
					};
					if (tempIndex === -1) return [...criteria, next];
					const arr = [...criteria];
					arr[tempIndex] = next;
					return arr;
				}),
			);
		} finally {
			setSavingKey(null);
		}
	};

	const handleDeleteCriteria = async (
		commissionId: string,
		outcomeId: string,
		criteriaId: string,
	) => {
		setSavingKey(criteriaId);
		try {
			mergeRubric((prev) =>
				updateOutcomeCriteria(prev, commissionId, outcomeId, (criteria) =>
					criteria.filter((c) => c.id !== criteriaId),
				),
			);
		} finally {
			setSavingKey(null);
		}
	};

	const handleDeleteCriteriaLocal = (
		commissionId: string,
		outcomeId: string,
		criteriaId: string,
	) => {
		mergeRubric((prev) =>
			updateOutcomeCriteria(prev, commissionId, outcomeId, (criteria) =>
				criteria.filter((c) => c.id !== criteriaId),
			),
		);
	};

	const handleTextChange = (
		commissionId: string,
		outcomeId: string,
		criteriaId: string,
		text: string,
	) => {
		mergeRubric((prev) =>
			updateOutcomeCriteria(prev, commissionId, outcomeId, (criteria) =>
				criteria.map((c) =>
					c.id === criteriaId ? { ...c, description: { ...c.description, [locale]: text } } : c,
				),
			),
		);
	};

	return {
		savingKey,
		handleAddCriteria,
		handlePatchCriteria,
		handleCreateCriteria,
		handleDeleteCriteria,
		handleDeleteCriteriaLocal,
		handleTextChange,
	};
}
