'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Button, Badge, SubTitle, Title } from '@/shared/components/ui';
import { useI18n, useABET } from '@/providers';
import { useAcademicPeriods, useStudyPlanCourses, usePrograms } from '@/modules/academic/hooks';
import { StudyPlanCourseResponse } from '@/modules/academic';
import { rubricsService } from '@/modules';
import { TYPE_CODES } from '@/shared';

export interface Step1Data {
	periodId: number;
	courseId: number;
	studyPlanCourseId: number;
	studyPlanAcademicPeriodId: number;
	courseName: { en: string; es: string };
	periodCode: string;
	rubricTypeId: number;
	rubricTypeCode: string;
	isCapstone: boolean;
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

	// Evaluable SPCs filtered by programId once a program is selected
	const { data: spcList = [], isLoading: loadingSpc } = useStudyPlanCourses(
		{
			programId: selectedProgramId ?? undefined,
			extra: { isEvaluable: true },
			isActive: true,
		},
		{ enabled: !!academicPeriodId && !!selectedProgramId },
	);

	const { data: resolvedType, isLoading: loadingResolve } = useQuery({
		queryKey: ['rubrics', 'resolve-type', selectedSpc?.id],
		queryFn: () => rubricsService.resolveType(selectedSpc!.id).then((r) => r.data),
		enabled: !!selectedSpc,
	});

	const isCapstone = resolvedType?.code === TYPE_CODES.RUBRIC_TYPE.CAPSTONE;

	const handleNext = () => {
		if (!academicPeriodId || !selectedSpc || !resolvedType) return;
		const period = periods.find((p) => p.id === academicPeriodId);
		if (!period) return;
		onNext({
			periodId: period.id,
			courseId: selectedSpc.course?.id ?? selectedSpc.courseId,
			studyPlanCourseId: selectedSpc.id,
			studyPlanAcademicPeriodId: selectedSpc.studyPlanAcademicPeriodId,
			courseName: getSpcCourseName(selectedSpc),
			periodCode: period.code,
			rubricTypeId: resolvedType.id,
			rubricTypeCode: resolvedType.code,
			isCapstone,
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

	const canContinue = !!academicPeriodId && !!selectedSpc && !!resolvedType && !loadingResolve;

	return (
		<div className="space-y-6">
			<div>
				<Title
					title={t('rubrics.wizard.step1.title')}
					className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900"
				/>
				<SubTitle
					name={t('rubrics.wizard.step1.subtitle')}
					className="mt-1 [&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-zinc-500"
				/>
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

			{loadingResolve && (
				<p className="text-sm text-zinc-500">{t('rubrics.wizard.step1.verifyingOutcomes')}</p>
			)}

			{resolvedType && (
				<div className="flex items-center gap-3">
					<span className="text-sm text-zinc-600">{t('rubrics.wizard.step1.rubricTypeLabel')}</span>
					{isCapstone ? (
						<Badge variant="success">Capstone</Badge>
					) : (
						<Badge variant="outline">No Capstone</Badge>
					)}
				</div>
			)}

			<div className="flex justify-end">
				<Button variant="primary" disabled={!canContinue} onClick={handleNext}>
					{t('rubrics.wizard.step1.next')}
				</Button>
			</div>
		</div>
	);
}
