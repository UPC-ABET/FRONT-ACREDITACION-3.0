'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Button } from '@/shared/components/ui';
import { useI18n, useABET } from '@/providers';
import { useAcademicPeriods, useStudyPlanCourses } from '@/modules/academic/hooks';
import { programsService } from '@/modules/academic/services';
import { StudyPlanCourseResponse } from '@/modules/academic';

export interface Step1Data {
	periodId: number;
	courseId: number;
	studyPlanCourseId: number;
	studyPlanAcademicPeriodId: number;
	courseName: { en: string; es: string };
	periodCode: string;
}

interface WizardStep1Props {
	onNext: (data: Step1Data) => void;
}

type AnyOption = { label: string; value: string | number };

function getSpcCourseName(spc: StudyPlanCourseResponse): { en: string; es: string } {
	const raw = spc.course?.name;
	if (!raw) return { en: '', es: '' };
	return typeof raw === 'string' ? { en: raw, es: raw } : raw;
}

export function WizardStep1({ onNext }: WizardStep1Props) {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();

	const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
	const [selectedProgramOpt, setSelectedProgramOpt] = useState<AnyOption | null>(null);
	const [selectedSpc, setSelectedSpc] = useState<StudyPlanCourseResponse | null>(null);
	const [selectedCourseOpt, setSelectedCourseOpt] = useState<AnyOption | null>(null);

	const { data: periods = [] } = useAcademicPeriods({ isActive: true });

	const { data: programs = [], isLoading: loadingPrograms } = useQuery({
		queryKey: ['programs', 'filtered', { academicPeriodId, isActive: true }],
		queryFn: () =>
			programsService
				.getByFilters({ academicPeriodId: academicPeriodId!, isActive: true })
				.then((r) => r.data),
		enabled: !!academicPeriodId,
	});

	// Evaluable SPCs filtered by programId once a program is selected
	const { data: spcList = [], isLoading: loadingSpc } = useStudyPlanCourses(
		{
			academicPeriodId: academicPeriodId ?? 0,
			programId: selectedProgramId ?? undefined,
			// NOTE: Backend field is "is_evaluable" (snake_case), do NOT convert to camelCase
			extra: { is_evaluable: true },
			isActive: true,
		},
		{ enabled: !!academicPeriodId && !!selectedProgramId },
	);

	const handleNext = () => {
		if (!academicPeriodId || !selectedSpc) return;
		const period = periods.find((p) => p.id === academicPeriodId);
		if (!period) return;
		onNext({
			periodId: period.id,
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
				<h2 className="text-lg font-semibold text-zinc-900">{t('rubrics.wizard.step1.title')}</h2>
				<p className="mt-1 text-sm text-zinc-500">{t('rubrics.wizard.step1.subtitle')}</p>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				<Select
					label={t('rubrics.wizard.step1.programLabel')}
					placeholder={
						!academicPeriodId
							? t('rubrics.wizard.step1.selectPeriodFirst')
							: loadingPrograms
								? t('rubrics.wizard.step1.programLoading')
								: programs.length === 0
									? t('rubrics.wizard.step1.programNoOptions')
									: t('rubrics.wizard.step1.programPlaceholder')
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
					label={t('rubrics.wizard.step1.courseLabel')}
					placeholder={
						!selectedProgramId
							? t('rubrics.wizard.step1.courseSelectProgramFirst')
							: loadingSpc
								? t('rubrics.wizard.step1.courseLoading')
								: spcList.length === 0
									? t('rubrics.wizard.step1.courseNoOptions')
									: t('rubrics.wizard.step1.coursePlaceholder')
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
					{t('rubrics.wizard.step1.next')}
				</Button>
			</div>
		</div>
	);
}
