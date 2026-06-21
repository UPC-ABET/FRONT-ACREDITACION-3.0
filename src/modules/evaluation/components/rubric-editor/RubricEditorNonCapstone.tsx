'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Button } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { RubricTable } from './RubricTable';
import type { RubricDetail } from '../../types';
import { MAX_COLS, MAX_QUESTIONS, TARGET_SUM } from '../../constants';
import { useRubricNonCapstoneState } from '../../hooks/useRubricNonCapstoneState';
import { useRubricNonCapstoneValidation } from '../../hooks/useRubricNonCapstoneValidation';
import { useRubricNonCapstoneSave } from '../../hooks/useRubricNonCapstoneSave';
import { cn } from '@/shared/lib/utils';

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
						className={`h-4 w-4 shrink-0 ${
							item.type === 'error' ? 'text-red-500' : 'text-amber-500'
						}`}
					/>
					{item.message}
				</li>
			))}
		</ul>
	);
}

interface RubricEditorNonCapstoneProps {
	rubric: RubricDetail;
	rubricId: string;
	canEdit: boolean;
	queryKey: readonly unknown[];
	onNotify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
	messages: { autosaveRetry: string; saveSuccess: string };
}

export function RubricEditorNonCapstone({
	rubric,
	rubricId,
	canEdit,
	queryKey,
	onNotify,
	messages,
}: RubricEditorNonCapstoneProps) {
	const { t, locale } = useI18n();

	const {
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
	} = useRubricNonCapstoneState({ rubric, queryKey, locale });

	const { isFilled, continuousValid, sumValid, rangeValid, total, validationItems } =
		useRubricNonCapstoneValidation(questions);

	const { isSaving, handleSave } = useRubricNonCapstoneSave({
		rubricId,
		questions,
		canEdit,
		isFilled,
		continuousValid,
		sumValid,
		rangeValid,
		onNotify,
		saveSuccessMessage: messages.saveSuccess,
	});

	return (
		<div className="space-y-4">
			{canEdit ? (
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
			) : null}

			<RubricTable
				questions={questions}
				columnCount={columnCount}
				canEdit={canEdit}
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

			{canEdit && questions.length < MAX_QUESTIONS ? (
				<Button type="button" variant="primary" onClick={handleAddRow}>
					<PlusIcon className="mr-1 h-4 w-4" />
					{t('rubrics.editor.nonCapstone.question.addQuestion')}
				</Button>
			) : null}

			<ValidationMessages
				items={validationItems}
				successMessage={
					isFilled && continuousValid && sumValid && rangeValid
						? t('rubrics.editor.nonCapstone.validation.validationComplete')
						: undefined
				}
			/>

			<div className="flex flex-wrap items-center justify-between gap-4">
				<span className="text-sm text-zinc-600">
					{t('rubrics.editor.nonCapstone.totalScore')}:{' '}
					<span className={cn('font-semibold', sumValid ? 'text-emerald-600' : 'text-red-600')}>
						{total.toFixed(1)} / {TARGET_SUM.toFixed(1)} {t('rubrics.editor.nonCapstone.points')}
					</span>
				</span>

				<Button
					type="button"
					variant="primary"
					disabled={
						!canEdit || !isFilled || !continuousValid || !sumValid || !rangeValid || isSaving
					}
					onClick={() => void handleSave()}
					loading={isSaving}>
					{t('rubrics.editor.nonCapstone.saveRubric')}
				</Button>
			</div>
		</div>
	);
}
