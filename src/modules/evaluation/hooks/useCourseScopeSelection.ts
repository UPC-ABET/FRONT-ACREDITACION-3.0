'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useABET, useI18n } from '@/providers';
import {
	programsService,
	studyPlanCoursesService,
	useAcademicPeriods,
	StudyPlanCourseResponse,
} from '@/modules';

export type CourseScopeOption = { label: string; value: string | number };

export interface CourseScopeData {
	periodId: number;
	programId: number;
	courseId: number;
	studyPlanCourseId: number;
	studyPlanAcademicPeriodId: number;
	courseName: { en: string; es: string };
	periodCode: string;
}

export interface CourseScopeSelection {
	hasPeriod: boolean;
	selectedProgramId: number | null;
	selectedProgramOpt: CourseScopeOption | null;
	selectedCourseOpt: CourseScopeOption | null;
	selectedSpc: StudyPlanCourseResponse | null;
	programOptions: CourseScopeOption[];
	courseOptions: CourseScopeOption[];
	loadingPrograms: boolean;
	loadingSpc: boolean;
	selectProgram: (opt: CourseScopeOption | null) => void;
	selectCourse: (opt: CourseScopeOption | null) => void;
	isComplete: boolean;
	buildData: () => CourseScopeData | null;
}

interface UseCourseScopeSelectionOptions {
	spcFilterExtra?: Record<string, unknown>;
}

export function getSpcCourseName(spc: StudyPlanCourseResponse): { en: string; es: string } {
	const raw = spc.course?.name;
	if (!raw) return { en: '', es: '' };
	return typeof raw === 'string' ? { en: raw, es: raw } : raw;
}

export function useCourseScopeSelection({
	spcFilterExtra,
}: UseCourseScopeSelectionOptions = {}): CourseScopeSelection {
	const { locale } = useI18n();
	const { academicPeriodId, schoolId, modalityTypeId } = useABET();

	const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
	const [selectedProgramOpt, setSelectedProgramOpt] = useState<CourseScopeOption | null>(null);
	const [selectedSpc, setSelectedSpc] = useState<StudyPlanCourseResponse | null>(null);
	const [selectedCourseOpt, setSelectedCourseOpt] = useState<CourseScopeOption | null>(null);

	const [trackedPeriodId, setTrackedPeriodId] = useState(academicPeriodId);
	if (academicPeriodId !== trackedPeriodId) {
		setTrackedPeriodId(academicPeriodId);
		setSelectedProgramId(null);
		setSelectedProgramOpt(null);
		setSelectedCourseOpt(null);
		setSelectedSpc(null);
	}

	const { data: periods = [] } = useAcademicPeriods({ isActive: true });

	const { data: programs = [], isLoading: loadingPrograms } = useQuery({
		queryKey: [
			'programs',
			'filtered',
			{ isActive: true, schoolFilter: true, modalityTypeId },
			{ schoolId, academicPeriodId },
		] as const,
		queryFn: () =>
			programsService
				.getByFilters({
					isActive: true,
					schoolFilter: true,
					modalityTypeId: modalityTypeId ?? undefined,
				})
				.then((r) => r.data ?? []),
		enabled: !!schoolId && !!academicPeriodId,
	});

	const { data: spcList = [], isLoading: loadingSpc } = useQuery({
		queryKey: [
			'academic',
			'spc',
			{ programId: selectedProgramId, isActive: true, extra: spcFilterExtra ?? null },
			{ schoolId, modalityTypeId, academicPeriodId },
		] as const,
		queryFn: () =>
			studyPlanCoursesService
				.getByFilters({
					programId: selectedProgramId ?? undefined,
					isActive: true,
					...(spcFilterExtra ? { extra: spcFilterExtra } : {}),
				})
				.then((r) => r.data ?? []),
		enabled: !!academicPeriodId && !!selectedProgramId,
	});

	const selectedPeriod = useMemo(
		() => periods.find((p) => p.id === academicPeriodId) ?? null,
		[periods, academicPeriodId],
	);

	const programOptions = useMemo<CourseScopeOption[]>(
		() =>
			programs.map((p) => ({
				label: p.name[locale as 'es' | 'en'] ?? p.name.es,
				value: p.id,
			})),
		[programs, locale],
	);

	const courseOptions = useMemo<CourseScopeOption[]>(
		() =>
			spcList.map((spc) => ({
				label: getSpcCourseName(spc)[locale as 'es' | 'en'] || String(spc.courseId),
				value: spc.id,
			})),
		[spcList, locale],
	);

	const selectProgram = (opt: CourseScopeOption | null) => {
		setSelectedProgramOpt(opt);
		setSelectedProgramId(opt ? Number(opt.value) : null);
		setSelectedCourseOpt(null);
		setSelectedSpc(null);
	};

	const selectCourse = (opt: CourseScopeOption | null) => {
		setSelectedCourseOpt(opt);
		setSelectedSpc(opt ? (spcList.find((s) => s.id === Number(opt.value)) ?? null) : null);
	};

	const buildData = (): CourseScopeData | null => {
		if (!selectedPeriod || !selectedProgramId || !selectedSpc) return null;
		return {
			periodId: selectedPeriod.id,
			programId: selectedProgramId,
			courseId: selectedSpc.course?.id ?? selectedSpc.courseId,
			studyPlanCourseId: selectedSpc.id,
			studyPlanAcademicPeriodId: selectedSpc.studyPlanAcademicPeriodId,
			courseName: getSpcCourseName(selectedSpc),
			periodCode: selectedPeriod.code,
		};
	};

	return {
		hasPeriod: !!academicPeriodId,
		selectedProgramId,
		selectedProgramOpt,
		selectedCourseOpt,
		selectedSpc,
		programOptions,
		courseOptions,
		loadingPrograms,
		loadingSpc,
		selectProgram,
		selectCourse,
		isComplete: !!selectedPeriod && !!selectedSpc,
		buildData,
	};
}
