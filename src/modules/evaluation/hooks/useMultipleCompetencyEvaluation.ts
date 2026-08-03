'use client';

import { useState, useMemo } from 'react';
import type { I18nValue } from '@/shared/components/ui/I18nTextField';
import { useSubmitEvaluation } from './useEvaluations';
import type { RubricQuestionDetailsResponse, ProjectDetailsStudentResponse } from '../types';

type OutcomeRow = {
	id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
};

type CommissionRow = {
	id: number;
	code: string;
	name: { es: string; en: string };
	outcomeIds: number[];
};

// criteriaId → studentId → selected uniqueValue
type Selections = Record<number, Record<number, number | null>>;
// criteriaId → selected uniqueValue (duplicate mode)
type DupSelections = Record<number, number | null>;

interface UseMultipleCompetencyEvaluationParams {
	outcomes: OutcomeRow[];
	questions: RubricQuestionDetailsResponse[];
	students: ProjectDetailsStudentResponse[];
	evaluatorId: number;
	rubricId: number;
	projectId: string | number;
	qualifStatuses: Record<number, number | null>;
	nonAttendanceTypeIds: Set<number>;
	commissions: CommissionRow[];
	activeCommissionId: number | null;
	onDirtyChange?: (isDirty: boolean) => void;
	/** Shared across every career/gradeType tab — the evaluation covers all students on the
	 * project, so there is a single observation, not one per tab, edited once at the page level. */
	observation: I18nValue;
	/** True when the parent panel has unsaved attendance edits, or the shared observation
	 * changed elsewhere — neither is tracked by this hook's own isDirty, but both must still
	 * unlock saving so they get submitted. */
	attendanceDirty?: boolean;
}

export function useMultipleCompetencyEvaluation({
	outcomes,
	questions,
	students,
	evaluatorId,
	rubricId,
	projectId,
	qualifStatuses,
	nonAttendanceTypeIds,
	commissions,
	activeCommissionId,
	onDirtyChange,
	observation,
	attendanceDirty = false,
}: UseMultipleCompetencyEvaluationParams) {
	const { mutateAsync: submitEvaluation, isPending } = useSubmitEvaluation(projectId);
	const [isDirty, setIsDirty] = useState(false);
	const [duplicateMode, setDuplicateMode] = useState(false);

	const markDirty = () => {
		if (!isDirty) {
			setIsDirty(true);
			onDirtyChange?.(true);
		}
	};

	const questionByOutcome = useMemo(() => {
		const map = new Map<number, RubricQuestionDetailsResponse>();
		for (const q of questions) {
			if (q.outcomeId != null) map.set(q.outcomeId, q);
		}
		return map;
	}, [questions]);

	const visibleOutcomes = useMemo(() => {
		if (commissions.length === 0) return outcomes;
		const activeCommission = commissions.find((c) => c.id === activeCommissionId);
		if (!activeCommission) return outcomes;
		const ids = new Set(activeCommission.outcomeIds);
		return outcomes.filter((o) => ids.has(o.id));
	}, [outcomes, commissions, activeCommissionId]);

	const allCriteriaIds = useMemo(() => {
		const ids: number[] = [];
		for (const outcome of outcomes) {
			const q = questionByOutcome.get(outcome.id);
			for (const c of q?.criterias ?? []) ids.push(c.id);
		}
		return ids;
	}, [outcomes, questionByOutcome]);

	const initialSelections = useMemo<Selections>(() => {
		const result: Selections = {};
		for (const outcome of outcomes) {
			const q = questionByOutcome.get(outcome.id);
			for (const c of q?.criterias ?? []) {
				result[c.id] = {};
				for (const st of students) {
					const entry = c.scores.find((s) => s.studentId === st.id);
					result[c.id][st.id] = entry != null ? entry.score : null;
				}
			}
		}
		return result;
		// eslint-disable-next-line react-hooks/exhaustive-deps -- evaluatorId intentionally reseeds the score grid when the active evaluator changes
	}, [outcomes, students, questionByOutcome, evaluatorId]);

	const initialDupSelections = useMemo<DupSelections>(() => {
		const result: DupSelections = {};
		for (const id of allCriteriaIds) result[id] = null;
		return result;
	}, [allCriteriaIds]);

	const [selections, setSelections] = useState<Selections>(initialSelections);
	const [dupSelections, setDupSelections] = useState<DupSelections>(initialDupSelections);

	// Sync when data arrives after mount (React Query stale-while-revalidate), but never
	// overwrite unsaved edits — a refetch caused by saving another tab must leave them intact.
	const [trackedInitialSelections, setTrackedInitialSelections] = useState(initialSelections);
	if (initialSelections !== trackedInitialSelections) {
		setTrackedInitialSelections(initialSelections);
		if (!isDirty) setSelections(initialSelections);
	}
	const [trackedInitialDupSelections, setTrackedInitialDupSelections] =
		useState(initialDupSelections);
	if (initialDupSelections !== trackedInitialDupSelections) {
		setTrackedInitialDupSelections(initialDupSelections);
		if (!isDirty) setDupSelections(initialDupSelections);
	}

	const hasMissingStatus = useMemo(
		() => students.some((st) => qualifStatuses[st.id] == null),
		[students, qualifStatuses],
	);

	// Per-commission fill status for tab indicators — also drives allFilled below, so it must
	// reflect whichever grid (individual or duplicate) is actually being edited.
	const commissionFillStatus = useMemo((): Record<number, 'complete' | 'partial' | 'empty'> => {
		if (commissions.length === 0) return {};
		const gradedStudents = students.filter(
			(st) => !nonAttendanceTypeIds.has(qualifStatuses[st.id] ?? -1),
		);
		const result: Record<number, 'complete' | 'partial' | 'empty'> = {};
		for (const commission of commissions) {
			const commOutcomes = outcomes.filter((o) => commission.outcomeIds.includes(o.id));
			const criteriaIds: number[] = [];
			for (const o of commOutcomes) {
				const q = questionByOutcome.get(o.id);
				for (const c of q?.criterias ?? []) criteriaIds.push(c.id);
			}
			let filled = 0;
			let total = 0;
			if (duplicateMode) {
				for (const cId of criteriaIds) {
					if (gradedStudents.length === 0) continue;
					total++;
					if (dupSelections[cId] != null) filled++;
				}
			} else {
				for (const cId of criteriaIds) {
					for (const st of gradedStudents) {
						total++;
						if ((selections[cId]?.[st.id] ?? null) != null) filled++;
					}
				}
			}

			result[commission.id] =
				gradedStudents.length === 0
					? 'complete'
					: total === 0
						? 'empty'
						: filled === total
							? 'complete'
							: filled > 0
								? 'partial'
								: 'empty';
		}
		return result;
	}, [
		commissions,
		outcomes,
		questionByOutcome,
		selections,
		dupSelections,
		duplicateMode,
		students,
		qualifStatuses,
		nonAttendanceTypeIds,
	]);

	// A commission-based (capstone multiple) rubric is valid the same way it's created: each
	// commission must be either untouched or fully graded — starting one commits you to finishing
	// it, but leaving another commission untouched entirely doesn't block saving the completed one.
	const allFilled = useMemo(() => {
		if (!allCriteriaIds.length || !students.length) return false;
		if (hasMissingStatus) return false;

		const gradedStudents = students.filter(
			(st) => !nonAttendanceTypeIds.has(qualifStatuses[st.id] ?? -1),
		);
		if (gradedStudents.length === 0) return true;

		if (commissions.length > 0) {
			const statuses = Object.values(commissionFillStatus);
			return statuses.some((s) => s === 'complete') && statuses.every((s) => s !== 'partial');
		}

		for (const cId of allCriteriaIds) {
			if (duplicateMode) {
				if (dupSelections[cId] == null) return false;
			} else {
				for (const st of gradedStudents) {
					if (selections[cId]?.[st.id] == null) return false;
				}
			}
		}
		return true;
	}, [
		allCriteriaIds,
		students,
		duplicateMode,
		selections,
		dupSelections,
		qualifStatuses,
		nonAttendanceTypeIds,
		hasMissingStatus,
		commissions,
		commissionFillStatus,
	]);

	const handleSelect = (criteriaId: number, projectStudentId: number, value: number) => {
		markDirty();
		setSelections((prev) => ({
			...prev,
			[criteriaId]: {
				...prev[criteriaId],
				[projectStudentId]: prev[criteriaId]?.[projectStudentId] === value ? null : value,
			},
		}));
	};

	const handleDupSelect = (criteriaId: number, value: number) => {
		markDirty();
		setDupSelections((prev) => ({
			...prev,
			[criteriaId]: prev[criteriaId] === value ? null : value,
		}));
	};

	// Switching modes must not lose what the evaluator already entered: going to individual
	// spreads the shared duplicate value onto every student; going back to duplicate takes the
	// first student's selection as the shared value.
	const handleToggleDuplicateMode = (next: boolean): void => {
		if (next === duplicateMode) return;
		if (next) {
			setDupSelections((prev) => {
				const result: DupSelections = { ...prev };
				for (const cId of allCriteriaIds) {
					const firstStudent = students[0];
					result[cId] = firstStudent
						? (selections[cId]?.[firstStudent.id] ?? prev[cId] ?? null)
						: (prev[cId] ?? null);
				}
				return result;
			});
		} else {
			setSelections((prev) => {
				const result: Selections = { ...prev };
				for (const cId of allCriteriaIds) {
					const dupVal = dupSelections[cId] ?? null;
					const row: Record<number, number | null> = { ...result[cId] };
					students.forEach((st) => {
						row[st.id] = dupVal;
					});
					result[cId] = row;
				}
				return result;
			});
		}
		setDuplicateMode(next);
	};

	const handleSave = async (): Promise<void> => {
		const studentScores = new Map<
			number,
			{ rubricQuestionCriteriaId: number; score: number; commentaries: Record<string, string> }[]
		>();

		for (const st of students) {
			const isNonAttendance = nonAttendanceTypeIds.has(qualifStatuses[st.id] ?? -1);
			for (const outcome of outcomes) {
				const q = questionByOutcome.get(outcome.id);
				for (const c of q?.criterias ?? []) {
					let score: number | null;
					if (isNonAttendance) {
						score = 0;
					} else if (duplicateMode) {
						score = dupSelections[c.id] ?? null;
					} else {
						score = selections[c.id]?.[st.id] ?? null;
					}
					if (score == null) continue;
					const existing = studentScores.get(st.id) ?? [];
					existing.push({ rubricQuestionCriteriaId: c.id, score, commentaries: {} });
					studentScores.set(st.id, existing);
				}
			}
		}

		const entries = [...studentScores.entries()];
		if (entries.length === 0) return;

		const observationEs = observation.es?.trim() ?? '';
		const observationEn = observation.en?.trim() ?? '';
		// Stored/read as a localized record ({ es, en }); keep the write shape in sync with
		// ProjectRubricItemStudentResponse.observation so a refetch repopulates the textareas.
		const observationPayload =
			observationEs || observationEn ? { es: observationEs, en: observationEn } : undefined;

		// Errors propagate to the caller, which owns the save-all feedback dialogs.
		await Promise.all(
			entries.map(([projectStudentId, scores]) =>
				submitEvaluation({
					projectStudentId,
					projectEvaluatorId: evaluatorId,
					rubricId: rubricId,
					observation: observationPayload,
					scores,
					qualificationStatusTypeId: qualifStatuses[projectStudentId],
				}),
			),
		);
		setIsDirty(false);
		onDirtyChange?.(false);
	};

	const canSave = allFilled && (isDirty || attendanceDirty);

	return {
		isPending,
		questionByOutcome,
		visibleOutcomes,
		selections,
		dupSelections,
		duplicateMode,
		hasMissingStatus,
		commissionFillStatus,
		allFilled,
		canSave,
		isDirty,
		handleSelect,
		handleDupSelect,
		handleToggleDuplicateMode,
		handleSave,
	};
}
