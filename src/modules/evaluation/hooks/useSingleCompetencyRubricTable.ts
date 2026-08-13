'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/providers';
import type { I18nValue } from '@/shared/components/ui/I18nTextField';
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
	nonAttendanceTypeIds: Set<number>;
	onDirtyChange?: (isDirty: boolean) => void;
	/** Keyed by projectStudentId — each student has their own observation, edited at the page level. */
	observations: Record<number, I18nValue>;
	/** True when the parent panel has unsaved attendance or observation edits — neither is
	 * tracked by this hook's own isDirty, but both must still unlock saving so they get submitted. */
	attendanceDirty?: boolean;
}

export function useSingleCompetencyRubricTable({
	questions,
	students,
	evaluatorId,
	rubricId,
	projectId,
	qualifStatuses,
	nonAttendanceTypeIds,
	onDirtyChange,
	observations,
	attendanceDirty = false,
}: UseSingleCompetencyRubricTableOptions) {
	const { t, locale } = useI18n();
	const { mutateAsync: submitEvaluation, isPending } = useSubmitEvaluation(projectId);

	const [duplicateMode, setDuplicateMode] = useState(false);
	const [isDirty, setIsDirty] = useState(false);

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

	// Reseed from the server only while there is nothing unsaved to overwrite: a refetch
	// triggered by saving another tab must not discard this tab's in-progress edits.
	const [trackedInitialScores, setTrackedInitialScores] = useState(initialScores);
	if (initialScores !== trackedInitialScores) {
		setTrackedInitialScores(initialScores);
		if (!isDirty) setScores(initialScores);
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
		const hasGraded = students.some((st) => !nonAttendanceTypeIds.has(qualifStatuses[st.id] ?? -1));
		for (const q of questions) {
			if (duplicateMode) {
				if (hasGraded && !dupScores[q.id]?.trim()) return false;
			} else {
				for (let stIdx = 0; stIdx < students.length; stIdx++) {
					if (nonAttendanceTypeIds.has(qualifStatuses[students[stIdx].id] ?? -1)) continue;
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
		nonAttendanceTypeIds,
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

	const canSave = allFilled && !hasErrors && (isDirty || attendanceDirty);

	const handleScore = (qId: number, stIdx: number, val: string): void => {
		markDirty();
		setScores((prev) => ({ ...prev, [qId]: { ...prev[qId], [stIdx]: val } }));
	};

	const handleDupScore = (qId: number, val: string): void => {
		markDirty();
		setDupScores((prev) => ({ ...prev, [qId]: val }));
	};

	// Switching modes must not lose what the evaluator already entered: going to individual
	// spreads the shared duplicate value onto every student; going back to duplicate takes the
	// first student's score as the shared value.
	const handleToggleDuplicateMode = (next: boolean): void => {
		if (next === duplicateMode) return;
		if (next) {
			setDupScores((prev) => {
				const result: DupScores = { ...prev };
				for (const q of questions) result[q.id] = scores[q.id]?.[0] ?? prev[q.id] ?? '';
				return result;
			});
		} else {
			setScores((prev) => {
				const result: Scores = { ...prev };
				for (const q of questions) {
					const dupVal = dupScores[q.id] ?? '';
					const row: Record<number, string> = { ...result[q.id] };
					students.forEach((_, stIdx) => {
						row[stIdx] = dupVal;
					});
					result[q.id] = row;
				}
				return result;
			});
		}
		setDuplicateMode(next);
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
					const isNonAttendance = nonAttendanceTypeIds.has(qualifStatuses[st.id] ?? -1);
					const existing: CriteriaScoreEntry[] = studentPayloads.get(st.id) ?? [];
					if (isNonAttendance) {
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
					const isNonAttendance = nonAttendanceTypeIds.has(qualifStatuses[st.id] ?? -1);
					const existing: CriteriaScoreEntry[] = studentPayloads.get(st.id) ?? [];
					if (isNonAttendance) {
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

		// Errors propagate to the caller, which owns the save-all feedback dialogs.
		await Promise.all(
			entries.map(([projectStudentId, criteriaScores]) => {
				const observation = observations[projectStudentId];
				const observationEs = observation?.es?.trim() ?? '';
				const observationEn = observation?.en?.trim() ?? '';
				// Stored/read as a localized record ({ es, en }); keep the write shape in sync with
				// ProjectRubricItemStudentResponse.observation so a refetch repopulates the textareas.
				const observationPayload =
					observationEs || observationEn ? { es: observationEs, en: observationEn } : undefined;
				return submitEvaluation({
					projectStudentId,
					projectEvaluatorId: evaluatorId,
					rubricId: rubricId,
					observation: observationPayload,
					scores: criteriaScores,
					qualificationStatusTypeId: qualifStatuses[projectStudentId],
				});
			}),
		);
		setIsDirty(false);
		onDirtyChange?.(false);
	};

	return {
		locale,
		isPending,
		duplicateMode,
		setDuplicateMode: handleToggleDuplicateMode,
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
		handleScore,
		handleDupScore,
		handleSave,
		t,
	};
}
