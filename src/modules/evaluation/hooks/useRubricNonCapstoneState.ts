'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RubricDetail, RubricQuestion, QuestionCriteria } from '../types';
import { MAX_COLS, MAX_QUESTIONS } from '../constants';

function newCriteria(): QuestionCriteria {
	return { id: null, criteriaText: { en: '', es: '' }, minValue: '', maxValue: '' };
}

function buildShape(from: RubricQuestion[] | null | undefined): {
	questions: RubricQuestion[];
	columnCount: number;
} {
	const safe = Array.isArray(from) && from.length > 0 ? from : null;
	if (!safe) {
		return {
			questions: [
				{ id: null, order: 1, questionText: { en: '', es: '' }, criteria: [newCriteria()] },
			],
			columnCount: 1,
		};
	}
	const columnCount = Math.max(1, ...safe.map((q) => q.criteria?.length ?? 0));
	const questions = safe.map((q, i) => ({
		...q,
		order: q.order || i + 1,
		criteria: [
			...(Array.isArray(q.criteria) ? q.criteria : []),
			...Array.from({ length: Math.max(0, columnCount - (q.criteria?.length ?? 0)) }, newCriteria),
		],
	}));
	return { questions, columnCount };
}

interface UseRubricNonCapstoneStateOptions {
	rubric: RubricDetail;
	queryKey: readonly unknown[];
	locale: string;
}

export function useRubricNonCapstoneState({
	rubric,
	queryKey,
	locale,
}: UseRubricNonCapstoneStateOptions) {
	const queryClient = useQueryClient();

	const [questions, setQuestions] = useState<RubricQuestion[]>(
		() => buildShape(rubric.questions).questions,
	);
	const [columnCount, setColumnCount] = useState(() => buildShape(rubric.questions).columnCount);

	useEffect(() => {
		const { questions: q, columnCount: c } = buildShape(rubric.questions);
		setQuestions(q);
		setColumnCount(c);
		// note: Intentionally depends only on rubric.id to re-sync state when switching between different rubrics
	}, [rubric.id]); // eslint-disable-line react-hooks/exhaustive-deps

	const update = useCallback(
		(next: RubricQuestion[]) => {
			setQuestions(next);
			queryClient.setQueryData<RubricDetail>(queryKey, (prev) =>
				prev ? { ...prev, questions: next } : prev,
			);
		},
		[queryClient, queryKey],
	);

	const handleAddRow = () => {
		if (questions.length >= MAX_QUESTIONS) return;
		update([
			...questions,
			{
				id: `temp-${Date.now()}`,
				order: questions.length + 1,
				questionText: { en: '', es: '' },
				criteria: Array.from({ length: columnCount }, newCriteria),
			},
		]);
	};

	const handleDeleteRow = (rowIndex: number) => {
		update(questions.filter((_, i) => i !== rowIndex).map((q, i) => ({ ...q, order: i + 1 })));
	};

	const handleQuestionTextChange = (rowIndex: number, text: string) => {
		update(
			questions.map((q, i) =>
				i === rowIndex ? { ...q, questionText: { ...q.questionText, [locale]: text } } : q,
			),
		);
	};

	const handleAddColumn = () => {
		if (columnCount >= MAX_COLS) return;
		setColumnCount((c) => c + 1);
		update(questions.map((q) => ({ ...q, criteria: [...q.criteria, newCriteria()] })));
	};

	const handleDeleteColumn = (colIndex: number) => {
		setColumnCount((c) => Math.max(1, c - 1));
		update(
			questions.map((q) => ({
				...q,
				criteria: q.criteria.filter((_, ci) => ci !== colIndex),
			})),
		);
	};

	const handleCriteriaTextChange = (rowIndex: number, colIndex: number, text: string) => {
		update(
			questions.map((q, i) =>
				i !== rowIndex
					? q
					: {
							...q,
							criteria: q.criteria.map((c, ci) =>
								ci === colIndex ? { ...c, criteriaText: { ...c.criteriaText, [locale]: text } } : c,
							),
						},
			),
		);
	};

	const handleCriteriaMinChange = (rowIndex: number, colIndex: number, v: number | '') => {
		update(
			questions.map((q, i) =>
				i !== rowIndex
					? q
					: {
							...q,
							criteria: q.criteria.map((c, ci) => (ci === colIndex ? { ...c, minValue: v } : c)),
						},
			),
		);
	};

	const handleCriteriaMaxChange = (rowIndex: number, colIndex: number, v: number | '') => {
		update(
			questions.map((q, i) =>
				i !== rowIndex
					? q
					: {
							...q,
							criteria: q.criteria.map((c, ci) => (ci === colIndex ? { ...c, maxValue: v } : c)),
						},
			),
		);
	};

	return {
		questions,
		columnCount,
		handleAddRow,
		handleDeleteRow,
		handleQuestionTextChange,
		handleAddColumn,
		handleDeleteColumn,
		handleCriteriaTextChange,
		handleCriteriaMinChange,
		handleCriteriaMaxChange,
	};
}
