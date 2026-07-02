import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib/apiError';
import { logger } from '@/shared/lib/logger';
import { rubricsService } from '../services';
import {
	RubricDetail,
	OutcomeWithCriteria,
	CriteriaItem,
	CommissionTab,
	QuestionCriteria,
} from '../types';
import { performanceLevelsService } from '@/modules/academic/services';
import { evaluationQueryKeys } from './queryKeys';
import { PerformanceLevelResponse } from '@/modules/academic';
import { typesService } from '@/modules/core';
import { TYPE_CODES, TYPE_GROUP_CODES } from '@/shared/constants';
import { COMPETENCY_SCOPE_LABELS } from '../constants';

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

interface ApiRubricCriteria {
	id: number;
	text: string | { en: string; es: string };
	minValue?: number | null;
	maxValue?: number | null;
}

interface ApiRubricQuestion {
	id: number;
	text: string | { en: string; es: string };
	outcomeId?: number;
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
}

interface ApiRubricDetailData {
	rubric: {
		id: number;
		rubricTypeId: number;
		rubricType?: { code?: string };
		gradeType?: { name: { en: string; es: string } | string; code?: string };
		competencyScopeType?: { name: { en: string; es: string } | string; code?: string };
		studyPlanCourseId?: number;
	};
	course?: { id?: number; name?: { en: string; es: string } | string };
	academicPeriod?: { id?: number; code?: string };
	program?: { id?: number; code?: string; name?: { en: string; es: string } | string };
	commissions?: ApiRubricCommission[];
	outcomes?: ApiRubricOutcome[];
	questions?: ApiRubricQuestion[];
	isUsed?: boolean;
}

function toI18nText(raw: { en: string; es: string } | string | undefined): {
	en: string;
	es: string;
} {
	if (!raw) return { en: '', es: '' };
	return typeof raw === 'string' ? { en: raw, es: raw } : raw;
}

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

			const res = await rubricsService.getById(rubricId);
			logger.debug('[useRubricEditor] rubricsService.getById response', res);
			if (!res) {
				throw new ApiError('rubrics.editor.error.emptyResponse');
			}

			const data = unwrapApiData<ApiRubricDetailData>(res);
			logger.debug('[useRubricEditor] normalized data', data);
			if (!data) {
				throw new ApiError('rubrics.editor.error.normalizeFailed');
			}

			const rubric = data.rubric;
			if (!rubric) {
				throw new ApiError('rubrics.editor.error.missingRubric');
			}

			const academicPeriodId: number | undefined =
				data.academicPeriod?.id != null ? Number(data.academicPeriod.id) : undefined;

			const instrumentTypesRes = await typesService.getByGroupCode(
				TYPE_GROUP_CODES.PERFORMANCE_LEVEL_INSTRUMENT,
			);
			const rubricInstrumentTypeId = instrumentTypesRes?.data?.find(
				(type) => type.code === TYPE_CODES.PERFORMANCE_LEVEL_INSTRUMENT.RUBRIC,
			)?.id;

			const levelsRes = await performanceLevelsService.getByFilters({
				isActive: true,
				...(rubricInstrumentTypeId != null ? { instrumentTypeId: rubricInstrumentTypeId } : {}),
				...(academicPeriodId != null ? { academicPeriodId: academicPeriodId } : {}),
			});
			logger.debug('[useRubricEditor] performance levels response', levelsRes);
			const performanceLevels = (levelsRes?.data ?? []).map((level: PerformanceLevelResponse) => ({
				id: String(level.id),
				name: level.name ?? { en: '', es: '' },
				code: level.code ?? '',
				uniqueValue: level.uniqueValue != null ? Number(level.uniqueValue) : null,
				minValue: level.minScore != null ? Number(level.minScore) : 0,
				maxValue: level.maxScore != null ? Number(level.maxScore) : 0,
				color: (level.extra as { color?: string } | undefined)?.color ?? null,
			}));

			const outcomesById = new Map<number, ApiRubricOutcome>(
				(data.outcomes ?? []).map((o) => [o.id, o]),
			);

			const allApiQuestions: ApiRubricQuestion[] = data.questions ?? [];

			const commissions: CommissionTab[] = (data.commissions ?? []).map((commission) => {
				const outcomeIdsList: number[] = commission.outcomeIds ?? commission.outcomeIds ?? [];
				const outcomes = outcomeIdsList
					.map((outcomeId: number): OutcomeWithCriteria | null => {
						const outcome = outcomesById.get(outcomeId);
						if (!outcome) return null;

						const outcomeDescription = toI18nText(outcome.description);

						// Each outcome maps to exactly ONE question whose text = outcome description.
						// The user-managed items are the criterias of that question.
						const outcomeApiQuestions = allApiQuestions.filter((q) => {
							const qOutcomeId = q.outcomeId ?? q.outcomeId;
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

			const questions = (data.questions ?? []).map((q, index: number) => ({
				id: String(q.id),
				order: index + 1,
				questionText: toI18nText(q.text),
				criteria: (q.criterias ?? []).map(
					(c): QuestionCriteria => ({
						id: String(c.id),
						criteriaText: toI18nText(c.text),
						minValue: c.minValue != null ? Number(c.minValue) : '',
						maxValue: c.maxValue != null ? Number(c.maxValue) : '',
					}),
				),
			}));

			const gradeType = toI18nText(rubric.gradeType?.name);
			const competencyScopeCode = rubric.competencyScopeType?.code;
			const competencyScopeType =
				(competencyScopeCode ? COMPETENCY_SCOPE_LABELS[competencyScopeCode] : undefined) ??
				toI18nText(rubric.competencyScopeType?.name);

			const prog = data.program;
			const programName = toI18nText(prog?.name);

			const courseName = toI18nText(data.course?.name);

			const rubricDetail: RubricDetail = {
				id: String(rubric.id),
				gradeTypeCode: rubric.gradeType?.code ?? '',
				gradeType,
				competencyScopeType,
				competencyScopeCode: competencyScopeCode ?? '',
				isCapstone: rubric.rubricType?.code === TYPE_CODES.RUBRIC_TYPE.CAPSTONE,
				program: {
					id: String(prog?.id ?? ''),
					code: prog?.code ?? '',
					name: programName,
				},
				course: {
					id: String(data.course?.id ?? rubric.studyPlanCourseId ?? ''),
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
