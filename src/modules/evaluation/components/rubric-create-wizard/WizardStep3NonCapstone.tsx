'use client';

import { useCallback, useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Button } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { RubricTable } from '../rubric-editor/RubricTable';
import type { RubricQuestion, QuestionCriteria } from '../../types';
import type { Step1Data } from './WizardStep1';
import type { Step2Data } from './WizardStep2';
import { MAX_COLS, MAX_QUESTIONS, TARGET_SUM } from '../../constants';

export interface NonCapstonePayloadQuestion {
	question: { es: string; en: string };
	criterias: { criteria: { es: string; en: string }; minValue: number; maxValue: number }[];
}

interface WizardStep3NonCapstoneProps {
	step1: Step1Data;
	step2: Step2Data;
	onBack: () => void;
	onSubmit: (questions: NonCapstonePayloadQuestion[]) => Promise<void>;
	isSubmitting: boolean;
}

function newCriteria(): QuestionCriteria {
	return { id: null, criteriaText: { en: '', es: '' }, minValue: '', maxValue: '' };
}

function computeTotal(questions: RubricQuestion[]): number {
	return questions.reduce((sum, q) => {
		const last = q.criteria[q.criteria.length - 1];
		return sum + (last && typeof last.maxValue === 'number' ? last.maxValue : 0);
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

function allFilled(questions: RubricQuestion[], locale: 'en' | 'es'): boolean {
	return questions.every(
		(q) =>
			q.questionText[locale].trim().length > 0 &&
			q.criteria.length > 0 &&
			q.criteria.every(
				(c) =>
					c.criteriaText[locale].trim().length > 0 &&
					c.minValue !== '' &&
					c.maxValue !== '' &&
					typeof c.minValue === 'number' &&
					typeof c.maxValue === 'number',
			),
	);
}

function ValidationMessages({
	items,
	successMessage,
}: {
	items: { message: string; type: 'error' | 'warning' }[];
	successMessage?: string;
}) {
	if (!items.length && successMessage) {
		return (
			<ul className="space-y-1 text-sm">
				<li className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
					<CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
					{successMessage}
				</li>
			</ul>
		);
	}
	if (!items.length) return null;
	return (
		<ul className="space-y-1 text-sm">
			{items.map((item, i) => (
				<li
					key={i}
					className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
						item.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'
					}`}>
					<ExclamationTriangleIcon
						className={`h-4 w-4 shrink-0 ${item.type === 'error' ? 'text-red-500' : 'text-amber-500'}`}
					/>
					{item.message}
				</li>
			))}
		</ul>
	);
}

export function WizardStep3NonCapstone({
	step1,
	step2,
	onBack,
	onSubmit,
	isSubmitting,
}: WizardStep3NonCapstoneProps) {
	const { t, locale } = useI18n();

	const [questions, setQuestions] = useState<RubricQuestion[]>([
		{ id: `temp-0`, order: 1, questionText: { en: '', es: '' }, criteria: [newCriteria()] },
	]);
	const [columnCount, setColumnCount] = useState(1);

	const total = useMemo(() => computeTotal(questions), [questions]);
	const isFilled = useMemo(() => allFilled(questions, locale), [questions, locale]);
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

	const update = useCallback((next: RubricQuestion[]) => setQuestions(next), []);

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

	const handleDeleteRow = (ri: number) =>
		update(questions.filter((_, i) => i !== ri).map((q, i) => ({ ...q, order: i + 1 })));

	const handleQuestionTextChange = (ri: number, text: string) =>
		update(
			questions.map((q, i) =>
				i === ri ? { ...q, questionText: { ...q.questionText, [locale]: text } } : q,
			),
		);

	const handleAddColumn = () => {
		if (columnCount >= MAX_COLS) return;
		setColumnCount((c) => c + 1);
		update(questions.map((q) => ({ ...q, criteria: [...q.criteria, newCriteria()] })));
	};

	const handleDeleteColumn = (ci: number) => {
		setColumnCount((c) => Math.max(1, c - 1));
		update(questions.map((q) => ({ ...q, criteria: q.criteria.filter((_, i) => i !== ci) })));
	};

	const handleCriteriaTextChange = (ri: number, ci: number, text: string) =>
		update(
			questions.map((q, i) =>
				i !== ri
					? q
					: {
							...q,
							criteria: q.criteria.map((c, j) =>
								j === ci ? { ...c, criteriaText: { ...c.criteriaText, [locale]: text } } : c,
							),
						},
			),
		);

	const handleCriteriaMinChange = (ri: number, ci: number, v: number | '') =>
		update(
			questions.map((q, i) =>
				i !== ri
					? q
					: { ...q, criteria: q.criteria.map((c, j) => (j === ci ? { ...c, minValue: v } : c)) },
			),
		);

	const handleCriteriaMaxChange = (ri: number, ci: number, v: number | '') =>
		update(
			questions.map((q, i) =>
				i !== ri
					? q
					: { ...q, criteria: q.criteria.map((c, j) => (j === ci ? { ...c, maxValue: v } : c)) },
			),
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
	}, [isFilled, continuousValid, sumValid, total, rangeValid, t]);

	const canSave = isFilled && continuousValid && sumValid && rangeValid;

	const handleSubmit = async () => {
		if (!canSave) return;
		await onSubmit(
			questions.map((q) => ({
				question: { es: q.questionText.es, en: q.questionText.en },
				criterias: q.criteria.map((c) => ({
					criteria: { es: c.criteriaText.es, en: c.criteriaText.en },
					minValue: c.minValue as number,
					maxValue: c.maxValue as number,
				})),
			})),
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-end gap-2">
				{columnCount >= MAX_COLS && (
					<p className="text-xs text-zinc-500" role="status">
						{t('rubrics.editor.nonCapstone.tooltips.maxCols')}
					</p>
				)}
				<Button
					type="button"
					variant="primary"
					disabled={columnCount >= MAX_COLS}
					onClick={handleAddColumn}>
					<PlusIcon className="mr-1 h-4 w-4" />
					{t('rubrics.editor.nonCapstone.criteria.addCriteria')}
				</Button>
			</div>

			<RubricTable
				questions={questions}
				columnCount={columnCount}
				canEdit={true}
				locale={locale}
				questionLabelPrefix={t('rubrics.editor.nonCapstone.question.label')}
				questionPlaceholder={t('rubrics.editor.nonCapstone.question.placeholder')}
				criteriaHeader={t('rubrics.editor.nonCapstone.criteria.label')}
				criteriaPlaceholder={t('rubrics.editor.nonCapstone.criteria.placeholder')}
				minScoreLabel={t('rubrics.editor.nonCapstone.score.minScoreLabel')}
				maxScoreLabel={t('rubrics.editor.nonCapstone.score.maxScoreLabel')}
				onDeleteColumn={handleDeleteColumn}
				onDeleteRow={handleDeleteRow}
				onQuestionTextChange={handleQuestionTextChange}
				onCriteriaTextChange={handleCriteriaTextChange}
				onCriteriaMinChange={handleCriteriaMinChange}
				onCriteriaMaxChange={handleCriteriaMaxChange}
			/>

			{questions.length < MAX_QUESTIONS && (
				<Button type="button" variant="primary" onClick={handleAddRow}>
					<PlusIcon className="mr-1 h-4 w-4" />
					{t('rubrics.editor.nonCapstone.question.addQuestion')}
				</Button>
			)}

			<ValidationMessages
				items={validationItems}
				successMessage={
					canSave ? t('rubrics.editor.nonCapstone.validation.validationComplete') : undefined
				}
			/>

			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<span className="text-sm text-zinc-600">
						{t('rubrics.editor.nonCapstone.totalScore')}:{' '}
						<span className={`font-semibold ${sumValid ? 'text-emerald-600' : 'text-red-600'}`}>
							{total.toFixed(1)} / {TARGET_SUM.toFixed(1)} {t('rubrics.editor.nonCapstone.points')}
						</span>
					</span>
				</div>

				<div className="flex gap-3">
					<Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
						{t('rubrics.wizard.step3.back')}
					</Button>
					<Button
						type="button"
						variant="primary"
						disabled={!canSave || isSubmitting}
						onClick={() => void handleSubmit()}>
						{isSubmitting ? t('rubrics.wizard.step3.submitting') : t('rubrics.wizard.step3.submit')}
					</Button>
				</div>
			</div>
		</div>
	);
}
