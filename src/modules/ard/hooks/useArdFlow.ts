'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useABET } from '@/providers';
import { ardFlowService } from '../services';
import type {
	ArdBulkDetailsBody,
	ArdExportRequest,
	ArdMaintenanceParams,
	CreateArdBody,
	UpdateArdBody,
} from '../types';
import { ardQueryKeys } from './queryKeys';

export function useArdById(id: number | null) {
	return useQuery({
		queryKey: ardQueryKeys.detail(id),
		queryFn: () => ardFlowService.getById(id as number).then((response) => response.data),
		enabled: id !== null,
	});
}

export function useArdMaintenance(params: ArdMaintenanceParams) {
	const { academicPeriodId } = useABET();

	return useQuery({
		queryKey: ardQueryKeys.maintenance(params, academicPeriodId),
		queryFn: () => ardFlowService.maintenance(params).then((response) => response.data),
		enabled: academicPeriodId !== null,
		placeholderData: (previousData) => previousData,
	});
}

export function useArdClassRepresentatives(programId: number | null, campusId: number | null) {
	const { academicPeriodId } = useABET();

	return useQuery({
		queryKey: ardQueryKeys.classRepresentatives(programId, campusId, academicPeriodId),
		queryFn: () =>
			ardFlowService
				.classRepresentatives({ programId: programId as number, campusId: campusId as number })
				.then((response) => response.data),
		enabled: programId !== null && campusId !== null && academicPeriodId !== null,
	});
}

export function useArdProgramCourses(programId: number | null) {
	const { academicPeriodId } = useABET();

	return useQuery({
		queryKey: ardQueryKeys.programCourses(programId, academicPeriodId),
		queryFn: () =>
			ardFlowService
				.programCourses({ programId: programId as number })
				.then((response) => response.data),
		enabled: programId !== null && academicPeriodId !== null,
	});
}

export function useArdCourseProfessorOptions(courseId: number | null, campusId: number | null) {
	const { academicPeriodId } = useABET();

	return useQuery({
		queryKey: ardQueryKeys.courseProfessors(courseId, campusId, academicPeriodId),
		queryFn: () =>
			ardFlowService
				.courseProfessors({ courseId: courseId as number, campusId: campusId as number })
				.then((response) => response.data),
		enabled: courseId !== null && campusId !== null && academicPeriodId !== null,
	});
}

export function useCreateArd() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: CreateArdBody) =>
			ardFlowService.create(body).then((response) => response.data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ardQueryKeys.all }),
	});
}

export function useArdBulkDetails() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: ArdBulkDetailsBody) =>
			ardFlowService.bulkDetails(body).then((response) => response.data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ardQueryKeys.all }),
	});
}

export function useUpdateArd() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: number; body: UpdateArdBody }) =>
			ardFlowService.update(id, body).then((response) => response.data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ardQueryKeys.all }),
	});
}

export function useDeleteArd() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => ardFlowService.remove(id).then((response) => response.data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ardQueryKeys.all }),
	});
}

export function useArdExport() {
	return useMutation({
		mutationFn: (body: ArdExportRequest) => ardFlowService.exportReport(body),
	});
}

export function useArdAttendanceExport() {
	return useMutation({
		mutationFn: ({ ardId, lang }: { ardId: number; lang: 'es' | 'en' }) =>
			ardFlowService.exportAttendanceByArd(ardId, lang),
	});
}
