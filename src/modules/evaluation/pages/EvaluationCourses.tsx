'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	PageHeader,
	Select,
	Table,
	TableBody,
	TableCell,
	TableEmptyState,
	TableErrorState,
	TableHead,
	TableHeader,
	TableLoadingState,
	TableRow,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
} from '@/shared/components/ui';
import { useI18n, useABET } from '@/providers';
import {
	useAcademicPeriods,
	useStudyPlanCourses,
	useEnableEvaluationCourse,
	usePrograms,
} from '@/modules/academic/hooks';
import { AddEvaluationCourseModal } from '../components/evaluation-courses/AddEvaluationCourseModal';
import { StudyPlanCourseResponse } from '@/modules/academic';

type AnyOption = { label: string; value: string | number };

export function EvaluationCoursesPage() {
	const { t, locale } = useI18n();
	const { academicPeriodId: selectedPeriodId, schoolId, modalityTypeId } = useABET();
	const [modalOpen, setModalOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<StudyPlanCourseResponse | null>(null);
	const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
	const [selectedProgramOpt, setSelectedProgramOpt] = useState<AnyOption | null>(null);

	useEffect(() => {
		setSelectedProgramId(null);
		setSelectedProgramOpt(null);
	}, [schoolId, selectedPeriodId, modalityTypeId]);

	const { data: periods = [] } = useAcademicPeriods({ isActive: true });
	const selectedPeriodCode = periods.find((p) => p.id === selectedPeriodId)?.code ?? '';

	const { data: programs = [], isLoading: loadingPrograms } = usePrograms(
		{ isActive: true, schoolFilter: true, modalityTypeId: modalityTypeId ?? undefined },
		{ enabled: !!selectedPeriodId && !!schoolId },
	);

	const programOptions: AnyOption[] = useMemo(
		() => programs.map((p) => ({ label: p.name[locale as 'es' | 'en'] ?? p.name.es, value: p.id })),
		[programs, locale],
	);

	const {
		data: courses = [],
		isLoading: loadingCourses,
		isError,
		error,
		refetch,
	} = useStudyPlanCourses(
		{
			programId: selectedProgramId ?? undefined,
			// NOTE: Backend field is "is_evaluable" (snake_case), do NOT convert to camelCase
			extra: { is_evaluable: true },
			isActive: true,
		},
		{ enabled: !!selectedPeriodId && !!selectedProgramId },
	);

	const enableEvaluation = useEnableEvaluationCourse();

	const handleRemove = (spc: StudyPlanCourseResponse) => {
		enableEvaluation.mutate(
			{ id: spc.id, isEvaluable: false },
			{ onSuccess: () => setConfirmTarget(null), onError: () => setConfirmTarget(null) },
		);
	};

	const courseName = (spc: StudyPlanCourseResponse) =>
		typeof spc.course?.name === 'string'
			? spc.course.name
			: (spc.course?.name?.[locale] ?? String(spc.courseId));

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('evaluationCourses.list.title')}
				description={t('evaluationCourses.list.description')}
				action={
					<Button variant="primary" className="shrink-0" onClick={() => setModalOpen(true)}>
						<PlusIcon className="mr-1.5 h-4 w-4" />
						{t('evaluationCourses.list.addButton')}
					</Button>
				}
			/>

			<Card>
				<div className="max-w-xs">
					<Select
						label={t('evaluationCourses.list.programLabel')}
						placeholder={
							loadingPrograms
								? t('evaluationCourses.list.programLoading')
								: programs.length === 0
									? t('evaluationCourses.list.programNoOptions')
									: t('evaluationCourses.list.programPlaceholder')
						}
						options={programOptions}
						value={selectedProgramOpt}
						isDisabled={loadingPrograms || programs.length === 0}
						isSearchable
						onChange={(_, v) => {
							const opt = Array.isArray(v) ? (v[0] ?? null) : v;
							setSelectedProgramOpt(opt as AnyOption | null);
							setSelectedProgramId(opt ? Number(opt.value) : null);
						}}
					/>
				</div>
			</Card>

			{!selectedProgramId ? (
				<TableEmptyState message={t('evaluationCourses.list.selectProgramFirst')} />
			) : loadingCourses ? (
				<TableLoadingState label={t('evaluationCourses.list.loading')} />
			) : isError ? (
				<TableErrorState
					message={error instanceof Error ? error.message : t('evaluationCourses.list.error')}
				/>
			) : courses.length === 0 ? (
				<TableEmptyState message={t('evaluationCourses.list.empty')} />
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t('evaluationCourses.list.columns.course')}</TableHead>
							<TableHead>{t('evaluationCourses.list.columns.period')}</TableHead>
							<TableHead className="w-20 text-center">
								{t('evaluationCourses.list.columns.actions')}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{courses.map((spc) => (
							<TableRow key={spc.id}>
								<TableCell>
									<span className="font-medium text-zinc-900">{courseName(spc)}</span>
								</TableCell>
								<TableCell>
									<span className="text-zinc-600">{selectedPeriodCode}</span>
								</TableCell>
								<TableCell>
									<div className="flex justify-center">
										<button
											type="button"
											onClick={() => setConfirmTarget(spc)}
											title={t('evaluationCourses.list.removeButton')}
											className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600">
											<TrashIcon className="h-4 w-4" />
										</button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<AddEvaluationCourseModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				onSuccess={() => void refetch()}
			/>

			<Dialog
				open={!!confirmTarget}
				onOpenChange={(open) => {
					if (!open) setConfirmTarget(null);
				}}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>{t('evaluationCourses.confirm.title')}</DialogTitle>
					</DialogHeader>

					<p className="text-sm text-zinc-600">
						{t('evaluationCourses.confirm.body').replace(
							'{{course}}',
							confirmTarget ? courseName(confirmTarget) : '',
						)}
					</p>

					<DialogFooter>
						<DialogClose
							render={
								<Button variant="secondary" disabled={enableEvaluation.isPending}>
									{t('dialog.close')}
								</Button>
							}
						/>
						<Button
							variant="primary"
							className="bg-red-600 hover:bg-red-700"
							disabled={enableEvaluation.isPending}
							onClick={() => confirmTarget && handleRemove(confirmTarget)}>
							{enableEvaluation.isPending
								? t('evaluationCourses.confirm.removing')
								: t('evaluationCourses.confirm.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
