'use client';

import { useState } from 'react';
import { Card, LoadingState, PageHeader } from '@/shared/components';
import { useI18n } from '@/providers';
import { CapstoneProjectCard, RubricEvaluationMatrix } from '../components/capstone';
import {
	useCapstoneProjects,
	useCapstoneRubric,
	useSubmitCapstoneEvaluation,
} from '../hooks/useCapstone';
import type { CapstoneProject } from '../types/capstone';

interface CapstoneConsolePageProps {
	professorId: number;
	studentsByProject: Record<number, Array<{ id: number; code: string; name: string }>>;
}

export default function CapstoneConsolePage({
	professorId,
	studentsByProject,
}: CapstoneConsolePageProps) {
	const { t } = useI18n();
	const { data: projects, isLoading: loadingProjects } = useCapstoneProjects(professorId);
	const [selectedProject, setSelectedProject] = useState<CapstoneProject | null>(null);
	const [selectedStudent, setSelectedStudent] = useState<{
		id: number;
		code: string;
		name: string;
	} | null>(null);
	const { data: rubric, isLoading: loadingRubric } = useCapstoneRubric(selectedProject?.id ?? null);
	const submit = useSubmitCapstoneEvaluation();

	return (
		<div className="space-y-6">
			<PageHeader title={t('capstone.title')} description={t('capstone.subtitle')} />

			<Card title={t('capstone.projects.title')} description={t('capstone.projects.description')}>
				{loadingProjects && (
					<LoadingState className="py-4" label={t('capstone.projects.loading')} />
				)}
				{!loadingProjects && (projects?.length ?? 0) === 0 && (
					<p className="py-6 text-center text-sm text-gray-400">{t('capstone.projects.empty')}</p>
				)}
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{(projects ?? []).map((p) => (
						<CapstoneProjectCard
							key={p.id}
							project={p}
							selected={selectedProject?.id === p.id}
							onSelect={(project) => {
								setSelectedProject(project);
								setSelectedStudent(null);
							}}
						/>
					))}
				</div>
			</Card>

			{selectedProject && (
				<Card title={t('capstone.students.title')} description={t('capstone.students.description')}>
					<div className="flex flex-wrap gap-2">
						{(studentsByProject[selectedProject.id] ?? []).map((s) => {
							const active = selectedStudent?.id === s.id;
							return (
								<button
									key={s.id}
									type="button"
									onClick={() => setSelectedStudent(s)}
									className={`rounded-full px-3 py-1 text-xs ${
										active
											? 'border border-red-400 bg-red-50 text-red-700'
											: 'border border-gray-200 bg-white text-gray-600 hover:border-red-300'
									}`}>
									{s.code} — {s.name}
								</button>
							);
						})}
					</div>
				</Card>
			)}

			{selectedProject && selectedStudent && (
				<>
					{loadingRubric && <LoadingState className="py-4" label={t('capstone.rubric.loading')} />}
					{rubric && (
						<RubricEvaluationMatrix
							rubric={rubric}
							student={selectedStudent}
							onSubmit={(payload) =>
								submit.mutateAsync(payload).then(() => setSelectedStudent(null))
							}
						/>
					)}
				</>
			)}
		</div>
	);
}
