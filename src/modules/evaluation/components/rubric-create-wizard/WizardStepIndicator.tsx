'use client';

import { useI18n } from '@/providers';
import { CheckIcon } from '@heroicons/react/24/solid';
import { cn } from '@/shared/lib/utils';

interface Step {
	label: string;
	description: string;
}

interface WizardStepIndicatorProps {
	steps: Step[];
	currentStep: number;
}

export function WizardStepIndicator({ steps, currentStep }: WizardStepIndicatorProps) {
	const { t } = useI18n();

	return (
		<nav aria-label={t('rubrics.wizard.stepIndicator.ariaLabel')}>
			<ol className="flex items-start gap-0">
				{steps.map((step, index) => {
					const stepNumber = index + 1;
					const isCompleted = stepNumber < currentStep;
					const isActive = stepNumber === currentStep;

					return (
						<li key={step.label} className="flex flex-1 items-center">
							<div className="flex flex-col items-center flex-1">
								<div className="flex items-center w-full">
									<div
										className={cn(
											'flex-1 h-0.5',
											index === 0
												? 'invisible'
												: isCompleted || isActive
													? 'bg-red-600'
													: 'bg-zinc-200',
										)}
									/>
									<div
										className={cn(
											'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
											isCompleted
												? 'border-red-600 bg-red-600 text-white'
												: isActive
													? 'border-red-600 bg-white text-red-600'
													: 'border-zinc-300 bg-white text-zinc-400',
										)}>
										{isCompleted ? <CheckIcon className="h-4 w-4" /> : stepNumber}
									</div>
									<div
										className={cn(
											'flex-1 h-0.5',
											index === steps.length - 1
												? 'invisible'
												: isCompleted
													? 'bg-red-600'
													: 'bg-zinc-200',
										)}
									/>
								</div>
								<div className="mt-2 text-center">
									<p
										className={cn(
											'text-xs font-semibold',
											isActive ? 'text-red-600' : isCompleted ? 'text-zinc-700' : 'text-zinc-400',
										)}>
										{step.label}
									</p>
									<p className="text-xs text-zinc-500 hidden sm:block">{step.description}</p>
								</div>
							</div>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
