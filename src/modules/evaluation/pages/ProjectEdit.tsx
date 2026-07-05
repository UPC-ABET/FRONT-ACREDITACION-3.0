'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	Input,
	PageHeader,
	Select,
	TableEmptyState,
	TableErrorState,
	TableLoadingState,
	TextArea,
	Title,
	Toast,
	buttonVariants,
} from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import {
	useProjectDetails,
	useProjectGroups,
	useUpdateProject,
	useRemoveProjectStudent,
	useRemoveProjectEvaluator,
} from '../hooks';
import { AddEvaluatorModal, AddStudentModal } from '@/modules';

interface ProjectEditPageProps {
	projectId: string;
}

export function ProjectEditPage({ projectId }: ProjectEditPageProps) {
	const { t, locale } = useI18n();

	const [, setStudentError] = useState<string | null>(null);
	const [, setEvaluatorError] = useState<string | null>(null);
	const [evaluatorModalOpen, setEvaluatorModalOpen] = useState(false);
	const [studentModalOpen, setStudentModalOpen] = useState(false);

	const [isEditingHeader, setIsEditingHeader] = useState(false);
	const [draftCode, setDraftCode] = useState('');
	const [draftName, setDraftName] = useState('');
	const [draftDesc, setDraftDesc] = useState('');
	const [draftGroupId, setDraftGroupId] = useState<number | undefined>(undefined);

	const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

	const showToast = (type: 'success' | 'error', message: string) => {
		setToast({ type, message });
	};

	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => setToast(null), 4000);
		return () => clearTimeout(timer);
	}, [toast]);

	const { data, isLoading, isError, error } = useProjectDetails(projectId, {
		isEvaluationMode: false,
	});

	const updateMutation = useUpdateProject(projectId);
	const removeStudentMutation = useRemoveProjectStudent(projectId);
	const removeEvaluatorMutation = useRemoveProjectEvaluator(projectId);

	const projectPeriodId = data?.academicPeriod?.id;
	const { data: projectGroups = [] } = useProjectGroups(
		{ academicPeriodId: projectPeriodId, isActive: true },
		{ enabled: isEditingHeader && projectPeriodId != null },
	);

	const groupOptions = useMemo(
		() =>
			projectGroups.map((g) => ({
				label: `${g.code} — ${g.name[locale as 'es' | 'en'] ?? g.name.es}`,
				value: g.id,
			})),
		[projectGroups, locale],
	);
	const selectedGroupOption = groupOptions.find((o) => o.value === draftGroupId) ?? null;

	const existingEvaluatorTypeCounts = useMemo(() => {
		const counts = new Map<number, number>();
		for (const e of data?.evaluators ?? []) {
			counts.set(e.evaluatorTypeId, (counts.get(e.evaluatorTypeId) ?? 0) + 1);
		}
		return counts;
	}, [data?.evaluators]);

	const enterEditMode = () => {
		if (!data) return;
		const loc = locale as 'es' | 'en';
		setDraftCode(data.project.code);
		setDraftName(data.project.name[loc] ?? data.project.name.es);
		setDraftDesc(data.project.description?.[loc] ?? data.project.description?.es ?? '');
		setDraftGroupId(data.project.projectGroup?.id);
		setIsEditingHeader(true);
	};

	const handleSaveHeader = () => {
		if (!data) return;
		const loc = locale as 'es' | 'en';
		const other = loc === 'es' ? 'en' : 'es';
		const body: Parameters<typeof updateMutation.mutate>[0] = {};

		if (draftCode.trim() !== data.project.code) {
			body.code = draftCode.trim();
		}
		if (draftName.trim() !== (data.project.name[loc] ?? data.project.name.es)) {
			body.name = { [loc]: draftName.trim(), [other]: data.project.name[other] } as {
				es: string;
				en: string;
			};
		}
		if (
			draftDesc.trim() !== (data.project.description?.[loc] ?? data.project.description?.es ?? '')
		) {
			body.description = {
				[loc]: draftDesc.trim(),
				[other]: data.project.description?.[other] ?? '',
			} as { es: string; en: string };
		}
		if (draftGroupId != null && draftGroupId !== data.project.projectGroup?.id) {
			body.projectGroupId = draftGroupId;
		}

		updateMutation.mutate(body, {
			onSuccess: () => {
				setIsEditingHeader(false);
				showToast('success', t('projects.edit.header.saveSuccess'));
			},
			onError: () => showToast('error', t('projects.edit.header.saveError')),
		});
	};

	if (isLoading) {
		return <TableLoadingState />;
	}

	if (isError || !data) {
		return (
			<div className="space-y-4">
				<Link
					href="/academic-projects/projects"
					className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800">
					<ArrowLeftIcon className="h-4 w-4" />
					{t('projects.edit.backButton')}
				</Link>
				<TableErrorState
					message={isError && error instanceof Error ? error.message : t('projects.edit.error')}
				/>
			</div>
		);
	}

	const { project, students, evaluators, course } = data;

	const projectName = project.name[locale as 'es' | 'en'] ?? project.name.es;
	const courseName = course?.name[locale as 'es' | 'en'] ?? course?.name.es ?? '—';

	return (
		<div className="space-y-6">
			<Link
				href="/academic-projects/projects"
				className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800">
				<ArrowLeftIcon className="h-4 w-4" />
				{t('projects.edit.backButton')}
			</Link>

			{isEditingHeader ? (
				<Card>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-3">
							<div className="flex flex-col gap-1">
								<label className="text-xs font-medium text-zinc-500">
									{t('projects.edit.header.fieldCode')}
								</label>
								<Input
									value={draftCode}
									onChange={(e) => setDraftCode(e.target.value)}
									disabled={updateMutation.isPending}
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label className="text-xs font-medium text-zinc-500">
									{t('projects.edit.header.fieldName')}
								</label>
								<Input
									value={draftName}
									onChange={(e) => setDraftName(e.target.value)}
									disabled={updateMutation.isPending}
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label className="text-xs font-medium text-zinc-500">
									{t('projects.edit.header.fieldDesc')}
								</label>
								<TextArea
									value={draftDesc}
									onChange={(e) => setDraftDesc(e.target.value)}
									disabled={updateMutation.isPending}
									rows={3}
								/>
							</div>
							<div className="flex flex-col gap-1">
								<Select
									label={t('projects.edit.header.fieldGroup')}
									placeholder={t('projects.edit.header.fieldGroupPlaceholder')}
									options={groupOptions}
									value={selectedGroupOption}
									isSearchable
									isClearable
									isDisabled={updateMutation.isPending}
									onChange={(_, opt) => {
										const single = Array.isArray(opt) ? (opt[0] ?? null) : opt;
										setDraftGroupId(single ? Number(single.value) : undefined);
									}}
								/>
							</div>
						</div>

						<div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4">
							<Button
								variant="secondary"
								size="sm"
								onClick={() => setIsEditingHeader(false)}
								disabled={updateMutation.isPending}>
								{t('projects.edit.header.cancelButton')}
							</Button>
							<Button
								variant="primary"
								size="sm"
								onClick={handleSaveHeader}
								loading={updateMutation.isPending}
								disabled={updateMutation.isPending}>
								{t('projects.edit.header.saveButton')}
							</Button>
						</div>
					</div>
				</Card>
			) : (
				<>
					<PageHeader
						title={projectName}
						description={t('projects.edit.subtitle')}
						action={
							<Button
								variant="secondary"
								size="sm"
								className="bg-transparent border border-zinc-200 hover:bg-zinc-100"
								onClick={enterEditMode}>
								<PencilIcon className="h-4 w-4" />
								{t('projects.edit.header.editButton')}
							</Button>
						}
					/>
					<Card>
						<div className="flex flex-col gap-4">
							<span className="inline-flex w-fit items-center rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-mono text-xs font-medium text-zinc-600">
								{project.code}
							</span>

							<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-600">
								<div className="flex items-center gap-1.5">
									<span className="font-medium text-zinc-400">
										{t('projects.edit.header.course')}
									</span>
									<span>{courseName}</span>
								</div>
								<div className="flex items-center gap-1.5">
									<span className="font-medium text-zinc-400">
										{t('projects.edit.header.group')}
									</span>
									{project.projectGroup ? (
										<span>
											{project.projectGroup.code} —{' '}
											{project.projectGroup.name[locale as 'es' | 'en'] ??
												project.projectGroup.name.es}
										</span>
									) : (
										<span className="text-zinc-400">{t('projects.list.table.noGroup')}</span>
									)}
								</div>
							</div>

							{(() => {
								const desc =
									project.description?.[locale as 'es' | 'en'] ?? project.description?.es;
								return desc ? (
									<div className="flex items-start gap-1.5 text-sm text-zinc-600">
										<span className="font-medium text-zinc-400 shrink-0">
											{t('projects.edit.header.fieldDesc')}
										</span>
										<span className="text-zinc-500 leading-relaxed">{desc}</span>
									</div>
								) : null;
							})()}
						</div>
					</Card>
				</>
			)}

			<Card>
				<div className="-m-4">
					<div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
						<div className="flex items-center gap-3">
							<Title
								title={t('projects.edit.students.title')}
								className="[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900"
							/>
							<span className="text-xs text-zinc-400">{students.length}</span>
						</div>
						<Button variant="primary" size="sm" onClick={() => setStudentModalOpen(true)}>
							<PlusIcon className="h-4 w-4" />
							{t('projects.edit.students.addButton')}
						</Button>
					</div>

					<div className="divide-y divide-zinc-100">
						{students.length === 0 ? (
							<TableEmptyState message={t('projects.edit.students.empty')} />
						) : (
							students.map((student) => (
								<div key={student.id} className="flex items-center justify-between gap-4 px-6 py-4">
									<div className="flex flex-col gap-0.5">
										<span className="font-medium text-zinc-900">
											{student.firstName} {student.lastName}
										</span>
										<div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
											<span className="font-mono">{student.studentCode}</span>
											<span className="text-zinc-300">·</span>
											<span>{student.email}</span>
										</div>
									</div>

									<button
										type="button"
										onClick={() =>
											removeStudentMutation.mutate(student.id, {
												onSuccess: () => {
													setStudentError(null);
													showToast('success', t('projects.edit.students.removeSuccess'));
												},
												onError: () => {
													setStudentError(t('projects.edit.students.removeError'));
													showToast('error', t('projects.edit.students.removeError'));
												},
											})
										}
										disabled={removeStudentMutation.isPending}
										className={cn(
											buttonVariants({ variant: 'ghost', size: 'icon' }),
											'text-zinc-400 hover:bg-red-50 hover:text-red-600',
										)}
										title={t('projects.edit.students.removeButton')}>
										<XMarkIcon className="h-4 w-4" />
									</button>
								</div>
							))
						)}
					</div>
				</div>
			</Card>

			<Card>
				<div className="-m-4">
					<div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
						<div className="flex items-center gap-3">
							<Title
								title={t('projects.edit.evaluators.title')}
								className="[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900"
							/>
							<span className="text-xs text-zinc-400">{evaluators?.length ?? 0}</span>
						</div>
						<Button variant="primary" size="sm" onClick={() => setEvaluatorModalOpen(true)}>
							<PlusIcon className="h-4 w-4" />
							{t('projects.edit.evaluators.addButton')}
						</Button>
					</div>

					<div className="divide-y divide-zinc-100">
						{!evaluators?.length ? (
							<TableEmptyState message={t('projects.edit.evaluators.empty')} />
						) : (
							evaluators.map((evaluator) => (
								<div
									key={evaluator.id}
									className="flex items-center justify-between gap-4 px-6 py-4">
									<div className="flex flex-col gap-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-medium text-zinc-900">
												{evaluator.professorFirstName} {evaluator.professorLastName}
											</span>
											<span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
												{evaluator.evaluatorTypeName?.[locale as 'es' | 'en'] ??
													evaluator.evaluatorTypeName?.es}
											</span>
										</div>
										<span className="text-xs text-zinc-500">{evaluator.professorEmail}</span>
									</div>

									<button
										type="button"
										onClick={() =>
											removeEvaluatorMutation.mutate(evaluator.id, {
												onSuccess: () => {
													setEvaluatorError(null);
													showToast('success', t('projects.edit.evaluators.removeSuccess'));
												},
												onError: () => {
													setEvaluatorError(t('projects.edit.evaluators.removeError'));
													showToast('error', t('projects.edit.evaluators.removeError'));
												},
											})
										}
										disabled={removeEvaluatorMutation.isPending}
										className={cn(
											buttonVariants({ variant: 'ghost', size: 'icon' }),
											'text-zinc-400 hover:bg-red-50 hover:text-red-600',
										)}
										title={t('projects.edit.evaluators.removeButton')}>
										<XMarkIcon className="h-4 w-4" />
									</button>
								</div>
							))
						)}
					</div>
				</div>
			</Card>

			<AddStudentModal
				open={studentModalOpen}
				onOpenChange={setStudentModalOpen}
				projectId={projectId}
				projectNumericId={project.id}
				courseId={course?.id ?? null}
				onSuccess={() => showToast('success', t('projects.edit.students.modal.successMessage'))}
			/>

			<AddEvaluatorModal
				open={evaluatorModalOpen}
				onOpenChange={setEvaluatorModalOpen}
				projectId={projectId}
				projectNumericId={project.id}
				existingEvaluatorTypeCounts={existingEvaluatorTypeCounts}
				onSuccess={() => showToast('success', t('projects.edit.evaluators.modal.successMessage'))}
			/>

			<Toast
				isOpen={!!toast}
				type={toast?.type}
				message={toast?.message}
				onClose={() => setToast(null)}
			/>
		</div>
	);
}
