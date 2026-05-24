import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib/api-error';
import { logger } from '@/shared/lib/logger';
import { rubricsService } from '../services';
import { RubricDetail } from '../types';
import { performanceLevelsService } from '@/modules/academic/services';

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

export const rubricEditorQueryKeys = {
	detail: (rubricId: string | number) => ['rubric-editor', rubricId] as const,
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

			const data = unwrapApiData<any>(res);
			logger.debug('[useRubricEditor] normalized data', data);
			if (!data) {
				throw new ApiError('Could not normalize rubric response from API');
			}

			const rubric = data.rubric;
			if (!rubric) {
				throw new ApiError('Missing rubric field in API response');
			}

			// ── Step 2: GET /performance-levels/get-by-filters ──────────────────────
			// The new endpoint no longer exposes academicPeriodId or instrumentTypeId,
			// so we fetch active performance levels without those filters.
			const levelsRes = await performanceLevelsService.getByFilters({ is_active: true } as any);
			logger.debug('[useRubricEditor] performance levels response', levelsRes);
			const performanceLevels = (levelsRes?.data ?? []).map((level: any) => ({
				id: String(level.id),
				name: level.name ?? { en: '', es: '' },
				code: level.code ?? '',
				uniqueValue: level.unique_value != null ? Number(level.unique_value) : null,
				minValue: level.min_score != null ? Number(level.min_score) : 0,
				maxValue: level.max_score != null ? Number(level.max_score) : 0,
				color: level.extra?.color ?? null,
			}));

			// ── Build lookup map for outcomes ────────────────────────────────────────
			const outcomesById = new Map<number, any>((data.outcomes ?? []).map((o: any) => [o.id, o]));

			// ── Build CommissionTab[] ─────────────────────────────────────────────────
			const allApiQuestions: any[] = data.questions ?? [];

			const commissions = (data.commissions ?? []).map((commission: any) => {
				const outcomeIdsList: number[] = commission.outcomeIds ?? commission.outcome_ids ?? []
				const outcomes = outcomeIdsList
					.map((outcomeId: number) => {
						const outcome = outcomesById.get(outcomeId);
						if (!outcome) return null;

						// Outcome description — always used as the question text
						const descRaw = outcome.description;
						const outcomeDescription =
							typeof descRaw === 'string'
								? { en: descRaw, es: descRaw }
								: (descRaw ?? { en: '', es: '' });

						// Each outcome maps to exactly ONE question whose text = outcome description.
						// The user-managed items are the criterias of that question.
						const outcomeApiQuestions = allApiQuestions.filter((q: any) => {
							const qOutcomeId = q.outcomeId ?? q.outcome_id;
							return Number(qOutcomeId) === Number(outcomeId);
						});
						const firstApiQuestion = outcomeApiQuestions[0];

						const criteria = (firstApiQuestion?.criterias ?? []).map((c: any) => {
							const cText =
								typeof c.text === 'string'
									? { en: c.text, es: c.text }
									: (c.text ?? { en: '', es: '' });
							return {
								id: String(c.id),
								description: cText,
								minValue: 0,
								maxValue: 0,
							};
						});

						const questions = [
							{
								id: firstApiQuestion ? String(firstApiQuestion.id) : `temp-${outcomeId}`,
								questionText: outcomeDescription, // always mirrors outcome description
								criteria,
							},
						];

						return {
							id: String(outcome.id),
							outcomeCode: outcome.code ?? '',
							outcomeDescription,
							outcomeType: 'verificacion' as const,
							questions,
						};
					})
					.filter(Boolean);

				const verification = outcomes.filter((o: any) => o.outcomeType === 'verificacion');
				const nameRaw = commission.name;
				const commissionName =
					typeof nameRaw === 'string'
						? { en: nameRaw, es: nameRaw }
						: (nameRaw ?? { en: '', es: '' });

				return {
					id: String(commission.id),
					code: commission.code ?? '',
					name: commissionName,
					accreditorCode: '',
					isComplete:
						verification.length > 0 &&
						verification.every((o: any) => (o.questions[0]?.criteria?.length ?? 0) > 0),
					outcomes,
				};
			});

			// ── Build RubricQuestion[] ───────────────────────────────────────────────
			const questions = (data.questions ?? []).map((q: any, index: number) => {
				const qText =
					typeof q.text === 'string' ? { en: q.text, es: q.text } : (q.text ?? { en: '', es: '' });
				return {
					id: String(q.id),
					order: index + 1,
					questionText: qText,
					criteria: (q.criterias ?? []).map((c: any) => {
						const cText =
							typeof c.text === 'string'
								? { en: c.text, es: c.text }
								: (c.text ?? { en: '', es: '' });
						return {
							id: String(c.id),
							criteriaText: cText,
							minValue: c.min_value != null ? Number(c.min_value) : '',
							maxValue: c.max_value != null ? Number(c.max_value) : '',
						};
					}),
				};
			});

			// ── Grade type name ──────────────────────────────────────────────────────
			const gradeTypeName = rubric.grade_type?.name;
			const gradeType =
				typeof gradeTypeName === 'string'
					? { en: gradeTypeName, es: gradeTypeName }
					: (gradeTypeName ?? { en: '', es: '' });

			// ── Program (top-level in new API) ───────────────────────────────────────
			const prog = data.program;
			const programName =
				typeof prog?.name === 'string'
					? { en: prog.name, es: prog.name }
					: (prog?.name ?? { en: '', es: '' });

			// ── Course name ──────────────────────────────────────────────────────────
			const courseName =
				typeof data.course?.name === 'string'
					? { en: data.course.name, es: data.course.name }
					: (data.course?.name ?? { en: '', es: '' });

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
				canEdit: Boolean(!rubric.isUsed),
				hasScores: Boolean(data.isUsed),
				maxScore: 0,
				performanceLevels,
				commissions: commissions as any,
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
