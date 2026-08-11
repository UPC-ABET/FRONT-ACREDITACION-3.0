'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
	ArrowLeftIcon,
	ExclamationTriangleIcon,
	PencilSquareIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	ConfirmDialog,
	DataTable,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	SubTitle,
	Title,
	Toast,
} from '@/shared';
import { useABET, useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib';
import { localizedText, tryTranslate } from '@/shared/utils';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { useTypesByGroupCode } from '@/modules/core';
import {
	useStudyPlanCourseLevels,
	useStudyPlanCoursesView,
	useStudyPlanCoursesViewMutations,
} from '../hooks';
import type {
	CourseUpdateBody,
	StudyPlanCourseCreate,
	StudyPlanCourseEditBody,
	StudyPlanCourseRow,
} from '../types';
import { StudyPlanCourseCreateDialog, StudyPlanCourseEditDialog } from '@/modules';

function sameI18n(
	a: { es: string; en: string } | undefined,
	b: { es: string; en: string },
): boolean {
	return a == null || (a.es === b.es && a.en === b.en);
}

function hasCourseChanges(body: CourseUpdateBody, row: StudyPlanCourseRow): boolean {
	return (
		(body.code != null && body.code !== row.courseCode) ||
		!sameI18n(body.name, row.courseName) ||
		!sameI18n(body.learningOutcome, row.learningOutcome)
	);
}

export function StudyPlanCoursesView({
	studyPlanId,
	onBack,
}: {
	studyPlanId: number;
	onBack: () => void;
}) {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [editing, setEditing] = useState<StudyPlanCourseRow | null>(null);
	const [editError, setEditError] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<StudyPlanCourseRow | null>(null);
	const [blockedReasons, setBlockedReasons] = useState<string[] | null>(null);

	const { data, isLoading, isError, refetch } = useStudyPlanCoursesView(
		studyPlanId,
		academicPeriodId,
	);
	const { data: levels = [], isLoading: levelsLoading } = useStudyPlanCourseLevels();
	const { data: gradeTypes = [], isLoading: gradeTypesLoading } = useTypesByGroupCode(
		TYPE_GROUP_CODES.GRADE_TYPE,
	);
	const { createCourse, updateCourse, updateGradeType, removeCourseFromPlan } =
		useStudyPlanCoursesViewMutations();

	const sortedLevels = useMemo(
		() => [...(data?.levels ?? [])].sort((a, b) => a.level - b.level),
		[data?.levels],
	);
	const electives = data?.electives ?? [];
	const isEmpty = sortedLevels.length === 0 && electives.length === 0;

	const handleCreate = async (body: StudyPlanCourseCreate) => {
		setCreateError(null);
		try {
			await createCourse.mutateAsync(body);
			showToast('loads.studyPlanCoursesView.toast.created', 'success');
			setCreating(false);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setCreateError(
				tryTranslate(
					t,
					reason ?? getErrorMessage(error, 'loads.studyPlanCoursesView.create.error'),
				),
			);
		}
	};

	// The course fields and the grade type are saved through two different endpoints, so the
	// pair is not atomic: if the second call fails, `saved` (and with it the dialog's `item`)
	// already reflects the first one, so retrying only re-sends what is still pending.
	const handleSaveEdit = async (body: StudyPlanCourseEditBody) => {
		if (!editing) return;
		setEditError(null);
		const { gradeTypeId, ...courseBody } = body;
		let saved = editing;
		try {
			if (hasCourseChanges(courseBody, saved)) {
				await updateCourse.mutateAsync({ courseId: saved.courseId, body: courseBody });
				saved = {
					...saved,
					courseCode: courseBody.code ?? saved.courseCode,
					courseName: courseBody.name ?? saved.courseName,
					learningOutcome: courseBody.learningOutcome ?? saved.learningOutcome,
				};
				setEditing(saved);
			}
			if (gradeTypeId !== saved.gradeTypeId) {
				await updateGradeType.mutateAsync({ id: saved.id, gradeTypeId });
				saved = { ...saved, gradeTypeId };
				setEditing(saved);
			}
			showToast('loads.studyPlanCoursesView.toast.updated', 'success');
			setEditing(null);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setEditError(
				tryTranslate(t, reason ?? getErrorMessage(error, 'loads.studyPlanCoursesView.edit.error')),
			);
		}
	};

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		try {
			await removeCourseFromPlan.mutateAsync(pendingDelete.id);
			showToast('loads.studyPlanCoursesView.toast.deleted', 'success');
			setPendingDelete(null);
		} catch (error) {
			const reasons = getApiErrorReasons(error);
			setPendingDelete(null);
			if (reasons.length > 0) {
				setBlockedReasons(reasons);
			} else {
				showToast(getErrorMessage(error, 'loads.studyPlanCoursesView.delete.error'), 'error');
			}
		}
	};

	const columns = useMemo<ColumnDef<StudyPlanCourseRow>[]>(
		() => [
			{
				accessorKey: 'courseCode',
				header: t('loads.studyPlanCoursesView.col.courseCode'),
				meta: { cellClassName: 'font-mono text-zinc-800' },
			},
			{
				id: 'courseName',
				header: t('loads.studyPlanCoursesView.col.courseName'),
				meta: { cellClassName: 'text-zinc-700' },
				cell: ({ row }) => localizedText(row.original.courseName, locale),
			},
			{
				id: 'learningOutcome',
				header: t('loads.studyPlanCoursesView.col.learningOutcome'),
				cell: ({ row }) => (
					<span className="line-clamp-2 max-w-md text-zinc-500">
						{localizedText(row.original.learningOutcome, locale)}
					</span>
				),
			},
			{
				id: 'actions',
				header: t('loads.studyPlanCoursesView.col.actions'),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							onClick={() => {
								setEditError(null);
								setEditing(row.original);
							}}
							aria-label={t('loads.studyPlanCoursesView.actions.edit')}
							title={t('loads.studyPlanCoursesView.actions.edit')}>
							<PencilSquareIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setPendingDelete(row.original)}
							aria-label={t('loads.studyPlanCoursesView.actions.delete')}
							title={t('loads.studyPlanCoursesView.actions.delete')}>
							<TrashIcon className="h-5 w-5" />
						</Button>
					</div>
				),
			},
		],
		[t, locale],
	);

	const renderCoursesTable = (rows: StudyPlanCourseRow[]) => (
		<DataTable
			columns={columns}
			data={rows}
			showSearch={false}
			showPagination={false}
			aria-label={t('loads.studyPlanCoursesView.title')}
		/>
	);

	return (
		<Card>
			<div className="space-y-5">
				<div className="space-y-3">
					<Button variant="ghost" size="sm" onClick={onBack} className="self-start">
						<ArrowLeftIcon className="h-4 w-4" />
						{t('loads.studyPlanCoursesView.back')}
					</Button>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div className="space-y-1">
							<Title
								title={t('loads.studyPlanCoursesView.title')}
								className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
							/>
							<SubTitle
								name={t('loads.studyPlanCoursesView.subtitle')}
								className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
							/>
						</div>
						<Button
							variant="primary"
							size="sm"
							className="w-full sm:w-auto"
							disabled={academicPeriodId == null}
							onClick={() => {
								setCreateError(null);
								setCreating(true);
							}}>
							<PlusIcon className="h-4 w-4" />
							<span>{t('loads.studyPlanCoursesView.actions.new')}</span>
						</Button>
					</div>
				</div>

				{academicPeriodId == null ? (
					<div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
						<p className="text-sm text-zinc-500">{t('loads.studyPlanCoursesView.selectPeriod')}</p>
					</div>
				) : isError ? (
					<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
						<p className="text-sm text-zinc-500">
							{t('loads.studyPlanCoursesView.error.loadFailed')}
						</p>
						<Button variant="surface" size="sm" onClick={() => refetch()}>
							{t('loads.studyPlanCoursesView.retry')}
						</Button>
					</div>
				) : isLoading ? (
					<div className="space-y-2" aria-busy>
						{Array.from({ length: 6 }).map((_, index) => (
							<div key={index} className="h-12 animate-pulse rounded-lg bg-zinc-100" />
						))}
					</div>
				) : isEmpty ? (
					<div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
						<p className="text-sm font-medium text-zinc-700">
							{t('loads.studyPlanCoursesView.empty.title')}
						</p>
						<p className="text-sm text-zinc-500">
							{t('loads.studyPlanCoursesView.empty.subtitle')}
						</p>
					</div>
				) : (
					<div className="space-y-8">
						{sortedLevels.map((group) => (
							<section key={group.levelTypeId} className="space-y-3">
								<Title
									title={localizedText(group.levelName, locale)}
									className="[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-zinc-700"
								/>
								{renderCoursesTable(group.courses)}
							</section>
						))}
						{electives.length > 0 && (
							<section className="space-y-3">
								<Title
									title={t('loads.studyPlanCoursesView.electives')}
									className="[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-zinc-700"
								/>
								{renderCoursesTable(electives)}
							</section>
						)}
					</div>
				)}
			</div>

			{creating && (
				<StudyPlanCourseCreateDialog
					studyPlanId={studyPlanId}
					levels={levels}
					levelsLoading={levelsLoading}
					saving={createCourse.isPending}
					errorMessage={createError}
					onClose={() => setCreating(false)}
					onCreate={handleCreate}
				/>
			)}

			{editing && (
				<StudyPlanCourseEditDialog
					item={editing}
					gradeTypes={gradeTypes}
					gradeTypesLoading={gradeTypesLoading}
					saving={updateCourse.isPending || updateGradeType.isPending}
					errorMessage={editError}
					onClose={() => setEditing(null)}
					onSave={handleSaveEdit}
				/>
			)}

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('loads.studyPlanCoursesView.delete.title')}
				message={t('loads.studyPlanCoursesView.delete.message')}
				confirmLabel={t('loads.studyPlanCoursesView.actions.delete')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirmDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={removeCourseFromPlan.isPending}
			/>

			<Dialog
				open={blockedReasons != null}
				onOpenChange={(open) => {
					if (!open) setBlockedReasons(null);
				}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<div className="flex items-center gap-2 text-red-700">
							<ExclamationTriangleIcon className="h-5 w-5" />
							<DialogTitle>{t('loads.studyPlanCoursesView.delete.blockedTitle')}</DialogTitle>
						</div>
						<DialogDescription>
							{t('loads.studyPlanCoursesView.delete.blockedSubtitle')}
						</DialogDescription>
					</DialogHeader>
					<ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
						{(blockedReasons ?? []).map((reason) => (
							<li key={reason}>{tryTranslate(t, reason)}</li>
						))}
					</ul>
					<DialogFooter showCloseButton />
				</DialogContent>
			</Dialog>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</Card>
	);
}
