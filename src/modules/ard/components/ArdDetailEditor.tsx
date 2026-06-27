'use client';

import { useMemo, useRef, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import {
	Alert,
	Button,
	Card,
	DataTable,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	I18nTextField,
	PageHeader,
	Select,
} from '@/shared/components/ui';
import { ApiError } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { useI18n } from '@/providers';
import type { I18nText } from '@/shared/types';
import {
	useArdBulkDetails,
	useArdClassRepresentatives,
	useArdCourseProfessorOptions,
	useArdProgramCourses,
} from '../hooks';
import type {
	ArdClassRepresentative,
	ArdInvitedStudent,
	ArdProgramCourse,
	ArdView,
} from '../types';
import { AddInvitedStudentDialog } from './AddInvitedStudentDialog';

type StudentOption = { value: number; label: string };

type StagedDetail = {
	rowId: string;
	enrollmentStudentId: number;
	studentLabel: string;
	courseId: number;
	courseLabel: string;
	professorId: number;
	professorLabel: string;
	comments: I18nText;
};

type ComposerValue = {
	enrollmentStudentId: number | null;
	courseId: number | null;
	professorId: number | null;
	comments: I18nText;
	courseLabel?: string;
	professorLabel?: string;
};

function commentHasText(comments: I18nText): boolean {
	return Object.values(comments).some((value) => value.trim() !== '');
}

type DuplicateDetail = { enrollmentStudentId: number; courseId: number; professorId: number };

function detailKey(detail: { enrollmentStudentId: number; courseId: number; professorId: number }) {
	return `${detail.enrollmentStudentId}:${detail.courseId}:${detail.professorId}`;
}

// The bulk endpoint reports duplicates as `data: [{ code, enrollmentStudentId, courseId, professorId }]`.
function parseDuplicateDetails(error: unknown): DuplicateDetail[] {
	if (!(error instanceof ApiError) || !error.body || typeof error.body !== 'object') return [];
	const data = (error.body as { data?: unknown }).data;
	if (!Array.isArray(data)) return [];
	return data
		.filter(
			(item): item is { code: string } & DuplicateDetail =>
				typeof item === 'object' &&
				item !== null &&
				(item as { code?: unknown }).code === 'error.ard.duplicateDetail' &&
				typeof (item as DuplicateDetail).enrollmentStudentId === 'number' &&
				typeof (item as DuplicateDetail).courseId === 'number' &&
				typeof (item as DuplicateDetail).professorId === 'number',
		)
		.map((item) => ({
			enrollmentStudentId: item.enrollmentStudentId,
			courseId: item.courseId,
			professorId: item.professorId,
		}));
}

export function ArdDetailEditor({
	ard,
	onDone,
	onCancel,
}: {
	ard: ArdView;
	onDone: () => void;
	onCancel: () => void;
}) {
	const { t, locale } = useI18n();
	const localize = (text?: I18nText) => text?.[locale] ?? text?.es ?? text?.en ?? '';

	const bulk = useArdBulkDetails();
	const repsQuery = useArdClassRepresentatives(ard.programId, ard.campusId);
	const programCoursesQuery = useArdProgramCourses(ard.programId);
	const reps = useMemo(() => repsQuery.data ?? [], [repsQuery.data]);
	const programCourses = useMemo(() => programCoursesQuery.data ?? [], [programCoursesQuery.data]);

	const rowSeq = useRef(0);
	const nextRowId = () => {
		rowSeq.current += 1;
		return `row-${rowSeq.current}`;
	};

	const [details, setDetails] = useState<StagedDetail[]>(() =>
		ard.details.map((detail, index) => ({
			rowId: `init-${index}`,
			enrollmentStudentId: detail.enrollmentStudentId as number,
			studentLabel: [detail.studentCode, detail.studentFullName].filter(Boolean).join(' - '),
			courseId: detail.courseId,
			courseLabel: `${detail.courseCode} - ${localize(detail.courseName)}`,
			professorId: detail.professorId,
			professorLabel: `${detail.professorCode} - ${detail.professorFullName}`,
			comments: detail.comments ?? {},
		})),
	);

	const [invited, setInvited] = useState<StudentOption[]>(() =>
		ard.details
			.filter((detail) => detail.enrollmentStudentId !== null)
			.map((detail) => ({
				value: detail.enrollmentStudentId as number,
				label: [detail.studentCode, detail.studentFullName].filter(Boolean).join(' - '),
			})),
	);

	const [composer, setComposer] = useState<ComposerValue | null>(null);
	const [editingRowId, setEditingRowId] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	const studentOptions = useMemo<StudentOption[]>(() => {
		const byId = new Map<number, StudentOption>();
		for (const option of invited) byId.set(option.value, option);
		for (const rep of reps) {
			byId.set(rep.enrollmentStudentId, {
				value: rep.enrollmentStudentId,
				label: `${rep.studentCode} - ${rep.studentFullName} (${rep.sectionCode})`,
			});
		}
		return [...byId.values()];
	}, [invited, reps]);

	const knownStudentIds = useMemo(() => {
		const ids = new Set<number>();
		for (const option of invited) ids.add(option.value);
		for (const rep of reps) ids.add(rep.enrollmentStudentId);
		return [...ids];
	}, [invited, reps]);

	const openAdd = () => {
		setEditingRowId(null);
		setComposer({ enrollmentStudentId: null, courseId: null, professorId: null, comments: {} });
	};

	const handleAddInvited = (student: ArdInvitedStudent) => {
		setInvited((current) =>
			current.some((option) => option.value === student.enrollmentStudentId)
				? current
				: [
						...current,
						{
							value: student.enrollmentStudentId,
							label: `${student.studentCode} - ${student.studentFullName}`,
						},
					],
		);
		setEditingRowId(null);
		setComposer({
			enrollmentStudentId: student.enrollmentStudentId,
			courseId: null,
			professorId: null,
			comments: {},
		});
	};

	const openEdit = (row: StagedDetail) => {
		setEditingRowId(row.rowId);
		setComposer({
			enrollmentStudentId: row.enrollmentStudentId,
			courseId: row.courseId,
			professorId: row.professorId,
			comments: row.comments,
			courseLabel: row.courseLabel,
			professorLabel: row.professorLabel,
		});
	};

	const closeComposer = () => {
		setComposer(null);
		setEditingRowId(null);
	};

	const commitComposer = (staged: Omit<StagedDetail, 'rowId'>) => {
		if (editingRowId !== null) {
			setDetails((current) =>
				current.map((row) =>
					row.rowId === editingRowId ? { ...staged, rowId: editingRowId } : row,
				),
			);
		} else {
			setDetails((current) => [...current, { ...staged, rowId: nextRowId() }]);
		}
		closeComposer();
	};

	const duplicateDetails = useMemo(() => parseDuplicateDetails(bulk.error), [bulk.error]);
	const duplicateKeys = useMemo(
		() => new Set(duplicateDetails.map((detail) => detailKey(detail))),
		[duplicateDetails],
	);

	const columns = useMemo<ColumnDef<StagedDetail>[]>(
		() => [
			{
				id: 'student',
				header: t('ard.table.fullName'),
				cell: ({ row }) =>
					duplicateKeys.has(detailKey(row.original)) ? (
						<span className="flex items-center gap-1 font-medium text-red-600">
							<AlertTriangle className="h-4 w-4" aria-label={t('error.ard.duplicateDetail')} />
							{row.original.studentLabel}
						</span>
					) : (
						row.original.studentLabel
					),
			},
			{ id: 'course', header: t('ard.table.course'), cell: ({ row }) => row.original.courseLabel },
			{
				id: 'professor',
				header: t('ard.table.professor'),
				cell: ({ row }) => row.original.professorLabel,
			},
			{
				id: 'comment',
				header: t('ard.details.comment'),
				cell: ({ row }) => localize(row.original.comments),
			},
			{
				id: 'actions',
				header: t('ard.table.actions'),
				cell: ({ row }) => (
					<div className="flex justify-end gap-2">
						<Button
							variant="surface"
							size="icon"
							title={t('ard.actions.edit')}
							aria-label={t('ard.actions.edit')}
							onClick={() => openEdit(row.original)}>
							<Pencil className="h-4 w-4" />
						</Button>
						<Button
							variant="surface"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							title={t('ard.actions.delete')}
							aria-label={t('ard.actions.delete')}
							onClick={() =>
								setDetails((current) => current.filter((item) => item.rowId !== row.original.rowId))
							}>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				),
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps -- localize depends on locale
		[t, locale, duplicateKeys],
	);

	const canSave = details.length > 0 && composer === null && !bulk.isPending;

	const handleSave = () => {
		if (!canSave) return;
		const payload = details.map((detail) => ({
			enrollmentStudentId: detail.enrollmentStudentId,
			courseId: detail.courseId,
			professorId: detail.professorId,
			...(commentHasText(detail.comments) ? { comments: detail.comments } : {}),
		}));
		bulk.mutate({ ardId: ard.id, details: payload }, { onSuccess: () => onDone() });
	};

	return (
		<div className="space-y-6">
			<PageHeader title={ard.code} description={t('ard.edit.description')} />

			{bulk.isError && (
				<Alert variant="destructive">
					{duplicateDetails.length > 0
						? tryTranslate(t, 'error.ard.duplicateDetail')
						: tryTranslate(
								t,
								bulk.error instanceof Error ? bulk.error.message : 'error.ard.detailsFailed',
							)}
				</Alert>
			)}

			{composer !== null && editingRowId === null ? (
				<Card title={t('ard.edit.addRow')}>
					<DetailComposer
						campusId={ard.campusId}
						reps={reps}
						programCourses={programCourses}
						studentOptions={studentOptions}
						initial={composer}
						isEditing={false}
						onSubmit={commitComposer}
						onCancel={closeComposer}
					/>
				</Card>
			) : (
				<div className="flex flex-wrap gap-2">
					<Button variant="surface" onClick={openAdd}>
						<Plus className="h-4 w-4" />
						{t('ard.edit.addRow')}
					</Button>
					<Button variant="surface" onClick={() => setDialogOpen(true)}>
						<UserPlus className="h-4 w-4" />
						{t('ard.participants.invited.add')}
					</Button>
				</div>
			)}

			<DataTable
				columns={columns}
				data={details}
				showSearch={false}
				emptyMessage={t('ard.edit.empty')}
				aria-label={t('ard.edit.detailsTitle')}
			/>

			<Dialog
				open={composer !== null && editingRowId !== null}
				onOpenChange={(open) => {
					if (!open) closeComposer();
				}}>
				<DialogContent className="sm:max-w-3xl">
					<DialogHeader>
						<DialogTitle>{t('ard.edit.editRow')}</DialogTitle>
					</DialogHeader>
					{composer !== null && editingRowId !== null && (
						<DetailComposer
							campusId={ard.campusId}
							reps={reps}
							programCourses={programCourses}
							studentOptions={studentOptions}
							initial={composer}
							isEditing
							onSubmit={commitComposer}
							onCancel={closeComposer}
						/>
					)}
				</DialogContent>
			</Dialog>

			<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={onCancel}
					className="text-sm font-medium text-zinc-500 hover:text-zinc-700">
					{t('ard.actions.cancel')}
				</button>
				<Button onClick={handleSave} disabled={!canSave} loading={bulk.isPending}>
					{t('ard.actions.save')}
				</Button>
			</div>

			<AddInvitedStudentDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				programId={ard.programId}
				existingEnrollmentStudentIds={knownStudentIds}
				onAdd={handleAddInvited}
			/>
		</div>
	);
}

function DetailComposer({
	campusId,
	reps,
	programCourses,
	studentOptions,
	initial,
	isEditing,
	onSubmit,
	onCancel,
}: {
	campusId: number;
	reps: ArdClassRepresentative[];
	programCourses: ArdProgramCourse[];
	studentOptions: StudentOption[];
	initial: ComposerValue;
	isEditing: boolean;
	onSubmit: (staged: Omit<StagedDetail, 'rowId'>) => void;
	onCancel: () => void;
}) {
	const { t, locale } = useI18n();
	const localize = (text?: I18nText) => text?.[locale] ?? text?.es ?? text?.en ?? '';

	const [enrollmentStudentId, setStudentId] = useState<number | null>(initial.enrollmentStudentId);
	const [courseId, setCourseId] = useState<number | null>(initial.courseId);
	const [professorId, setProfessorId] = useState<number | null>(initial.professorId);
	const [comments, setComments] = useState<I18nText>(initial.comments);

	const professorsQuery = useArdCourseProfessorOptions(courseId, campusId);
	const rep =
		enrollmentStudentId !== null
			? (reps.find((item) => item.enrollmentStudentId === enrollmentStudentId) ?? null)
			: null;

	const courseOptions = useMemo(() => {
		const base = programCourses.map((course) => ({
			value: course.courseId,
			label: `${course.courseCode} - ${localize(course.courseName)}`,
		}));
		let options = base;
		if (rep) {
			const ownCourse = {
				value: rep.courseId,
				label: `${rep.courseCode} (${rep.sectionCode}) - ${localize(rep.courseName)}`,
			};
			options = [ownCourse, ...base.filter((option) => option.value !== rep.courseId)];
		}
		if (courseId !== null && !options.some((option) => option.value === courseId)) {
			options = [{ value: courseId, label: initial.courseLabel ?? String(courseId) }, ...options];
		}
		return options;
		// eslint-disable-next-line react-hooks/exhaustive-deps -- localize depends on locale
	}, [programCourses, rep, courseId, initial.courseLabel, locale]);

	const professorOptions = useMemo(() => {
		const base = (professorsQuery.data ?? []).map((professor) => ({
			value: professor.professorId,
			label: `${professor.professorCode} - ${professor.professorFullName}`,
		}));
		let options = base;
		if (
			rep &&
			courseId === rep.courseId &&
			!base.some((option) => option.value === rep.professorId)
		) {
			options = [
				{ value: rep.professorId, label: `${rep.professorCode} - ${rep.professorFullName}` },
				...base,
			];
		}
		if (professorId !== null && !options.some((option) => option.value === professorId)) {
			options = [
				{ value: professorId, label: initial.professorLabel ?? String(professorId) },
				...options,
			];
		}
		return options;
	}, [professorsQuery.data, rep, courseId, professorId, initial.professorLabel]);

	const selectStudent = (id: number | null) => {
		const nextRep =
			id !== null ? (reps.find((item) => item.enrollmentStudentId === id) ?? null) : null;
		setStudentId(id);
		if (nextRep) {
			setCourseId(nextRep.courseId);
			setProfessorId(nextRep.professorId);
		} else {
			setCourseId(null);
			setProfessorId(null);
		}
	};

	const canAdd = enrollmentStudentId !== null && courseId !== null && professorId !== null;

	const submit = () => {
		if (enrollmentStudentId === null || courseId === null || professorId === null) return;
		onSubmit({
			enrollmentStudentId,
			studentLabel:
				studentOptions.find((option) => option.value === enrollmentStudentId)?.label ?? '',
			courseId,
			courseLabel: courseOptions.find((option) => option.value === courseId)?.label ?? '',
			professorId,
			professorLabel: professorOptions.find((option) => option.value === professorId)?.label ?? '',
			comments,
		});
	};

	return (
		<div className="space-y-4">
			<div className="grid gap-4 lg:grid-cols-3">
				<Select
					label={t('ard.details.student')}
					options={studentOptions}
					value={studentOptions.find((option) => option.value === enrollmentStudentId) ?? null}
					isSearchable
					onChange={(_, option) => {
						const selected = Array.isArray(option) ? option[0] : option;
						selectStudent(selected ? Number(selected.value) : null);
					}}
				/>
				<Select
					label={t('ard.details.course')}
					options={courseOptions}
					value={courseOptions.find((option) => option.value === courseId) ?? null}
					isSearchable
					isDisabled={enrollmentStudentId === null}
					onChange={(_, option) => {
						const selected = Array.isArray(option) ? option[0] : option;
						setCourseId(selected ? Number(selected.value) : null);
						setProfessorId(null);
					}}
				/>
				<Select
					label={t('ard.details.professor')}
					options={professorOptions}
					value={professorOptions.find((option) => option.value === professorId) ?? null}
					isSearchable
					isDisabled={courseId === null}
					onChange={(_, option) => {
						const selected = Array.isArray(option) ? option[0] : option;
						setProfessorId(selected ? Number(selected.value) : null);
					}}
				/>
			</div>
			<I18nTextField
				as="input"
				layout="row"
				label={t('ard.details.comment')}
				value={comments}
				onChange={setComments}
			/>
			<div className="flex justify-end gap-2">
				<Button variant="surface" onClick={onCancel}>
					{t('ard.actions.cancel')}
				</Button>
				<Button onClick={submit} disabled={!canAdd}>
					{isEditing ? t('ard.edit.updateRow') : t('ard.edit.addToList')}
				</Button>
			</div>
		</div>
	);
}
