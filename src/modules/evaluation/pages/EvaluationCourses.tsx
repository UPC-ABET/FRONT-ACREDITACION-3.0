'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Table,
	TableBody,
	TableCell,
	TableEmptyState,
	TableErrorState,
	TableHead,
	TableHeader,
	TableRow,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
} from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { getSchoolCookie } from '@/shared/lib/authCookies';
import {
	useAcademicPeriods,
	useStudyPlanCourses,
	useUpdateStudyPlanCourse,
} from '@/modules/academic/hooks';
import { AcademicPeriodSelect } from '@/modules/academic/components';
import { AddEvaluationCourseModal } from '../components/evaluation-courses/AddEvaluationCourseModal';
import { StudyPlanCourseResponse } from '@/modules/academic';

export function EvaluationCoursesPage() {
	const { t, locale } = useI18n();
	const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState<StudyPlanCourseResponse | null>(null);

	const schoolId = getSchoolCookie()?.id as number | undefined;

	const { data: periods = [] } = useAcademicPeriods({ isActive: true });
	const selectedPeriodCode = periods.find((p) => p.id === selectedPeriodId)?.code ?? '';

	const {
		data: courses = [],
		isLoading: loadingCourses,
		isError,
		error,
		refetch,
	} = useStudyPlanCourses(
		{
			academicPeriodId: selectedPeriodId ?? 0,
			schoolId: schoolId,
			extra: { isEvaluateRubric: true },
			isActive: true,
		},
		{ enabled: !!selectedPeriodId && !!schoolId },
	);

	const updateSpc = useUpdateStudyPlanCourse();

	const handleRemove = (spc: StudyPlanCourseResponse) => {
		const { isEvaluateRubric: _, ...rest } = (spc.extra ?? {}) as Record<string, unknown>;
		updateSpc.mutate(
			{ id: spc.id, body: { extra: rest } },
			{ onSuccess: () => setConfirmTarget(null), onError: () => setConfirmTarget(null) },
		);
	};

	const courseName = (spc: StudyPlanCourseResponse) =>
		typeof spc.course?.name === 'string'
			? spc.course.name
			: (spc.course?.name?.[locale] ?? String(spc.courseId));

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-zinc-900">{t('evaluationCourses.list.title')}</h1>
					<p className="mt-2 text-zinc-600">{t('evaluationCourses.list.description')}</p>
				</div>
				<Button variant="primary" className="shrink-0" onClick={() => setModalOpen(true)}>
					<PlusIcon className="mr-1.5 h-4 w-4" />
					{t('evaluationCourses.list.addButton')}
				</Button>
			</div>

			<div className="max-w-xs">
				<AcademicPeriodSelect value={selectedPeriodId} onChange={setSelectedPeriodId} />
			</div>

			{!selectedPeriodId ? (
				<TableEmptyState message={t('evaluationCourses.list.selectPeriodFirst')} />
			) : loadingCourses ? (
				<div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
					{t('evaluationCourses.list.loading')}
				</div>
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
								<Button variant="secondary" disabled={updateSpc.isPending}>
									{t('dialog.close')}
								</Button>
							}
						/>
						<Button
							variant="primary"
							className="bg-red-600 hover:bg-red-700"
							disabled={updateSpc.isPending}
							onClick={() => confirmTarget && handleRemove(confirmTarget)}>
							{updateSpc.isPending
								? t('evaluationCourses.confirm.removing')
								: t('evaluationCourses.confirm.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
