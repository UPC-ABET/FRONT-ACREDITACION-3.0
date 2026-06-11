'use client';

import { useMemo } from 'react';
import { useI18n } from '@/providers';
import type { RubricQuestion } from '../types';
import { TARGET_SUM } from '../constants';

function computeTotal(questions: RubricQuestion[]): number {
	return questions.reduce((sum, q) => {
		const last = q.criteria[q.criteria.length - 1];
		if (!last) return sum;
		return sum + (typeof last.maxValue === 'number' ? last.maxValue : 0);
	}, 0);
}

function isContinuousScores(questions: RubricQuestion[]): boolean {
	return questions.every((q) =>
		q.criteria.every((c, ci) => {
			if (ci === 0) return true;
			const prev = q.criteria[ci - 1];
			return (
				typeof c.minValue === 'number' &&
				typeof prev.maxValue === 'number' &&
				c.minValue > prev.maxValue
			);
		}),
	);
}

function isAllFilled(questions: RubricQuestion[], locale: string): boolean {
	return questions.every(
		(q) =>
			q.questionText[locale as 'en' | 'es'].trim().length > 0 &&
			q.criteria.length > 0 &&
			q.criteria.every(
				(c) =>
					c.criteriaText[locale as 'en' | 'es'].trim().length > 0 &&
					c.minValue !== '' &&
					c.maxValue !== '' &&
					typeof c.minValue === 'number' &&
					typeof c.maxValue === 'number',
			),
	);
}

export function useRubricNonCapstoneValidation(questions: RubricQuestion[]) {
	const { t, locale } = useI18n();

	const total = useMemo(() => computeTotal(questions), [questions]);
	const isFilled = useMemo(() => isAllFilled(questions, locale), [questions, locale]);
	const continuousValid = useMemo(() => isContinuousScores(questions), [questions]);
	const sumValid = Math.abs(total - TARGET_SUM) < 0.001;
	const rangeValid = useMemo(
		() =>
			questions.every((q) =>
				q.criteria.every(
					(c) =>
						c.minValue === '' ||
						c.maxValue === '' ||
						(typeof c.minValue === 'number' &&
							typeof c.maxValue === 'number' &&
							c.minValue < c.maxValue),
				),
			),
		[questions],
	);

	const validationItems = useMemo(() => {
		const items: { message: string; type: 'error' | 'warning' }[] = [];
		if (!isFilled)
			items.push({
				message: t('rubrics.editor.nonCapstone.validation.allFieldsRequired'),
				type: 'warning',
			});
		if (!continuousValid)
			items.push({
				message: t('rubrics.editor.nonCapstone.validation.continuityRequired'),
				type: 'error',
			});
		if (!sumValid)
			items.push({
				message: t('rubrics.editor.nonCapstone.validation.totalMustBe20').replace(
					'{{total}}',
					String(total),
				),
				type: 'error',
			});
		if (!rangeValid)
			items.push({
				message: t('rubrics.editor.nonCapstone.validation.minMustBeLessThanMax'),
				type: 'error',
			});
		return items;
	}, [isFilled, continuousValid, sumValid, total, t, rangeValid]);

	return { isFilled, continuousValid, sumValid, rangeValid, total, validationItems };
}
