'use client';

import { Button, SubTitle, Title } from '@/shared';
import { useI18n } from '@/providers';
import { useCourseScopeSelection, type CourseScopeData } from '../../hooks';
import { CourseScopeFields } from '../course-scope';

export type ProjectStep1Data = CourseScopeData;

interface ProjectWizardStep1Props {
	onNext: (data: ProjectStep1Data) => void;
}

export function ProjectWizardStep1({ onNext }: ProjectWizardStep1Props) {
	const { t } = useI18n();
	// Projects are created only on evaluable courses: without a rubric there is nothing to grade,
	// and both the project and rubric lists filter their course pickers by the same flag.
	const selection = useCourseScopeSelection({ spcFilterExtra: { isEvaluable: true } });

	const handleNext = () => {
		const data = selection.buildData();
		if (data) onNext(data);
	};

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

			<CourseScopeFields i18nPrefix="projects.create.step1" selection={selection} />

			<div className="flex justify-end">
				<Button variant="primary" disabled={!selection.isComplete} onClick={handleNext}>
					{t('projects.create.step1.next')}
				</Button>
			</div>
		</div>
	);
}
