'use client';

import { useState, useMemo, useEffect } from 'react';
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

interface UseCapstoneEvaluationParams {
	outcomes: OutcomeRow[];
	questions: RubricQuestionDetailsResponse[];
	students: ProjectDetailsStudentResponse[];
	evaluatorId: number;
	rubricId: number;
	projectId: string | number;
	qualifStatuses: Record<number, number | null>;
	nrNaTypeIds: Set<number>;
	duplicateMode: boolean;
	commissions: CommissionRow[];
	activeCommissionId: number | null;
	onDirtyChange?: (isDirty: boolean) => void;
}

export function useCapstoneEvaluation({
	outcomes,
	questions,
	students,
	evaluatorId,
	rubricId,
	projectId,
	qualifStatuses,
	nrNaTypeIds,
	duplicateMode,
	commissions,
	activeCommissionId,
	onDirtyChange,
}: UseCapstoneEvaluationParams) {
	const { mutate: submitEvaluation, isPending } = useSubmitEvaluation(projectId);
	const [isDirty, setIsDirty] = useState(false);

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
	}, [outcomes, students, questionByOutcome, evaluatorId]);

	const initialDupSelections = useMemo<DupSelections>(() => {
		const result: DupSelections = {};
		for (const id of allCriteriaIds) result[id] = null;
		return result;
	}, [allCriteriaIds]);

	const [selections, setSelections] = useState<Selections>(initialSelections);
	const [dupSelections, setDupSelections] = useState<DupSelections>(initialDupSelections);

	// Sync when data arrives after mount (React Query stale-while-revalidate)
	useEffect(() => {
		setSelections(initialSelections);
	}, [initialSelections]);
	useEffect(() => {
		setDupSelections(initialDupSelections);
	}, [initialDupSelections]);

	const hasMissingStatus = useMemo(
		() => students.some((st) => qualifStatuses[st.id] == null),
		[students, qualifStatuses],
	);

	// Per-commission fill status for tab indicators
	const commissionFillStatus = useMemo((): Record<number, 'complete' | 'partial' | 'empty'> => {
		if (commissions.length === 0) return {};
		const gradedStudents = students.filter((st) => !nrNaTypeIds.has(qualifStatuses[st.id] ?? -1));
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
			for (const cId of criteriaIds) {
				for (const st of gradedStudents) {
					total++;
					if ((selections[cId]?.[st.id] ?? null) != null) filled++;
				}
			}
			result[commission.id] =
				total === 0 ? 'empty' : filled === total ? 'complete' : filled > 0 ? 'partial' : 'empty';
		}
		return result;
	}, [commissions, outcomes, questionByOutcome, selections, students, qualifStatuses, nrNaTypeIds]);

	const allFilled = useMemo(() => {
		if (!allCriteriaIds.length || !students.length) return false;
		if (hasMissingStatus) return false;
		const gradedStudents = students.filter((st) => !nrNaTypeIds.has(qualifStatuses[st.id] ?? -1));
		for (const cId of allCriteriaIds) {
			if (duplicateMode) {
				if (gradedStudents.length > 0 && dupSelections[cId] == null) return false;
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
		nrNaTypeIds,
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

	const handleSave = () => {
		const studentScores = new Map<
			number,
			{ rubricQuestionCriteriaId: number; score: number; commentaries: Record<string, string> }[]
		>();

		for (const st of students) {
			const isNrNa = nrNaTypeIds.has(qualifStatuses[st.id] ?? -1);
			for (const outcome of outcomes) {
				const q = questionByOutcome.get(outcome.id);
				for (const c of q?.criterias ?? []) {
					let score: number | null;
					if (isNrNa) {
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
		let remaining = entries.length;

		for (const [projectStudentId, scores] of entries) {
			submitEvaluation(
				{
					projectStudentId: projectStudentId,
					projectEvaluatorId: evaluatorId,
					rubricId: rubricId,
					observation: { es: '', en: '' },
					scores,
					qualificationStatusTypeId: qualifStatuses[projectStudentId],
				},
				{
					onSuccess: () => {
						remaining -= 1;
						if (remaining === 0) {
							setIsDirty(false);
							onDirtyChange?.(false);
						}
					},
				},
			);
		}
	};

	return {
		isPending,
		questionByOutcome,
		visibleOutcomes,
		selections,
		dupSelections,
		hasMissingStatus,
		commissionFillStatus,
		allFilled,
		handleSelect,
		handleDupSelect,
		handleSave,
	};
}
