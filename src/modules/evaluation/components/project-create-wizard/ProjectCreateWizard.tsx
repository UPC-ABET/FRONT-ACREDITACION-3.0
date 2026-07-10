'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers';
import { PageHeader, Toast } from '@/shared';
import { tryTranslateReason } from '@/shared/utils/tryTranslate';
import { useCreateProjectFull } from '../../hooks';
import { WizardStepIndicator } from '../rubric-create-wizard/WizardStepIndicator';
import { WizardStep1, type Step1Data } from '../rubric-create-wizard/WizardStep1';
import { ProjectWizardStep2, type ProjectFormData } from './ProjectWizardStep2';

export function ProjectCreateWizard() {
	const router = useRouter();
	const { t } = useI18n();

	const [currentStep, setCurrentStep] = useState(1);
	const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
	const createProjectFull = useCreateProjectFull();
	const [toast, setToast] = useState({
		open: false,
		type: 'info' as 'success' | 'error',
		message: '',
	});

	const showError = (message: string) => setToast({ open: true, type: 'error', message });

	const handleStep1Next = (data: Step1Data) => {
		setStep1Data(data);
		setCurrentStep(2);
	};

	const handleSubmit = async (formData: ProjectFormData) => {
		if (!step1Data) return;
		try {
			const project = await createProjectFull.mutateAsync({
				code: formData.code,
				name: { es: formData.name.es ?? '', en: formData.name.en ?? '' },
				description: { es: formData.description.es ?? '', en: formData.description.en ?? '' },
				studyPlanCourseId: step1Data.studyPlanCourseId,
				projectGroupId: formData.projectGroupId,
				studentSectionEnrollmentIds: formData.studentEnrollmentIds,
				evaluators: formData.evaluators,
			});
			router.push(
				project?.id
					? `/academic-projects/projects/${project.id}/edit`
					: '/academic-projects/projects',
			);
		} catch (err) {
			const key = err instanceof Error ? err.message : 'projects.create.error.create';
			showError(tryTranslateReason(t, key));
		}
	};

	const steps = [
		{
			label: t('projects.create.steps.step1.label'),
			description: t('projects.create.steps.step1.description'),
		},
		{
			label: t('projects.create.steps.step2.label'),
			description: t('projects.create.steps.step2.description'),
		},
	];

	return (
		<div className="space-y-6">
			<PageHeader title={t('projects.create.title')} description={t('projects.create.subtitle')} />

			<WizardStepIndicator steps={steps} currentStep={currentStep} />

			<div className="px-6 sm:max-w-[900px] m-auto">
				{currentStep === 1 && <WizardStep1 onNext={handleStep1Next} />}

				{currentStep === 2 && step1Data && (
					<ProjectWizardStep2
						step1={step1Data}
						onBack={() => setCurrentStep(1)}
						onSubmit={handleSubmit}
						isSubmitting={createProjectFull.isPending}
					/>
				)}
			</div>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.message}
				onClose={() => setToast((s) => ({ ...s, open: false }))}
			/>
		</div>
	);
}
