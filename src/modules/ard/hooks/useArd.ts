'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useABET } from '@/providers';
import { ardService } from '../services';
import type { ArdExportRequest, ArdReportFilters, ArdSaveMeetingDto } from '../types';
import { ardQueryKeys } from './queryKeys';

export function useArdMeetings(params: { page: number; pageSize: number; search: string }) {
	const { academicPeriodId } = useABET();

	return useQuery({
		queryKey: ardQueryKeys.list({ ...params, academicPeriodId }),
		queryFn: () =>
			ardService
				.list({ ...params, search: params.search.trim() || undefined }, { academicPeriodId })
				.then((response) => response.data),
		enabled: academicPeriodId !== null,
		placeholderData: (previousData) => previousData,
	});
}

export function useArdMeeting(id: number | null) {
	return useQuery({
		queryKey: ardQueryKeys.detail(id),
		queryFn: () => ardService.getById(id as number).then((response) => response.data),
		enabled: id !== null,
	});
}

export function useArdDelegateCandidates(campusId: number | null, programId: number | null) {
	const { academicPeriodId } = useABET();

	return useQuery({
		queryKey: ardQueryKeys.delegates(campusId, programId, academicPeriodId),
		queryFn: () =>
			ardService
				.getDelegateCandidates(campusId as number, programId as number, { academicPeriodId })
				.then((response) => response.data ?? []),
		enabled: campusId !== null && programId !== null && academicPeriodId !== null,
	});
}

export function useArdGuestCandidates(
	campusId: number | null,
	programId: number | null,
	search: string,
) {
	const { academicPeriodId } = useABET();

	return useQuery({
		queryKey: ardQueryKeys.guests(campusId, programId, search, academicPeriodId),
		queryFn: () =>
			ardService
				.getGuestCandidates(
					{
						campusId: campusId as number,
						programId: programId as number,
						search: search.trim() || undefined,
					},
					{ academicPeriodId },
				)
				.then((response) => response.data ?? []),
		enabled: campusId !== null && programId !== null && academicPeriodId !== null,
	});
}

export function useArdSectionOptions(campusId: number | null, studentCode?: string) {
	const { academicPeriodId } = useABET();

	return useQuery({
		queryKey: ardQueryKeys.sections(campusId, studentCode, academicPeriodId),
		queryFn: () =>
			ardService
				.getSectionOptions({ campusId: campusId as number, studentCode }, { academicPeriodId })
				.then((response) => response.data ?? []),
		enabled: campusId !== null && academicPeriodId !== null,
		staleTime: Infinity,
	});
}

export function useArdOrgChartCourses(programId: number | null, campusId: number | null) {
	const { academicPeriodId } = useABET();

	return useQuery({
		queryKey: ardQueryKeys.orgChartCourses(programId, campusId, academicPeriodId),
		queryFn: () =>
			ardService
				.getOrgChartCourses(programId as number, campusId as number, { academicPeriodId })
				.then((response) => response.data ?? []),
		enabled: programId !== null && campusId !== null && academicPeriodId !== null,
	});
}

export function useArdCourseProfessors(
	courseId: number | null,
	programId: number | null,
	campusId: number | null,
) {
	const { academicPeriodId } = useABET();

	return useQuery({
		queryKey: ardQueryKeys.courseProfessors(courseId, programId, campusId, academicPeriodId),
		queryFn: () =>
			ardService
				.getCourseProfessors(courseId as number, programId as number, campusId as number, {
					academicPeriodId,
				})
				.then((response) => response.data ?? []),
		enabled:
			courseId !== null && programId !== null && campusId !== null && academicPeriodId !== null,
	});
}

export function useArdMutations() {
	const { academicPeriodId, schoolId } = useABET();
	const queryClient = useQueryClient();
	const invalidate = () => queryClient.invalidateQueries({ queryKey: ardQueryKeys.all });

	const create = useMutation({
		mutationFn: (body: ArdSaveMeetingDto) =>
			ardService.create(body, { academicPeriodId, schoolId }).then((response) => response.data),
		onSuccess: invalidate,
	});

	const update = useMutation({
		mutationFn: ({ id, body }: { id: number; body: ArdSaveMeetingDto }) =>
			ardService.update(id, body, { academicPeriodId, schoolId }).then((response) => response.data),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (id: number) => ardService.delete(id).then((response) => response.data),
		onSuccess: invalidate,
	});

	return { create, update, remove };
}

export function useArdReportExport() {
	const exportActs = useMutation({
		mutationFn: (filters: ArdReportFilters) => ardService.exportActs(filters),
	});

	const exportAttendance = useMutation({
		mutationFn: (filters: ArdReportFilters) => ardService.exportAttendance(filters),
	});

	return { exportActs, exportAttendance };
}

export function useArdExport() {
	return useMutation({
		mutationFn: (body: ArdExportRequest) => ardService.exportReport(body),
	});
}

export function useArdAttendanceExport() {
	return useMutation({
		mutationFn: ({ ardId, lang }: { ardId: number; lang: 'es' | 'en' }) =>
			ardService.exportAttendanceByArd(ardId, lang),
	});
}
