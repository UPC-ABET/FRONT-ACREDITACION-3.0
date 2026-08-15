'use client';

import { Badge, Button, SubTitle, Title, TYPE_CODES } from '@/shared';
import { useI18n } from '@/providers';
import { useResolveRubricType } from '@/modules';
import { useCourseScopeSelection, type CourseScopeData } from '../../hooks';
import { CourseScopeFields } from '../course-scope';

export interface Step1Data extends CourseScopeData {
	rubricTypeId: number;
	rubricTypeCode: string;
	isCapstone: boolean;
}

interface WizardStep1Props {
	onNext: (data: Step1Data) => void;
}

export function WizardStep1({ onNext }: WizardStep1Props) {
	const { t } = useI18n();
	// Rubrics can only be created for courses flagged as evaluable.
	const selection = useCourseScopeSelection({ spcFilterExtra: { isEvaluable: true } });

	const { data: resolvedType, isLoading: loadingResolve } = useResolveRubricType(
		selection.selectedSpc?.id,
	);

	const isCapstone = resolvedType?.code === TYPE_CODES.RUBRIC_TYPE.CAPSTONE;

	const handleNext = () => {
		const data = selection.buildData();
		if (!data || !resolvedType) return;
		onNext({
			...data,
			rubricTypeId: resolvedType.id,
			rubricTypeCode: resolvedType.code,
			isCapstone,
		});
	};

	const canContinue = selection.isComplete && !!resolvedType && !loadingResolve;

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

			<CourseScopeFields i18nPrefix="rubrics.wizard.step1" selection={selection} />

			{loadingResolve && (
				<p className="text-sm text-zinc-500">{t('rubrics.wizard.step1.verifyingOutcomes')}</p>
			)}

			{resolvedType && (
				<div className="flex items-center gap-3">
					<span className="text-sm text-zinc-600">{t('rubrics.wizard.step1.rubricTypeLabel')}</span>
					{isCapstone ? (
						<Badge variant="success">{t('rubrics.badges.capstone')}</Badge>
					) : (
						<Badge variant="outline">{t('rubrics.badges.noCapstone')}</Badge>
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
