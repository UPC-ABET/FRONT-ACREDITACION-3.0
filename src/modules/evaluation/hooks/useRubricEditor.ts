import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib/apiError';
import { logger } from '@/shared/lib/logger';
import { rubricsService } from '../services';
import { RubricDetail, OutcomeWithCriteria, CriteriaItem, CommissionTab, QuestionCriteria } from '../types';
import { performanceLevelsService } from '@/modules/academic/services';
import type { PerformanceLevelResponse } from '@/modules/academic/api/dtos';
import { evaluationQueryKeys } from './queryKeys';

/** Capstone rubric type id — update if the backend changes the seed */
const CAPSTONE_RUBRIC_TYPE_ID = 29;

function isCapstoneRubricType(rubricTypeId: number): boolean {
	return rubricTypeId === CAPSTONE_RUBRIC_TYPE_ID;
}

function unwrapApiData<T>(response: unknown): T | null {
	if (!response || typeof response !== 'object') return null;

	const root = response as Record<string, unknown>;
	if (!Object.prototype.hasOwnProperty.call(root, 'data')) {
		return response as T;
	}

	const data = root.data;
	if (
		data &&
		typeof data === 'object' &&
		Object.prototype.hasOwnProperty.call(data as Record<string, unknown>, 'data')
	) {
		return (data as Record<string, unknown>).data as T;
	}

	return data as T;
}

// ── Local API response types ──────────────────────────────────────────────────
// The actual API shapes returned inside GetRubricByIdResponse differ from the
// DTO definitions in some field names (e.g. `code` vs `outcome_code`). These
// private types capture what the API actually returns in this context.

interface ApiRubricCriteria {
	id: number;
	text: string | { en: string; es: string };
	min_value?: number | null;
	max_value?: number | null;
}

interface ApiRubricQuestion {
	id: number;
	text: string | { en: string; es: string };
	outcomeId?: number;
	outcome_id?: number;
	criterias?: ApiRubricCriteria[];
}

interface ApiRubricOutcome {
	id: number;
	code: string;
	description: { en: string; es: string } | string;
}

interface ApiRubricCommission {
	id: number;
	code: string;
	name: { en: string; es: string } | string;
	outcomeIds?: number[];
	outcome_ids?: number[];
}

interface ApiRubricDetailData {
	rubric: {
		id: number;
		rubric_type_id: number;
		grade_type?: { name: { en: string; es: string } | string; code?: string };
		study_plan_course_id?: number;
	};
	course?: { id?: number; name?: { en: string; es: string } | string };
	academicPeriod?: { id?: number; code?: string };
	program?: { id?: number; code?: string; name?: { en: string; es: string } | string };
	commissions?: ApiRubricCommission[];
	outcomes?: ApiRubricOutcome[];
	questions?: ApiRubricQuestion[];
	isUsed?: boolean;
}

function toI18nText(raw: { en: string; es: string } | string | undefined): { en: string; es: string } {
	if (!raw) return { en: '', es: '' };
	return typeof raw === 'string' ? { en: raw, es: raw } : raw;
}

// ─────────────────────────────────────────────────────────────────────────────

export const rubricEditorQueryKeys = {
	detail: (rubricId: string | number) => evaluationQueryKeys.rubricEditor(rubricId),
};

interface UseRubricEditorOptions {
	rubricId: string | number;
	initialRubric?: RubricDetail;
}

export function useRubricEditor({ rubricId, initialRubric }: UseRubricEditorOptions) {
	const hasInitialRubric = Boolean(initialRubric);
	logger.debug('[useRubricEditor] init', { rubricId, hasInitialRubric });

	const query = useQuery<RubricDetail>({
		queryKey: rubricEditorQueryKeys.detail(rubricId),
		queryFn: async (): Promise<RubricDetail> => {
			logger.debug('[useRubricEditor] queryFn start', { rubricId });
			if (initialRubric) {
				logger.debug('[useRubricEditor] using initialRubric');
				return initialRubric;
			}

			// ── Step 1: GET /rubrics/get-by-id/:id ──────────────────────────────────
			const res = await rubricsService.getById(rubricId);
			logger.debug('[useRubricEditor] rubricsService.getById response', res);
			if (!res) {
				throw new ApiError('Empty rubric response from API');
			}

			const data = unwrapApiData<ApiRubricDetailData>(res);
			logger.debug('[useRubricEditor] normalized data', data);
			if (!data) {
				throw new ApiError('Could not normalize rubric response from API');
			}

			const rubric = data.rubric;
			if (!rubric) {
				throw new ApiError('Missing rubric field in API response');
			}

			// ── Step 2: GET /performance-levels/get-by-filters ──────────────────────
			// Filter by the academic period of the rubric's study plan course.
			const academicPeriodId: number | undefined =
				data.academicPeriod?.id != null ? Number(data.academicPeriod.id) : undefined;
			const levelsRes = await performanceLevelsService.getByFilters({
				is_active: true,
				...(academicPeriodId != null ? { academic_period_id: academicPeriodId } : {}),
			});
			logger.debug('[useRubricEditor] performance levels response', levelsRes);
			const performanceLevels = (levelsRes?.data ?? []).map((level: PerformanceLevelResponse) => ({
				id: String(level.id),
				name: level.name ?? { en: '', es: '' },
				code: level.code ?? '',
				uniqueValue: level.unique_value != null ? Number(level.unique_value) : null,
				minValue: level.min_score != null ? Number(level.min_score) : 0,
				maxValue: level.max_score != null ? Number(level.max_score) : 0,
				color: (level.extra as { color?: string } | undefined)?.color ?? null,
			}));

			// ── Build lookup map for outcomes ────────────────────────────────────────
			const outcomesById = new Map<number, ApiRubricOutcome>(
				(data.outcomes ?? []).map((o) => [o.id, o]),
			);

			// ── Build CommissionTab[] ─────────────────────────────────────────────────
			const allApiQuestions: ApiRubricQuestion[] = data.questions ?? [];

			const commissions: CommissionTab[] = (data.commissions ?? []).map((commission) => {
				const outcomeIdsList: number[] = commission.outcomeIds ?? commission.outcome_ids ?? [];
				const outcomes = outcomeIdsList
					.map((outcomeId: number): OutcomeWithCriteria | null => {
						const outcome = outcomesById.get(outcomeId);
						if (!outcome) return null;

						// Outcome description — always used as the question text
						const outcomeDescription = toI18nText(outcome.description);

						// Each outcome maps to exactly ONE question whose text = outcome description.
						// The user-managed items are the criterias of that question.
						const outcomeApiQuestions = allApiQuestions.filter((q) => {
							const qOutcomeId = q.outcomeId ?? q.outcome_id;
							return Number(qOutcomeId) === Number(outcomeId);
						});
						const firstApiQuestion = outcomeApiQuestions[0];

						const criteria: CriteriaItem[] = (firstApiQuestion?.criterias ?? []).map((c) => ({
							id: String(c.id),
							description: toI18nText(c.text),
							minValue: 0,
							maxValue: 0,
						}));

						return {
							id: String(outcome.id),
							outcomeCode: outcome.code ?? '',
							outcomeDescription,
							outcomeType: 'verificacion' as const,
							questions: [
								{
									id: firstApiQuestion ? String(firstApiQuestion.id) : `temp-${outcomeId}`,
									questionText: outcomeDescription,
									criteria,
								},
							],
						};
					})
					.filter((o): o is OutcomeWithCriteria => o !== null);

				const verification = outcomes.filter((o) => o.outcomeType === 'verificacion');
				const commissionName = toI18nText(commission.name);

				return {
					id: String(commission.id),
					code: commission.code ?? '',
					name: commissionName,
					accreditorCode: '',
					isComplete:
						verification.length > 0 &&
						verification.every((o) => (o.questions[0]?.criteria?.length ?? 0) > 0),
					outcomes,
				};
			});

			// ── Build RubricQuestion[] ───────────────────────────────────────────────
			const questions = (data.questions ?? []).map((q, index: number) => ({
				id: String(q.id),
				order: index + 1,
				questionText: toI18nText(q.text),
				criteria: (q.criterias ?? []).map((c): QuestionCriteria => ({
					id: String(c.id),
					criteriaText: toI18nText(c.text),
					minValue: c.min_value != null ? Number(c.min_value) : '',
					maxValue: c.max_value != null ? Number(c.max_value) : '',
				})),
			}));

			// ── Grade type name ──────────────────────────────────────────────────────
			const gradeType = toI18nText(rubric.grade_type?.name);

			// ── Program (top-level in new API) ───────────────────────────────────────
			const prog = data.program;
			const programName = toI18nText(prog?.name);

			// ── Course name ──────────────────────────────────────────────────────────
			const courseName = toI18nText(data.course?.name);

			// ── Map to RubricDetail view model ───────────────────────────────────────
			const rubricDetail: RubricDetail = {
				id: String(rubric.id),
				gradeTypeCode: rubric.grade_type?.code ?? '',
				gradeType,
				isCapstone: isCapstoneRubricType(rubric.rubric_type_id),
				program: {
					id: String(prog?.id ?? ''),
					code: prog?.code ?? '',
					name: programName,
				},
				course: {
					id: String(data.course?.id ?? rubric.study_plan_course_id ?? ''),
					code: '',
					name: courseName,
				},
				commission: { code: '', name: { en: '', es: '' } },
				academicPeriod: {
					id: String(data.academicPeriod?.id ?? ''),
					code: data.academicPeriod?.code ?? '',
				},
				canEdit: Boolean(!data.isUsed),
				hasScores: Boolean(data.isUsed),
				maxScore: 0,
				performanceLevels,
				commissions,
				questions,
			};

			return rubricDetail;
		},
		enabled: Boolean(rubricId),
		initialData: initialRubric,
	});

	const rubric = initialRubric ?? query.data;

	return {
		rubric,
		isLoading: hasInitialRubric ? false : query.isLoading,
		isError: hasInitialRubric ? false : query.isError,
		canEdit: Boolean(rubric?.canEdit),
		queryKey: rubricEditorQueryKeys.detail(rubricId),
		error: query.error ?? null,
	};
}
