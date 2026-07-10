'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/providers';
import { useSubmitEvaluation } from './useEvaluations';
import type { RubricQuestionDetailsResponse, ProjectDetailsStudentResponse } from '../types';
import {
	validateScore,
	type Scores,
	type DupScores,
	type CriteriaScoreEntry,
} from '../components/project-evaluate/singleCompetencyRubricUtils';

interface UseSingleCompetencyRubricTableOptions {
	questions: RubricQuestionDetailsResponse[];
	students: ProjectDetailsStudentResponse[];
	evaluatorId: number;
	rubricId: number;
	projectId: string | number;
	qualifStatuses: Record<number, number | null>;
	nrNaTypeIds: Set<number>;
	onDirtyChange?: (isDirty: boolean) => void;
}

export function useSingleCompetencyRubricTable({
	questions,
	students,
	evaluatorId,
	rubricId,
	projectId,
	qualifStatuses,
	nrNaTypeIds,
	onDirtyChange,
}: UseSingleCompetencyRubricTableOptions) {
	const { t, locale } = useI18n();
	const { mutateAsync: submitEvaluation, isPending } = useSubmitEvaluation(projectId);

	const [duplicateMode, setDuplicateMode] = useState(false);
	const [isDirty, setIsDirty] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const closeSuccessModal = () => setShowSuccessModal(false);

	const markDirty = () => {
		if (!isDirty) {
			setIsDirty(true);
			onDirtyChange?.(true);
		}
	};

	// Business rule: only ONE criteria per question will ever carry scores.
	// Find that criteria first, then read each student's entry from it.

	const initialScores = useMemo<Scores>(() => {
		const result: Scores = {};

		for (const q of questions) {
			result[q.id] = {};

			students.forEach((st, stIdx) => {
				// Show scores from whichever evaluator saved first — any evaluator can overwrite
				let found = '';
				for (const c of q.criterias) {
					const entry = c.scores?.find((s) => s.studentId === st.id);
					if (entry != null) {
						found = String(entry.score);
						break;
					}
				}
				result[q.id][stIdx] = found;
			});
		}

		return result;
	}, [questions, students]);

	const initialDupScores = useMemo<DupScores>(() => {
		const result: DupScores = {};
		for (const q of questions) result[q.id] = '';
		return result;
	}, [questions]);

	const [scores, setScores] = useState<Scores>(initialScores);
	const [dupScores, setDupScores] = useState<DupScores>(initialDupScores);

	const [trackedInitialScores, setTrackedInitialScores] = useState(initialScores);
	if (initialScores !== trackedInitialScores) {
		setTrackedInitialScores(initialScores);
		setScores(initialScores);
	}

	const ranges = useMemo(() => {
		const result: Record<number, { min: number; max: number }> = {};
		for (const q of questions) {
			const mins = q.criterias.map((c) => parseFloat(c.minValue));
			const maxs = q.criterias.map((c) => parseFloat(c.maxValue));
			result[q.id] = { min: Math.min(...mins), max: Math.max(...maxs) };
		}
		return result;
	}, [questions]);

	const msgNaN = t('projects.evaluate.rubric.errorNaN');
	const msgRange = t('projects.evaluate.rubric.errorRange');

	const hasMissingStatus = useMemo(
		() => students.some((st) => qualifStatuses[st.id] == null),
		[students, qualifStatuses],
	);

	const allFilled = useMemo(() => {
		if (!questions.length) return false;
		if (hasMissingStatus) return false;
		const hasGraded = students.some((st) => !nrNaTypeIds.has(qualifStatuses[st.id] ?? -1));
		for (const q of questions) {
			if (duplicateMode) {
				if (hasGraded && !dupScores[q.id]?.trim()) return false;
			} else {
				for (let stIdx = 0; stIdx < students.length; stIdx++) {
					if (nrNaTypeIds.has(qualifStatuses[students[stIdx].id] ?? -1)) continue;
					if (!scores[q.id]?.[stIdx]?.trim()) return false;
				}
			}
		}
		return true;
	}, [
		questions,
		students,
		duplicateMode,
		scores,
		dupScores,
		qualifStatuses,
		nrNaTypeIds,
		hasMissingStatus,
	]);

	const hasErrors = useMemo(() => {
		for (const q of questions) {
			const range = ranges[q.id] ?? { min: 0, max: 0 };
			const check = (val: string) => !!validateScore(val, range, msgNaN, msgRange);
			if (duplicateMode) {
				if (check(dupScores[q.id] ?? '')) return true;
			} else {
				for (let stIdx = 0; stIdx < students.length; stIdx++) {
					if (check(scores[q.id]?.[stIdx] ?? '')) return true;
				}
			}
		}
		return false;
	}, [questions, students.length, duplicateMode, scores, dupScores, ranges, msgNaN, msgRange]);

	const canSave = allFilled && !hasErrors && isDirty;

	const handleScore = (qId: number, stIdx: number, val: string): void => {
		markDirty();
		setScores((prev) => ({ ...prev, [qId]: { ...prev[qId], [stIdx]: val } }));
	};

	const handleDupScore = (qId: number, val: string): void => {
		markDirty();
		setDupScores((prev) => ({ ...prev, [qId]: val }));
	};

	const findMatchingCriteria = (q: RubricQuestionDetailsResponse, score: number) =>
		q.criterias.find((c) => {
			const min = parseFloat(c.minValue);
			const max = parseFloat(c.maxValue);
			return score >= min && score <= max;
		});

	const handleSave = async (): Promise<void> => {
		const studentPayloads = new Map<number, CriteriaScoreEntry[]>();

		for (const q of questions) {
			// Lowest-range criteria used for NR/NA students (score 0)
			const lowestCriteria = q.criterias.reduce((a, b) =>
				parseFloat(a.minValue) <= parseFloat(b.minValue) ? a : b,
			);

			if (duplicateMode) {
				const raw = dupScores[q.id]?.trim();
				const dupScore = raw ? parseFloat(raw) : NaN;
				const matchedCriteria = !isNaN(dupScore) ? findMatchingCriteria(q, dupScore) : undefined;

				for (const st of students) {
					const isNrNa = nrNaTypeIds.has(qualifStatuses[st.id] ?? -1);
					const existing: CriteriaScoreEntry[] = studentPayloads.get(st.id) ?? [];
					if (isNrNa) {
						existing.push({
							rubricQuestionCriteriaId: lowestCriteria.id,
							score: 0,
							commentaries: {},
						});
					} else {
						if (!matchedCriteria || isNaN(dupScore)) continue;
						existing.push({
							rubricQuestionCriteriaId: matchedCriteria.id,
							score: dupScore,
							commentaries: {},
						});
					}
					studentPayloads.set(st.id, existing);
				}
			} else {
				students.forEach((st, stIdx) => {
					const isNrNa = nrNaTypeIds.has(qualifStatuses[st.id] ?? -1);
					const existing: CriteriaScoreEntry[] = studentPayloads.get(st.id) ?? [];
					if (isNrNa) {
						existing.push({
							rubricQuestionCriteriaId: lowestCriteria.id,
							score: 0,
							commentaries: {},
						});
					} else {
						const raw = scores[q.id]?.[stIdx]?.trim();
						if (!raw) return;
						const score = parseFloat(raw);
						if (isNaN(score)) return;
						const matchedCriteria = findMatchingCriteria(q, score);
						if (!matchedCriteria) return;
						existing.push({
							rubricQuestionCriteriaId: matchedCriteria.id,
							score,
							commentaries: {},
						});
					}
					studentPayloads.set(st.id, existing);
				});
			}
		}

		const entries = [...studentPayloads.entries()].filter(([, s]) => s.length > 0);
		if (entries.length === 0) return;

		try {
			await Promise.all(
				entries.map(([projectStudentId, criteriaScores]) =>
					submitEvaluation({
						projectStudentId,
						projectEvaluatorId: evaluatorId,
						rubricId: rubricId,
						observation: { es: '', en: '' },
						scores: criteriaScores,
						qualificationStatusTypeId: qualifStatuses[projectStudentId],
					}),
				),
			);
			setIsDirty(false);
			onDirtyChange?.(false);
			setShowSuccessModal(true);
		} catch {
			// Errors are surfaced via the mutation's own error state; nothing further to do here.
		}
	};

	return {
		locale,
		isPending,
		duplicateMode,
		setDuplicateMode,
		scores,
		dupScores,
		ranges,
		msgNaN,
		msgRange,
		hasMissingStatus,
		allFilled,
		hasErrors,
		canSave,
		isDirty,
		showSuccessModal,
		closeSuccessModal,
		handleScore,
		handleDupScore,
		handleSave,
		t,
	};
}
