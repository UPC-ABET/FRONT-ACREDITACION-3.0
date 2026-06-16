import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getAcademicPeriods,
	getPrograms,
	listGRACompetences,
	saveGRACompetence,
	deleteGRACompetence,
	cloneGRAConfiguration,
	listGRAStudents,
	generateGRADashboard,
	listLCFCCourses,
	generateLCFCConfiguration,
	changeLCFCConfigStatus,
	generateLCFCDashboard,
	listPPPCompetences,
	savePPPCompetence,
	deletePPPCompetence,
	clonePPPConfiguration,
	generatePPPDashboard,
} from '../services';
import type { CompetenceFormData, LCFCConfigStatus } from '../types';

export const surveyQueryKeys = {
	all: ['surveys'] as const,

	periods: () => ['surveys', 'periods'] as const,
	programs: () => ['surveys', 'programs'] as const,

	graCompetences: (periodId: number, programId?: number) =>
		['surveys', 'gra', 'competences', { periodId, programId }] as const,
	graStudents: (params: {
		programId?: number;
		academicPeriodId?: number;
		campusId?: number;
		studentCode?: string;
	}) => ['surveys', 'gra', 'students', params] as const,
	graDashboard: (params: { academicPeriodId?: number; programId?: number; campusId?: number }) =>
		['surveys', 'gra', 'dashboard', params] as const,

	lcfcCourses: (school: string, periodId: number, programId?: number) =>
		['surveys', 'lcfc', 'courses', { school, periodId, programId }] as const,
	lcfcDashboard: (params: { academicPeriodId?: number; programId?: number; campusId?: number }) =>
		['surveys', 'lcfc', 'dashboard', params] as const,

	pppCompetences: (periodId: number, programId?: number) =>
		['surveys', 'ppp', 'competences', { periodId, programId }] as const,
	pppDashboard: (params: {
		academicPeriodId?: number;
		programId?: number;
		campusId?: number;
		practiceNumber?: number;
	}) => ['surveys', 'ppp', 'dashboard', params] as const,
};

export function useSurveyPeriods(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: surveyQueryKeys.periods(),
		queryFn: () => getAcademicPeriods(),
		enabled: options?.enabled ?? true,
	});
}

export function useSurveyPrograms(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: surveyQueryKeys.programs(),
		queryFn: () => getPrograms(),
		enabled: options?.enabled ?? true,
	});
}

export function useGRACompetencesQuery(
	periodId: number,
	programId = 0,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.graCompetences(periodId, programId),
		queryFn: () => listGRACompetences(periodId, programId),
		enabled: (options?.enabled ?? true) && periodId > 0,
	});
}

export function useSaveGRACompetence() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CompetenceFormData) => saveGRACompetence(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'gra', 'competences'] });
		},
	});
}

export function useDeleteGRACompetence() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteGRACompetence(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'gra', 'competences'] });
		},
	});
}

export function useCloneGRAConfiguration() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: {
			sourceProgramId: number;
			sourcePeriodId: number;
			targetProgramId: number;
			targetPeriodId: number;
		}) => cloneGRAConfiguration(params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'gra', 'competences'] });
		},
	});
}

export function useGRAStudentsQuery(
	params: {
		programId?: number;
		academicPeriodId?: number;
		campusId?: number;
		studentCode?: string;
	},
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.graStudents(params),
		queryFn: () => listGRAStudents(params),
		enabled: options?.enabled ?? true,
	});
}

export function useGRADashboardQuery(
	params: { academicPeriodId?: number; programId?: number; campusId?: number },
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.graDashboard(params),
		queryFn: () => generateGRADashboard(params),
		enabled: options?.enabled ?? false,
	});
}

export function useLCFCCoursesQuery(
	school: string,
	periodId: number,
	programId?: number,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.lcfcCourses(school, periodId, programId),
		queryFn: () => listLCFCCourses(school, periodId, programId),
		enabled: (options?.enabled ?? true) && periodId > 0,
	});
}

export function useGenerateLCFCConfiguration() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: {
			school: string;
			academicPeriodId: number;
			programId?: number;
			campusId?: number;
		}) =>
			generateLCFCConfiguration(
				params.school,
				params.academicPeriodId,
				params.programId,
				params.campusId,
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'lcfc', 'courses'] });
		},
	});
}

export function useChangeLCFCConfigStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: { configId: number; newStatus: LCFCConfigStatus }) =>
			changeLCFCConfigStatus(params.configId, params.newStatus),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'lcfc', 'courses'] });
		},
	});
}

export function useLCFCDashboardQuery(
	params: { academicPeriodId?: number; programId?: number; campusId?: number },
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.lcfcDashboard(params),
		queryFn: () => generateLCFCDashboard(params),
		enabled: options?.enabled ?? false,
	});
}

export function usePPPCompetencesQuery(
	periodId: number,
	programId = 0,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.pppCompetences(periodId, programId),
		queryFn: () => listPPPCompetences(periodId, programId),
		enabled: (options?.enabled ?? true) && periodId > 0,
	});
}

export function useSavePPPCompetence() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CompetenceFormData) => savePPPCompetence(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'ppp', 'competences'] });
		},
	});
}

export function useDeletePPPCompetence() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deletePPPCompetence(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'ppp', 'competences'] });
		},
	});
}

export function useClonePPPConfiguration() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: {
			sourceProgramId: number;
			sourcePeriodId: number;
			targetProgramId: number;
			targetPeriodId: number;
		}) => clonePPPConfiguration(params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'ppp', 'competences'] });
		},
	});
}

export function usePPPDashboardQuery(
	params: {
		academicPeriodId?: number;
		programId?: number;
		campusId?: number;
		practiceNumber?: number;
	},
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.pppDashboard(params),
		queryFn: () => generatePPPDashboard(params),
		enabled: options?.enabled ?? false,
	});
}
