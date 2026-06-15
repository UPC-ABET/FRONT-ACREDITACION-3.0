'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, Button, Badge, SubTitle, Title } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { useCourseOutcomeMappings } from '@/modules/academic/hooks';
import { rubricsService } from '../../services';
import type { Step1Data } from './WizardStep1';
import { TYPE_GROUP_CODES, TYPE_CODES } from '@/shared/constants';

const GRADE_TYPE_GROUP = TYPE_GROUP_CODES.GRADE_TYPE;
const CAPSTONE_RUBRIC_CODE = TYPE_CODES.RUBRIC_TYPE.CAPSTONE;

export interface Step2Data {
	gradeTypeId: number;
	gradeTypeCode: string;
	gradeTypeName: { en: string; es: string };
	rubricTypeId: number;
	rubricTypeCode: string;
	isCapstone: boolean;
	capstoneOutcomeIds: number[];
}

interface WizardStep2Props {
	step1: Step1Data;
	onBack: () => void;
	onNext: (data: Step2Data) => void;
}

type AnyOption = { label: string; value: string | number };

export function WizardStep2({ step1, onBack, onNext }: WizardStep2Props) {
	const { t } = useI18n();
	const [selectedGradeType, setSelectedGradeType] = useState<AnyOption | null>(null);

	const { data: gradeTypes = [], isLoading: loadingGrade } = useTypesByGroupCode(GRADE_TYPE_GROUP);

	const selectedGradeTypeObj = useMemo(
		() => gradeTypes.find((gt) => gt.id === Number(selectedGradeType?.value)) ?? null,
		[gradeTypes, selectedGradeType?.value],
	);

	const { data: resolvedType, isLoading: loadingResolve } = useQuery({
		queryKey: ['rubrics', 'resolve-type', step1.studyPlanCourseId, selectedGradeTypeObj?.id],
		queryFn: () =>
			rubricsService
				.resolveType(step1.studyPlanCourseId, selectedGradeTypeObj!.id)
				.then((r) => r.data),
		enabled: !!selectedGradeTypeObj,
	});

	const isCapstone = resolvedType?.code === CAPSTONE_RUBRIC_CODE;

	const { data: mappings = [], isLoading: loadingMappings } = useCourseOutcomeMappings(
		{ studyPlanCourseId: step1.studyPlanCourseId, isActive: true },
		{ enabled: isCapstone },
	);

	const capstoneOutcomeIds = useMemo(
		() => (isCapstone ? mappings.map((m) => m.outcomeId) : []),
		[isCapstone, mappings],
	);

	const handleNext = () => {
		if (!selectedGradeTypeObj || !resolvedType) return;
		onNext({
			gradeTypeId: selectedGradeTypeObj.id,
			gradeTypeCode: selectedGradeTypeObj.code,
			gradeTypeName: selectedGradeTypeObj.name,
			rubricTypeId: resolvedType.id,
			rubricTypeCode: resolvedType.code,
			isCapstone,
			capstoneOutcomeIds,
		});
	};

	const gradeTypeOptions: AnyOption[] = gradeTypes.map((gt) => ({
		label: `${gt.name.es} — ${gt.description.es}`,
		value: gt.id,
	}));

	const canContinue =
		!!selectedGradeType && !!resolvedType && !loadingResolve && !(isCapstone && loadingMappings);

	return (
		<div className="space-y-6">
			<div>
				<Title
					title={t('rubrics.wizard.step2.title')}
					className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900"
				/>
				<SubTitle
					name={t('rubrics.wizard.step2.subtitle')}
					className="mt-1 [&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-zinc-500"
				/>
			</div>

			<div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
				<span className="font-medium text-zinc-800">{step1.periodCode}</span>
				{' · '}
				<span>{step1.courseName.es}</span>
			</div>

			<Select
				label={t('rubrics.wizard.step2.gradeTypeLabel')}
				placeholder={
					loadingGrade
						? t('rubrics.wizard.step2.gradeTypeLoading')
						: t('rubrics.wizard.step2.gradeTypePlaceholder')
				}
				options={gradeTypeOptions}
				value={selectedGradeType}
				isDisabled={loadingGrade}
				isSearchable
				onChange={(_, v) => setSelectedGradeType(Array.isArray(v) ? (v[0] ?? null) : v)}
			/>

			{loadingResolve && (
				<p className="text-sm text-zinc-500">{t('rubrics.wizard.step2.verifyingOutcomes')}</p>
			)}

			{resolvedType && (
				<div className="flex items-center gap-3">
					<span className="text-sm text-zinc-600">{t('rubrics.wizard.step2.rubricTypeLabel')}</span>
					{isCapstone ? (
						<Badge variant="success">Capstone</Badge>
					) : (
						<Badge variant="outline">No Capstone</Badge>
					)}
					<span className="text-xs text-zinc-500">{resolvedType.name.es}</span>
				</div>
			)}

			<div className="flex justify-between">
				<Button variant="secondary" onClick={onBack}>
					{t('rubrics.wizard.step2.back')}
				</Button>
				<Button variant="primary" disabled={!canContinue} onClick={handleNext}>
					{t('rubrics.wizard.step2.next')}
				</Button>
			</div>
		</div>
	);
}
