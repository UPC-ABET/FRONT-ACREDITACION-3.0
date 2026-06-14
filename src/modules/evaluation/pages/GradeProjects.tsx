'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import {
	PageHeader,
	Table,
	TableBody,
	TableCell,
	TableEmptyState,
	TableErrorState,
	TableHead,
	TableHeader,
	TableLoadingState,
	TableRow,
	Tabs,
} from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useI18n, useABET } from '@/providers';
import { useAuth } from '@/providers';
import { useProfessorByUserId } from '@/modules/academic/hooks';
import { useProjectsByProfessor } from '../hooks';
import { TYPE_CODES } from '@/shared/constants';

type RubricTab = 'partial' | 'final';

const GRADE_TYPE_CODE: Record<RubricTab, string> = {
	partial: TYPE_CODES.GRADE_TYPE.PARTIAL,
	final: TYPE_CODES.GRADE_TYPE.FINAL,
};

export function GradeProjectsPage() {
	const { t, locale } = useI18n();
	const { user: authUser } = useAuth();
	const { academicPeriodId: selectedPeriodId, schoolId } = useABET();

	const [activeTab, setActiveTab] = useState<RubricTab>('partial');

	const userId = authUser?.id ?? null;

	const professorEnabled = userId != null;

	const {
		data: professor,
		isLoading: isLoadingProfessor,
		isFetching: isFetchingProfessor,
		isError: isErrorProfessor,
	} = useProfessorByUserId(userId ?? undefined);

	const {
		data: projects = [],
		isLoading: isLoadingProjects,
		isError: isErrorProjects,
		error: projectsError,
	} = useProjectsByProfessor(
		professor?.id,
		{
			...(schoolId != null ? { schoolId } : {}),
			...(selectedPeriodId != null ? { academicPeriodId: selectedPeriodId } : {}),
			gradeTypeCode: GRADE_TYPE_CODE[activeTab],
		},
		{ enabled: selectedPeriodId !== null },
	);

	const isLoading =
		!professorEnabled || isFetchingProfessor || isLoadingProfessor || isLoadingProjects;

	const professorNotFound =
		professorEnabled && !isLoadingProfessor && !isFetchingProfessor && !professor;

	const formatDate = (dateStr: string | undefined) => {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString(locale === 'es' ? 'es-PE' : 'en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const tabs = [
		{ id: 'partial' as const, label: t('projects.grade.tabs.partial') },
		{ id: 'final' as const, label: t('projects.grade.tabs.final') },
	];

	const handleTabChange = (id: string) => {
		setActiveTab(id as RubricTab);
	};

	return (
		<div className="space-y-6">
			<PageHeader title={t('projects.grade.title')} description={t('projects.grade.description')} />

			<Tabs
				tabs={tabs}
				activeTab={activeTab}
				onChange={handleTabChange}
				ariaLabel={t('projects.grade.tabs.ariaLabel')}
			/>

			{isLoading ? (
				<TableLoadingState
					label={
						!professorEnabled || isFetchingProfessor || isLoadingProfessor
							? t('projects.grade.loadingProfessor')
							: t('projects.grade.loading')
					}
				/>
			) : isErrorProfessor || professorNotFound ? (
				<TableErrorState message={t('projects.grade.errorProfessor')} />
			) : isErrorProjects ? (
				<TableErrorState
					message={
						projectsError instanceof Error ? projectsError.message : t('projects.grade.error')
					}
				/>
			) : !projects.length ? (
				<TableEmptyState message={t('projects.grade.empty')} />
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t('projects.grade.table.code')}</TableHead>
							<TableHead>{t('projects.grade.table.name')}</TableHead>
							<TableHead>{t('projects.grade.table.course')}</TableHead>
							<TableHead>{t('projects.grade.table.evaluator')}</TableHead>
							<TableHead>{t('projects.grade.table.students')}</TableHead>
							<TableHead>{t('projects.grade.table.evaluationDate')}</TableHead>
							<TableHead className="text-center">{t('projects.grade.table.actions')}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{projects.map((project) => (
							<TableRow key={project.projectId}>
								<TableCell>
									<span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 font-mono text-xs font-medium text-zinc-700">
										{project.projectCode}
									</span>
								</TableCell>

								<TableCell>
									<span className="font-medium text-zinc-900">
										{project.projectName[locale as 'es' | 'en'] ?? project.projectName.es}
									</span>
								</TableCell>

								<TableCell>
									<span className="text-sm text-zinc-700">{project.courseName}</span>
								</TableCell>

								<TableCell>
									<div className="flex flex-col gap-1 text-sm text-zinc-700">
										{project.evaluators?.length ? (
											project.evaluators.map((ev) => (
												<div key={ev.id} className="flex flex-col gap-0.5">
													<span className="font-medium">
														{ev.firstName} {ev.lastName}
													</span>
													<span className="inline-flex w-fit items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs text-zinc-500">
														{ev.evaluatorType[locale as 'es' | 'en'] ?? ev.evaluatorType.es}
													</span>
												</div>
											))
										) : (
											<span className="text-zinc-400">—</span>
										)}
									</div>
								</TableCell>

								<TableCell>
									<div className="flex flex-col gap-0.5 text-sm text-zinc-700">
										{project.students.length ? (
											project.students.map((st) => (
												<div key={st.id} className="flex items-center gap-2">
													<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
													<span>
														{st.firstName} {st.lastName}
													</span>
												</div>
											))
										) : (
											<span className="text-zinc-400">—</span>
										)}
									</div>
								</TableCell>

								<TableCell>
									<span className="text-sm text-zinc-600">
										{formatDate(project.evaluationDate)}
									</span>
								</TableCell>

								<TableCell className="text-center">
									<Link
										href={`/evaluation/grade-projects/${activeTab}/${project.projectId}/evaluate`}
										title={t('projects.grade.table.grade')}
										className={cn(
											'inline-flex items-center justify-center w-8 h-8 rounded-lg',
											'text-zinc-500 transition-colors',
											'hover:bg-blue-50 hover:text-blue-600',
										)}>
										<ClipboardDocumentCheckIcon className="h-4 w-4" />
									</Link>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
