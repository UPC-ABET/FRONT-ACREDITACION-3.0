'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/shared/components/ui/Toast';
import { PageHeader } from '@/shared/components';
import { useI18n } from '@/providers';
import { tryTranslateReason } from '@/shared/utils/tryTranslate';
import { useCreateRubricFull } from '@/modules';
import type { CreateRubricFullDto } from '@/modules';
import { WizardStepIndicator } from './WizardStepIndicator';
import { WizardStep1, type Step1Data } from './WizardStep1';
import { WizardStep2, type Step2Data } from './WizardStep2';
import { WizardStep3NonCapstone, type NonCapstonePayloadQuestion } from './WizardStep3NonCapstone';
import { WizardStep3Capstone, type CapstonePayloadQuestion } from './WizardStep3Capstone';
import { TYPE_CODES } from '@/shared';

export function RubricCreateWizard() {
	const router = useRouter();
	const { t } = useI18n();
	const [currentStep, setCurrentStep] = useState(1);
	const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
	const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
	const [toast, setToast] = useState({
		open: false,
		type: 'info' as 'success' | 'error',
		message: '',
	});

	const createRubricFull = useCreateRubricFull();

	const showError = (message: string) => setToast({ open: true, type: 'error', message });

	const handleStep1Next = (data: Step1Data) => {
		setStep1Data(data);
		setCurrentStep(2);
	};
	const handleStep2Next = (data: Step2Data) => {
		setStep2Data(data);
		setCurrentStep(3);
	};

	const handleSubmit = async (
		questions: NonCapstonePayloadQuestion[] | CapstonePayloadQuestion[],
	) => {
		if (!step1Data || !step2Data) return;
		try {
			const body: CreateRubricFullDto = {
				rubricTypeId: step2Data.rubricTypeId,
				gradeTypeId: step2Data.gradeTypeId,
				studyPlanCourseId: step1Data.studyPlanCourseId,
				questions: questions as CreateRubricFullDto['questions'],
			};
			const rubric = await createRubricFull.mutateAsync(body);
			const rubricId = rubric?.id;
			router.push(rubricId ? `/rubrics/${rubricId}/edit` : '/rubrics');
		} catch (err) {
			const key = err instanceof Error ? err.message : 'rubrics.wizard.error.createRubric';
			showError(tryTranslateReason(t, key));
		}
	};

	const steps = [
		{
			label: t('rubrics.wizard.steps.step1.label'),
			description: t('rubrics.wizard.steps.step1.description'),
		},
		{
			label: t('rubrics.wizard.steps.step2.label'),
			description: t('rubrics.wizard.steps.step2.description'),
		},
		{
			label: t('rubrics.wizard.steps.step3.label'),
			description: t('rubrics.wizard.steps.step3.description'),
		},
	];

	const useCapstoneEditor =
		step2Data?.isCapstone && step2Data?.gradeTypeCode === TYPE_CODES.GRADE_TYPE.FINAL;

	return (
		<div className="space-y-6">
			<PageHeader title={t('rubrics.wizard.title')} description={t('rubrics.wizard.subtitle')} />

			<WizardStepIndicator steps={steps} currentStep={currentStep} />

			<div className="px-6 sm:max-w-[900px] m-auto">
				{currentStep === 1 && <WizardStep1 onNext={handleStep1Next} />}

				{currentStep === 2 && step1Data && (
					<WizardStep2
						step1={step1Data}
						onBack={() => setCurrentStep(1)}
						onNext={handleStep2Next}
					/>
				)}

				{currentStep === 3 &&
					step1Data &&
					step2Data &&
					(useCapstoneEditor ? (
						<WizardStep3Capstone
							step1={step1Data}
							step2={step2Data}
							onBack={() => setCurrentStep(2)}
							onSubmit={handleSubmit}
							isSubmitting={createRubricFull.isPending}
						/>
					) : (
						<WizardStep3NonCapstone
							step1={step1Data}
							step2={step2Data}
							onBack={() => setCurrentStep(2)}
							onSubmit={handleSubmit}
							isSubmitting={createRubricFull.isPending}
						/>
					))}
			</div>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.message}
				onClose={() => setToast((prev) => ({ ...prev, open: false }))}
			/>
		</div>
	);
}
