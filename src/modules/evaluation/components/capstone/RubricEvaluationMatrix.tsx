'use client';

import { useMemo, useState } from 'react';
import { Button, Card } from '@/shared/components';
import { useI18n } from '@/providers';
import { interpolate } from '@/shared/utils';
import { MIN_OBSERVATION_CHARS, RUBRIC_TOTAL_SCORE } from '../../constants/capstone';
import type {
	CapstoneRubric,
	CapstoneStudentEvaluation,
	SubmitCapstoneEvaluationPayload,
} from '../../types/capstone';
import RubricCriterionSlider from './RubricCriterionSlider';

interface RubricEvaluationMatrixProps {
	rubric: CapstoneRubric;
	student: { id: number; code: string; name: string };
	onSubmit: (payload: SubmitCapstoneEvaluationPayload) => Promise<void>;
}

export default function RubricEvaluationMatrix({
	rubric,
	student,
	onSubmit,
}: RubricEvaluationMatrixProps) {
	const { t } = useI18n();
	const [evaluation, setEvaluation] = useState<CapstoneStudentEvaluation>({
		student_id: student.id,
		student_code: student.code,
		student_name: student.name,
		scores: {},
		observation: '',
	});
	const [submitting, setSubmitting] = useState(false);

	const totalScore = useMemo(
		() => rubric.criteria.reduce((sum, c) => sum + (evaluation.scores[c.id] ?? 0), 0),
		[rubric.criteria, evaluation.scores],
	);
	const maxPossible = useMemo(
		() => rubric.criteria.reduce((sum, c) => sum + c.max_score, 0),
		[rubric.criteria],
	);

	// Business rule: the sum of per-criterion max_score must equal RUBRIC_TOTAL_SCORE.
	// If it doesn't, the rubric itself is misconfigured and the save button stays disabled.
	const rubricConfigValid = maxPossible === RUBRIC_TOTAL_SCORE;
	const observationValid = evaluation.observation.trim().length >= MIN_OBSERVATION_CHARS;
	const allCriteriaScored = rubric.criteria.every((c) => evaluation.scores[c.id] !== undefined);
	const canSubmit = rubricConfigValid && observationValid && allCriteriaScored && !submitting;

	const handleScoreChange = (criterionId: number, score: number) => {
		setEvaluation((prev) => ({
			...prev,
			scores: { ...prev.scores, [criterionId]: score },
		}));
	};

	const handleSubmit = async () => {
		if (!canSubmit) return;
		setSubmitting(true);
		try {
			await onSubmit({
				project_id: rubric.project_id,
				rubric_id: rubric.id,
				student_id: student.id,
				scores: Object.entries(evaluation.scores).map(([cid, score]) => ({
					criterion_id: Number(cid),
					score,
				})),
				observation: evaluation.observation.trim(),
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Card
			title={interpolate(t('capstone.matrix.title'), {
				name: student.name,
				code: student.code,
			})}
			description={t('capstone.matrix.description')}>
			<div className="space-y-3">
				{rubric.criteria.map((criterion) => (
					<RubricCriterionSlider
						key={criterion.id}
						criterion={criterion}
						value={evaluation.scores[criterion.id] ?? 0}
						onChange={(v) => handleScoreChange(criterion.id, v)}
					/>
				))}
			</div>

			{!rubricConfigValid && (
				<div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
					⚠️{' '}
					{interpolate(t('capstone.matrix.invalidRubric'), {
						actual: String(maxPossible),
						expected: String(RUBRIC_TOTAL_SCORE),
					})}
				</div>
			)}

			<div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-gray-700">{t('capstone.matrix.sumLabel')}</span>
					<span
						className={`text-lg font-bold ${
							rubricConfigValid && totalScore === maxPossible ? 'text-green-600' : 'text-gray-700'
						}`}>
						{totalScore} / {maxPossible}
					</span>
				</div>
			</div>

			<div className="mt-4">
				<label
					htmlFor="capstone-observation"
					className="mb-1 block text-xs font-medium text-gray-600">
					{t('capstone.matrix.observationLabel')} ({evaluation.observation.length}/
					{MIN_OBSERVATION_CHARS}+)
				</label>
				<textarea
					id="capstone-observation"
					rows={4}
					value={evaluation.observation}
					onChange={(e) => setEvaluation((prev) => ({ ...prev, observation: e.target.value }))}
					className={`w-full rounded-md border px-3 py-2 text-sm ${
						observationValid ? 'border-gray-300' : 'border-red-300 bg-red-50'
					}`}
					placeholder={t('capstone.matrix.observationPlaceholder')}
				/>
				{!observationValid && (
					<p className="mt-1 text-xs text-red-600">
						{interpolate(t('capstone.matrix.observationHint'), {
							min: String(MIN_OBSERVATION_CHARS),
						})}
					</p>
				)}
			</div>

			<div className="mt-4 flex justify-end">
				<Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
					{submitting ? t('capstone.matrix.saving') : t('capstone.matrix.save')}
				</Button>
			</div>
		</Card>
	);
}
