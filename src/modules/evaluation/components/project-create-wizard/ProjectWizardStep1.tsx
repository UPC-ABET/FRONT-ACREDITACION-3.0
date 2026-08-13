'use client';

import { useMemo, useState } from 'react';
import { Select, Button, SubTitle, Title } from '@/shared';
import { useI18n, useABET } from '@/providers';
import {
	useAcademicPeriods,
	useStudyPlanCourses,
	usePrograms,
	StudyPlanCourseResponse,
} from '@/modules';

export interface ProjectStep1Data {
	periodId: number;
	programId: number;
	courseId: number;
	studyPlanCourseId: number;
	studyPlanAcademicPeriodId: number;
	courseName: { en: string; es: string };
	periodCode: string;
}

interface ProjectWizardStep1Props {
	onNext: (data: ProjectStep1Data) => void;
}

type AnyOption = { label: string; value: string | number };

function getSpcCourseName(spc: StudyPlanCourseResponse): { en: string; es: string } {
	const raw = spc.course?.name;
	if (!raw) return { en: '', es: '' };
	return typeof raw === 'string' ? { en: raw, es: raw } : raw;
}

export function ProjectWizardStep1({ onNext }: ProjectWizardStep1Props) {
	const { t, locale } = useI18n();
	const { academicPeriodId, schoolId, modalityTypeId } = useABET();

	const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
	const [selectedProgramOpt, setSelectedProgramOpt] = useState<AnyOption | null>(null);
	const [selectedSpc, setSelectedSpc] = useState<StudyPlanCourseResponse | null>(null);
	const [selectedCourseOpt, setSelectedCourseOpt] = useState<AnyOption | null>(null);

	const [trackedPeriodId, setTrackedPeriodId] = useState(academicPeriodId);
	if (academicPeriodId !== trackedPeriodId) {
		setTrackedPeriodId(academicPeriodId);
		setSelectedProgramId(null);
		setSelectedProgramOpt(null);
		setSelectedCourseOpt(null);
		setSelectedSpc(null);
	}

	const { data: periods = [] } = useAcademicPeriods({ isActive: true });

	const { data: programs = [], isLoading: loadingPrograms } = usePrograms(
		{ isActive: true, schoolFilter: true, modalityTypeId: modalityTypeId ?? undefined },
		{ enabled: !!schoolId && !!academicPeriodId },
	);

	// Project courses aren't restricted to rubric-evaluable ones — any active study plan course works.
	const { data: spcList = [], isLoading: loadingSpc } = useStudyPlanCourses(
		{
			programId: selectedProgramId ?? undefined,
			isActive: true,
		},
		{ enabled: !!academicPeriodId && !!selectedProgramId },
	);

	const handleNext = () => {
		if (!academicPeriodId || !selectedProgramId || !selectedSpc) return;
		const period = periods.find((p) => p.id === academicPeriodId);
		if (!period) return;
		onNext({
			periodId: period.id,
			programId: selectedProgramId,
			courseId: selectedSpc.course?.id ?? selectedSpc.courseId,
			studyPlanCourseId: selectedSpc.id,
			studyPlanAcademicPeriodId: selectedSpc.studyPlanAcademicPeriodId,
			courseName: getSpcCourseName(selectedSpc),
			periodCode: period.code,
		});
	};

	const programOptions: AnyOption[] = useMemo(
		() =>
			programs.map((p) => ({
				label: p.name[locale as 'es' | 'en'] ?? p.name.es,
				value: p.id,
			})),
		[programs, locale],
	);

	const courseOptions: AnyOption[] = useMemo(
		() =>
			spcList.map((spc) => ({
				label: getSpcCourseName(spc)[locale as 'es' | 'en'] || String(spc.courseId),
				value: spc.id,
			})),
		[spcList, locale],
	);

	const canContinue = !!academicPeriodId && !!selectedSpc;

	return (
		<div className="space-y-6">
			<div>
				<Title
					title={t('projects.create.step1.title')}
					className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900"
				/>
				<SubTitle
					name={t('projects.create.step1.subtitle')}
					className="mt-1 [&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-zinc-500"
				/>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				<Select
					label={t('projects.create.step1.programLabel')}
					placeholder={
						!academicPeriodId
							? t('projects.create.step1.selectPeriodFirst')
							: loadingPrograms
								? t('projects.create.step1.programLoading')
								: programs.length === 0
									? t('projects.create.step1.programNoOptions')
									: t('projects.create.step1.programPlaceholder')
					}
					options={programOptions}
					value={selectedProgramOpt}
					isDisabled={!academicPeriodId || loadingPrograms}
					isSearchable
					onChange={(_, v) => {
						const opt = Array.isArray(v) ? (v[0] ?? null) : v;
						setSelectedProgramOpt(opt as AnyOption | null);
						setSelectedProgramId(opt ? Number(opt.value) : null);
						setSelectedCourseOpt(null);
						setSelectedSpc(null);
					}}
				/>

				<Select
					label={t('projects.create.step1.courseLabel')}
					placeholder={
						!selectedProgramId
							? t('projects.create.step1.courseSelectProgramFirst')
							: loadingSpc
								? t('projects.create.step1.courseLoading')
								: spcList.length === 0
									? t('projects.create.step1.courseNoOptions')
									: t('projects.create.step1.coursePlaceholder')
					}
					options={courseOptions}
					value={selectedCourseOpt}
					isDisabled={!selectedProgramId || loadingSpc || spcList.length === 0}
					isSearchable
					onChange={(_, v) => {
						const opt = Array.isArray(v) ? (v[0] ?? null) : v;
						setSelectedCourseOpt(opt as AnyOption | null);
						const spc = opt ? (spcList.find((s) => s.id === Number(opt.value)) ?? null) : null;
						setSelectedSpc(spc);
					}}
				/>
			</div>

			<div className="flex justify-end">
				<Button variant="primary" disabled={!canContinue} onClick={handleNext}>
					{t('projects.create.step1.next')}
				</Button>
			</div>
		</div>
	);
}
