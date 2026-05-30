'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers';
import { Toast } from '@/shared/components/ui/Toast';
import { projectsService } from '../../services';
import { WizardStepIndicator } from '../rubric-create-wizard/WizardStepIndicator';
import { WizardStep1, type Step1Data } from '../rubric-create-wizard/WizardStep1';
import { ProjectWizardStep2, type ProjectFormData } from './ProjectWizardStep2';

export function ProjectCreateWizard() {
	const router = useRouter();
	const { t } = useI18n();

	const [currentStep, setCurrentStep] = useState(1);
	const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
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
		setIsSubmitting(true);
		try {
			const body = {
				code: formData.code,
				name: { es: formData.name, en: formData.name },
				description: { es: formData.description, en: formData.description },
				studyPlanCourseId: step1Data.studyPlanCourseId,
				studentSectionEnrollmentIds: formData.studentEnrollmentIds,
				evaluators: formData.evaluators,
			};
			const res = await projectsService.createFull(body);
			const projectId = res.data?.id;
			router.push(projectId ? `/projects/${projectId}/edit` : '/projects');
		} catch (err) {
			showError(err instanceof Error ? err.message : t('projects.create.error.create'));
			setIsSubmitting(false);
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
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold text-zinc-900">{t('projects.create.title')}</h1>
				<p className="mt-2 text-zinc-600">{t('projects.create.subtitle')}</p>
			</div>

			<WizardStepIndicator steps={steps} currentStep={currentStep} />

			<div className="px-6 sm:max-w-[900px] m-auto">
				{currentStep === 1 && <WizardStep1 onNext={handleStep1Next} />}

				{currentStep === 2 && step1Data && (
					<ProjectWizardStep2
						step1={step1Data}
						onBack={() => setCurrentStep(1)}
						onSubmit={handleSubmit}
						isSubmitting={isSubmitting}
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
