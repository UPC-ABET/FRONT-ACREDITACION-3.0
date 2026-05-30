import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getAcademicPeriods,
	getPrograms,
	listGRACompetences,
	saveGRACompetence,
	deleteGRACompetence,
	cloneGRAConfiguration,
	listGRAStudents,
	listGRAPerformanceLevels,
	generateGRADashboard,
	listLCFCCourses,
	generateLCFCConfiguration,
	changeLCFCConfigStatus,
	generateLCFCDashboard,
	listPPPCompetences,
	savePPPCompetence,
	deletePPPCompetence,
	clonePPPConfiguration,
	listPPPPerformanceLevels,
	updatePPPPerformanceLevels,
	generatePPPDashboard,
} from '../services';
import type { CompetenceFormData, PerformanceLevel } from '../types';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const surveyQueryKeys = {
	all: ['surveys'] as const,

	// Academic
	periods: () => ['surveys', 'periods'] as const,
	programs: () => ['surveys', 'programs'] as const,

	// GRA
	graCompetences: (periodId: number, programId?: number) =>
		['surveys', 'gra', 'competences', { periodId, programId }] as const,
	graStudents: (params: {
		program_id?: number;
		academic_period_id?: number;
		campus_id?: number;
		student_code?: string;
	}) => ['surveys', 'gra', 'students', params] as const,
	graPerformanceLevels: (periodId: number) =>
		['surveys', 'gra', 'performance-levels', periodId] as const,
	graDashboard: (params: {
		academic_period_id?: number;
		program_id?: number;
		campus_id?: number;
	}) => ['surveys', 'gra', 'dashboard', params] as const,

	// LCFC
	lcfcCourses: (escuela: string, periodId: number, programId?: number) =>
		['surveys', 'lcfc', 'courses', { escuela, periodId, programId }] as const,
	lcfcDashboard: (params: {
		academic_period_id?: number;
		program_id?: number;
		campus_id?: number;
	}) => ['surveys', 'lcfc', 'dashboard', params] as const,

	// PPP
	pppCompetences: (periodId: number, programId?: number) =>
		['surveys', 'ppp', 'competences', { periodId, programId }] as const,
	pppPerformanceLevels: (periodId: number) =>
		['surveys', 'ppp', 'performance-levels', periodId] as const,
	pppDashboard: (params: {
		academic_period_id?: number;
		program_id?: number;
		campus_id?: number;
		practice_number?: number;
	}) => ['surveys', 'ppp', 'dashboard', params] as const,
};

// ─── Academic ────────────────────────────────────────────────────────────────

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

// ─── GRA ─────────────────────────────────────────────────────────────────────

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
			idCarreraOrigen: number;
			idPeriodoOrigen: number;
			idCarreraDestino: number;
			idPeriodoDestino: number;
		}) => cloneGRAConfiguration(params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'gra', 'competences'] });
		},
	});
}

export function useGRAStudentsQuery(
	params: {
		program_id?: number;
		academic_period_id?: number;
		campus_id?: number;
		student_code?: string;
	},
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.graStudents(params),
		queryFn: () => listGRAStudents(params),
		enabled: options?.enabled ?? true,
	});
}

export function useGRAPerformanceLevelsQuery(periodId: number, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: surveyQueryKeys.graPerformanceLevels(periodId),
		queryFn: () => listGRAPerformanceLevels(periodId),
		enabled: (options?.enabled ?? true) && periodId > 0,
	});
}

export function useGRADashboardQuery(
	params: { academic_period_id?: number; program_id?: number; campus_id?: number },
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.graDashboard(params),
		queryFn: () => generateGRADashboard(params),
		enabled: options?.enabled ?? false,
	});
}

// ─── LCFC ────────────────────────────────────────────────────────────────────

export function useLCFCCoursesQuery(
	escuela: string,
	periodId: number,
	programId?: number,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.lcfcCourses(escuela, periodId, programId),
		queryFn: () => listLCFCCourses(escuela, periodId, programId),
		enabled: (options?.enabled ?? true) && periodId > 0,
	});
}

export function useGenerateLCFCConfiguration() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: {
			escuela: string;
			academic_period_id: number;
			program_id?: number;
			campus_id?: number;
		}) =>
			generateLCFCConfiguration(
				params.escuela,
				params.academic_period_id,
				params.program_id,
				params.campus_id,
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'lcfc', 'courses'] });
		},
	});
}

export function useChangeLCFCConfigStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: { config_id: number; nuevoEstado: 'ACTIVO' | 'INACTIVO' }) =>
			changeLCFCConfigStatus(params.config_id, params.nuevoEstado),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'lcfc', 'courses'] });
		},
	});
}

export function useLCFCDashboardQuery(
	params: { academic_period_id?: number; program_id?: number; campus_id?: number },
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.lcfcDashboard(params),
		queryFn: () => generateLCFCDashboard(params),
		enabled: options?.enabled ?? false,
	});
}

// ─── PPP ─────────────────────────────────────────────────────────────────────

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
			idCarreraOrigen: number;
			idPeriodoOrigen: number;
			idCarreraDestino: number;
			idPeriodoDestino: number;
		}) => clonePPPConfiguration(params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'ppp', 'competences'] });
		},
	});
}

export function usePPPPerformanceLevelsQuery(periodId: number, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: surveyQueryKeys.pppPerformanceLevels(periodId),
		queryFn: () => listPPPPerformanceLevels(periodId),
		enabled: (options?.enabled ?? true) && periodId > 0,
	});
}

export function useUpdatePPPPerformanceLevels() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (params: { academic_period_id: number; niveles: PerformanceLevel[] }) =>
			updatePPPPerformanceLevels(params.academic_period_id, params.niveles),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['surveys', 'ppp', 'performance-levels'] });
		},
	});
}

export function usePPPDashboardQuery(
	params: {
		academic_period_id?: number;
		program_id?: number;
		campus_id?: number;
		practice_number?: number;
	},
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: surveyQueryKeys.pppDashboard(params),
		queryFn: () => generatePPPDashboard(params),
		enabled: options?.enabled ?? false,
	});
}
