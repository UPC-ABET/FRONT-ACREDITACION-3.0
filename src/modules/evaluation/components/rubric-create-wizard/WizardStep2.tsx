'use client';

import { useMemo, useState } from 'react';
import { Select, Button, SubTitle, Title, TYPE_GROUP_CODES, TYPE_CODES } from '@/shared';
import { useI18n } from '@/providers';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { useCourseOutcomeMappings } from '@/modules/academic/hooks';
import { COMPETENCY_SCOPE_LABELS } from '../../constants';
import type { Step1Data } from './WizardStep1';

const GRADE_TYPE_GROUP = TYPE_GROUP_CODES.GRADE_TYPE;
const COMPETENCY_SCOPE_GROUP = TYPE_GROUP_CODES.COMPETENCY_SCOPE;

export interface Step2Data {
	gradeTypeId: number;
	gradeTypeCode: string;
	gradeTypeName: { en: string; es: string };
	competencyScopeTypeId: number;
	competencyScopeTypeCode: string;
	competencyScopeTypeName: { en: string; es: string };
	useMultipleCompetencyEditor: boolean;
	outcomeIds: number[];
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
	const [selectedCompetencyScope, setSelectedCompetencyScope] = useState<AnyOption | null>(null);

	const { data: gradeTypes = [], isLoading: loadingGrade } = useTypesByGroupCode(GRADE_TYPE_GROUP);

	const { data: competencyScopeTypes = [], isLoading: loadingCompetencyScope } =
		useTypesByGroupCode(COMPETENCY_SCOPE_GROUP);

	const selectedGradeTypeObj = useMemo(
		() => gradeTypes.find((gt) => gt.id === Number(selectedGradeType?.value)) ?? null,
		[gradeTypes, selectedGradeType?.value],
	);

	const selectedCompetencyScopeObj = useMemo(
		() =>
			competencyScopeTypes.find((et) => et.id === Number(selectedCompetencyScope?.value)) ?? null,
		[competencyScopeTypes, selectedCompetencyScope?.value],
	);

	const useMultipleCompetencyEditor =
		step1.isCapstone && selectedCompetencyScopeObj?.code === TYPE_CODES.COMPETENCY_SCOPE.MULTIPLE;

	const { data: outcomeTypes = [] } = useTypesByGroupCode(TYPE_GROUP_CODES.OUTCOME_TYPE, {
		enabled: useMultipleCompetencyEditor,
	});
	const verificationOutcomeTypeId = outcomeTypes.find(
		(ot) => ot.code === TYPE_CODES.OUTCOME_TYPE.VERIFICATION,
	)?.id;

	const { data: mappings = [], isLoading: loadingMappings } = useCourseOutcomeMappings(
		{
			studyPlanCourseId: step1.studyPlanCourseId,
			isActive: true,
			outcomeTypeId: verificationOutcomeTypeId,
		},
		{ enabled: useMultipleCompetencyEditor && verificationOutcomeTypeId != null },
	);

	const outcomeIds = useMemo(() => mappings.map((m) => m.outcomeId), [mappings]);

	const handleNext = () => {
		if (!selectedGradeTypeObj || !selectedCompetencyScopeObj) return;
		onNext({
			gradeTypeId: selectedGradeTypeObj.id,
			gradeTypeCode: selectedGradeTypeObj.code,
			gradeTypeName: selectedGradeTypeObj.name,
			competencyScopeTypeId: selectedCompetencyScopeObj.id,
			competencyScopeTypeCode: selectedCompetencyScopeObj.code,
			competencyScopeTypeName: selectedCompetencyScopeObj.name,
			useMultipleCompetencyEditor: Boolean(useMultipleCompetencyEditor),
			outcomeIds: useMultipleCompetencyEditor ? outcomeIds : [],
		});
	};

	const gradeTypeOptions: AnyOption[] = gradeTypes.map((gt) => ({
		label: `${gt.name.es} — ${gt.description.es}`,
		value: gt.id,
	}));

	const competencyScopeOptions: AnyOption[] = competencyScopeTypes.map((et) => ({
		label: COMPETENCY_SCOPE_LABELS[et.code]?.es ?? et.name.es,
		value: et.id,
	}));

	const canContinue =
		!!selectedGradeType &&
		!!selectedCompetencyScope &&
		!(useMultipleCompetencyEditor && loadingMappings);

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

			<Select
				label={t('rubrics.wizard.step2.competencyScopeTypeLabel')}
				placeholder={
					loadingCompetencyScope
						? t('rubrics.wizard.step2.competencyScopeTypeLoading')
						: t('rubrics.wizard.step2.competencyScopeTypePlaceholder')
				}
				options={competencyScopeOptions}
				value={selectedCompetencyScope}
				isDisabled={loadingCompetencyScope}
				isSearchable
				onChange={(_, v) => setSelectedCompetencyScope(Array.isArray(v) ? (v[0] ?? null) : v)}
			/>

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
