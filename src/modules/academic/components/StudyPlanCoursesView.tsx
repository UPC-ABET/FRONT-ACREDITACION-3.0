'use client';

import { useMemo, useState } from 'react';
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	SubTitle,
	Title,
	Toast,
} from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib/apiError';
import { tryTranslate } from '@/shared/utils';
import {
	useStudyPlanCourseLevels,
	useStudyPlanCoursesView,
	useStudyPlanCoursesViewMutations,
} from '../hooks';
import type { CourseUpdateBody, StudyPlanCourseCreate, StudyPlanCourseRow } from '../types';
import { StudyPlanCourseCreateDialog } from './StudyPlanCourseCreateDialog';
import { StudyPlanCourseEditDialog } from './StudyPlanCourseEditDialog';

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

function CourseRows({
	rows,
	locale,
	editLabel,
	deleteLabel,
	onEdit,
	onDelete,
}: {
	rows: StudyPlanCourseRow[];
	locale: string;
	editLabel: string;
	deleteLabel: string;
	onEdit: (row: StudyPlanCourseRow) => void;
	onDelete: (row: StudyPlanCourseRow) => void;
}) {
	return (
		<>
			{rows.map((row) => (
				<TableRow key={row.id}>
					<TableCell className="font-mono text-zinc-800">{row.courseCode}</TableCell>
					<TableCell className="text-zinc-700">{localized(row.courseName, locale)}</TableCell>
					<TableCell>
						<span className="line-clamp-2 max-w-md text-sm text-zinc-500">
							{localized(row.learningOutcome, locale)}
						</span>
					</TableCell>
					<TableCell>
						<div className="flex items-center justify-end gap-1">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onEdit(row)}
								aria-label={editLabel}
								title={editLabel}>
								<PencilSquareIcon className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="text-red-600 hover:bg-red-50"
								onClick={() => onDelete(row)}
								aria-label={deleteLabel}
								title={deleteLabel}>
								<TrashIcon className="h-4 w-4" />
							</Button>
						</div>
					</TableCell>
				</TableRow>
			))}
		</>
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
	const { createCourse, updateCourse, removeCourseFromPlan } = useStudyPlanCoursesViewMutations();

	const sortedLevels = useMemo(
		() => [...(data?.levels ?? [])].sort((a, b) => a.level - b.level),
		[data?.levels],
	);
	const electives = data?.electives ?? [];
	const isEmpty = sortedLevels.length === 0 && electives.length === 0;

	const editLabel = t('loads.studyPlanCoursesView.actions.edit');
	const deleteLabel = t('loads.studyPlanCoursesView.actions.delete');

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

	const handleSaveEdit = async (body: CourseUpdateBody) => {
		if (!editing) return;
		setEditError(null);
		try {
			await updateCourse.mutateAsync({ courseId: editing.courseId, body });
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

	const renderCoursesTable = (rows: StudyPlanCourseRow[]) => (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t('loads.studyPlanCoursesView.col.courseCode')}</TableHead>
						<TableHead>{t('loads.studyPlanCoursesView.col.courseName')}</TableHead>
						<TableHead>{t('loads.studyPlanCoursesView.col.learningOutcome')}</TableHead>
						<TableHead className="text-right">
							{t('loads.studyPlanCoursesView.col.actions')}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<CourseRows
						rows={rows}
						locale={locale}
						editLabel={editLabel}
						deleteLabel={deleteLabel}
						onEdit={(row) => {
							setEditError(null);
							setEditing(row);
						}}
						onDelete={(row) => setPendingDelete(row)}
					/>
				</TableBody>
			</Table>
		</div>
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
									title={localized(group.levelName, locale)}
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
					saving={updateCourse.isPending}
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
