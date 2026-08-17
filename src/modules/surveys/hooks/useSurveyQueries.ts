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
	generateLCFCDashboard,
	listPPPCompetences,
	savePPPCompetence,
	deletePPPCompetence,
	clonePPPConfiguration,
	generatePPPDashboard,
} from '../services';
import type { CompetenceFormData } from '../types';

export const surveyQueryKeys = {
	all: ['surveys'] as const,

	periods: () => ['surveys', 'periods'] as const,
	programs: () => ['surveys', 'programs'] as const,
	// The outcomes endpoint is scoped by the X-Academic-Period-Id header, so the period has to
	// be part of the key or switching it in the top bar serves the old period's options.
	commissions: (programId?: number, academicPeriodId?: number | null) =>
		['surveys', 'commissions', programId, academicPeriodId] as const,
	campuses: () => ['surveys', 'campuses'] as const,

	graCompetences: () => ['surveys', 'gra', 'competences'] as const,
	graCompetencesList: (periodId: number, programId?: number) =>
		[...surveyQueryKeys.graCompetences(), { periodId, programId }] as const,
	graStudents: (params: {
		programId?: number;
		academicPeriodId?: number;
		campusId?: number;
		studentCode?: string;
	}) => ['surveys', 'gra', 'students', params] as const,
	graStudentSuggestions: (codePrefix: string) =>
		['surveys', 'gra', 'student-suggestions', codePrefix] as const,
	graDashboard: (params: { academicPeriodId?: number; programId?: number; campusId?: number }) =>
		['surveys', 'gra', 'dashboard', params] as const,

	lcfcDashboard: (params: { academicPeriodId?: number; programId?: number; campusId?: number }) =>
		['surveys', 'lcfc', 'dashboard', params] as const,

	pppCompetences: () => ['surveys', 'ppp', 'competences'] as const,
	pppCompetencesList: (periodId: number, programId?: number) =>
		[...surveyQueryKeys.pppCompetences(), { periodId, programId }] as const,
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
		queryKey: surveyQueryKeys.graCompetencesList(periodId, programId),
		queryFn: () => listGRACompetences(periodId, programId),
		enabled: (options?.enabled ?? true) && periodId > 0,
	});
}

export function useSaveGRACompetence() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CompetenceFormData) => saveGRACompetence(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: surveyQueryKeys.graCompetences() });
		},
	});
}

export function useDeleteGRACompetence() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteGRACompetence(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: surveyQueryKeys.graCompetences() });
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
			queryClient.invalidateQueries({ queryKey: surveyQueryKeys.graCompetences() });
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
		queryKey: surveyQueryKeys.pppCompetencesList(periodId, programId),
		queryFn: () => listPPPCompetences(periodId, programId),
		enabled: (options?.enabled ?? true) && periodId > 0,
	});
}

export function useSavePPPCompetence() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CompetenceFormData) => savePPPCompetence(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: surveyQueryKeys.pppCompetences() });
		},
	});
}

export function useDeletePPPCompetence() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deletePPPCompetence(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: surveyQueryKeys.pppCompetences() });
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
			queryClient.invalidateQueries({ queryKey: surveyQueryKeys.pppCompetences() });
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
