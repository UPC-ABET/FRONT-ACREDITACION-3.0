'use client';

import { useMemo, useState } from 'react';
import {
	ArrowDownTrayIcon,
	ArrowLeftIcon,
	CheckIcon,
	CubeIcon,
	InformationCircleIcon,
	MinusIcon,
	PencilSquareIcon,
	PlusIcon,
	XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, SubTitle, Title, Toast } from '@/shared';
import { TYPE_CODES } from '@/shared';
import { useApiErrorToast } from '@/shared';
import { getApiErrorReasons } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { useI18n } from '@/providers';
import {
	useCourseOutcomeMappingBulkSave,
	useCourseOutcomeMappingExport,
	useCourseOutcomeMappingView,
} from '../hooks';
import type {
	CourseOutcomeMappingColumn,
	CourseOutcomeMappingCourse,
	CourseOutcomeMappingOutcomeType,
	CourseOutcomeMappingView,
} from '../types';
import { CourseOutcomeMappingGlyph } from '@/modules';

interface CourseOutcomeMappingGridProps {
	programCommissionId: number;
	onBack: () => void;
}

type CourseMarks = Record<number, number>;
type MappingEditState = Record<number, CourseMarks>;

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

function buildInitialState(view: CourseOutcomeMappingView): MappingEditState {
	const state: MappingEditState = {};
	const apply = (course: CourseOutcomeMappingCourse) => {
		const marks: CourseMarks = {};
		for (const mark of course.mappings) marks[mark.outcomeId] = mark.outcomeTypeId;
		state[course.studyPlanCourseId] = marks;
	};
	view.levels.forEach((level) => level.courses.forEach(apply));
	view.electives.forEach(apply);
	return state;
}

function CollapsibleSection({
	title,
	icon,
	defaultOpen = true,
	headerRight,
	children,
}: {
	title: string;
	icon: React.ReactNode;
	defaultOpen?: boolean;
	headerRight?: React.ReactNode;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
			<div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
				<button
					type="button"
					onClick={() => setOpen((current) => !current)}
					className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-zinc-800">
					<span className="text-zinc-500">{icon}</span>
					<span>{title}</span>
				</button>
				<div className="flex items-center gap-2">
					{headerRight}
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setOpen((current) => !current)}
						aria-label={title}>
						{open ? <MinusIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
					</Button>
				</div>
			</div>
			{open && children}
		</div>
	);
}

export function CourseOutcomeMappingGrid({
	programCommissionId,
	onBack,
}: CourseOutcomeMappingGridProps) {
	const { t, locale } = useI18n();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const {
		data: view,
		isLoading,
		isError,
		refetch,
	} = useCourseOutcomeMappingView(programCommissionId);
	const bulkSave = useCourseOutcomeMappingBulkSave();
	const exportPdf = useCourseOutcomeMappingExport();

	const [editMode, setEditMode] = useState(false);
	const [editState, setEditState] = useState<MappingEditState>({});
	const [saveErrors, setSaveErrors] = useState<string[]>([]);
	const [syncedView, setSyncedView] = useState<CourseOutcomeMappingView | undefined>(undefined);

	if (view !== syncedView) {
		setSyncedView(view);
		setEditState(view ? buildInitialState(view) : {});
		setEditMode(false);
		setSaveErrors([]);
	}

	const typeById = useMemo(() => {
		const map = new Map<number, CourseOutcomeMappingOutcomeType>();
		(view?.outcomeTypes ?? []).forEach((type) => map.set(type.id, type));
		return map;
	}, [view]);

	const typeByCode = useMemo(() => {
		const map = new Map<string, CourseOutcomeMappingOutcomeType>();
		(view?.outcomeTypes ?? []).forEach((type) => map.set(type.code, type));
		return map;
	}, [view]);

	const controlType = typeByCode.get(TYPE_CODES.OUTCOME_TYPE.CONTROL);
	const verificationType = typeByCode.get(TYPE_CODES.OUTCOME_TYPE.VERIFICATION);
	const formationType = typeByCode.get(TYPE_CODES.OUTCOME_TYPE.FORMATION);
	const canEdit = Boolean(controlType && verificationType);

	const allCourses = useMemo(() => {
		if (!view) return [] as CourseOutcomeMappingCourse[];
		return [...view.levels.flatMap((level) => level.courses), ...view.electives];
	}, [view]);

	const cycleCell = (courseId: number, outcomeId: number) => {
		if (!editMode || !controlType || !verificationType) return;
		setEditState((previous) => {
			const courseMarks: CourseMarks = { ...(previous[courseId] ?? {}) };
			const current = courseMarks[outcomeId];
			if (current == null) courseMarks[outcomeId] = controlType.id;
			else if (current === controlType.id) courseMarks[outcomeId] = verificationType.id;
			else delete courseMarks[outcomeId];
			return { ...previous, [courseId]: courseMarks };
		});
	};

	const handleExport = () => {
		exportPdf.mutate(programCommissionId, {
			onError: () => showToast('loads.courseOutcomeMappingMaintenance.error.exportFailed', 'error'),
		});
	};

	const handleCancel = () => {
		if (view) setEditState(buildInitialState(view));
		setSaveErrors([]);
		setEditMode(false);
	};

	const handleSave = () => {
		setSaveErrors([]);
		const courses = allCourses.map((course) => ({
			studyPlanCourseId: course.studyPlanCourseId,
			outcomes: Object.entries(editState[course.studyPlanCourseId] ?? {}).map(
				([outcomeId, outcomeTypeId]) => ({
					outcomeId: Number(outcomeId),
					outcomeTypeId,
				}),
			),
		}));

		bulkSave.mutate(
			{ programCommissionId, courses },
			{
				onSuccess: () => {
					showToast('loads.courseOutcomeMappingMaintenance.toast.saved', 'success');
					setEditMode(false);
				},
				onError: (error) => {
					const reasons = getApiErrorReasons(error);
					if (reasons.length > 0) {
						setSaveErrors(reasons.map((reason) => tryTranslate(t, reason)));
					} else {
						showToast('loads.courseOutcomeMappingMaintenance.error.saveFailed', 'error');
					}
				},
			},
		);
	};

	if (isLoading) {
		return (
			<Card>
				<div className="space-y-2" aria-busy>
					{Array.from({ length: 8 }).map((_, index) => (
						<div key={index} className="h-12 animate-pulse rounded-lg bg-zinc-100" />
					))}
				</div>
			</Card>
		);
	}

	if (isError || !view) {
		return (
			<Card>
				<div className="flex flex-col items-center gap-3 py-12 text-center">
					<p className="text-sm text-zinc-500">
						{t('loads.courseOutcomeMappingMaintenance.error.loadFailed')}
					</p>
					<div className="flex gap-2">
						<Button variant="surface" size="sm" onClick={() => refetch()}>
							{t('loads.courseOutcomeMappingMaintenance.retry')}
						</Button>
						<Button variant="ghost" size="sm" onClick={onBack}>
							{t('loads.courseOutcomeMappingMaintenance.actions.back')}
						</Button>
					</div>
				</div>
			</Card>
		);
	}

	const { header, outcomes } = view;

	const renderCourseRow = (course: CourseOutcomeMappingCourse) => {
		const marks = editState[course.studyPlanCourseId] ?? {};
		const isTrainingCourse = Object.keys(marks).length === 0;
		return (
			<tr key={course.studyPlanCourseId} className="border-t border-zinc-100">
				<td className="px-3 py-2 font-mono text-[13px] text-zinc-600">{course.studyPlanCode}</td>
				<td className="px-3 py-2 font-mono text-[13px] text-zinc-700">{course.courseCode}</td>
				<td className="px-3 py-2 text-[13px] text-zinc-800">
					{localized(course.courseName, locale)}
				</td>
				<td className="border-l border-zinc-100 px-3 py-2 text-center">
					{isTrainingCourse && formationType ? (
						<CourseOutcomeMappingGlyph
							type={formationType}
							label={localized(formationType.name, locale)}
						/>
					) : null}
				</td>
				{outcomes.map((outcome) => {
					const typeId = marks[outcome.outcomeId];
					const markType = typeId != null ? typeById.get(typeId) : undefined;
					const glyph = markType ? (
						<CourseOutcomeMappingGlyph type={markType} label={localized(markType.name, locale)} />
					) : null;
					return (
						<td key={outcome.outcomeId} className="border-l border-zinc-100 p-0 text-center">
							{editMode && canEdit ? (
								<button
									type="button"
									onClick={() => cycleCell(course.studyPlanCourseId, outcome.outcomeId)}
									aria-label={localized(outcome.outcomeName, locale)}
									className="flex h-10 w-full items-center justify-center hover:bg-zinc-50">
									{glyph}
								</button>
							) : (
								<div className="flex h-10 items-center justify-center">{glyph}</div>
							)}
						</td>
					);
				})}
			</tr>
		);
	};

	const renderTable = (courses: CourseOutcomeMappingCourse[]) => (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse text-left">
				<thead>
					<tr className="bg-zinc-50 text-[13px] font-semibold tracking-wide text-zinc-500 uppercase">
						<th rowSpan={2} className="px-3 py-2">
							{t('loads.courseOutcomeMappingMaintenance.grid.studyPlanCode')}
						</th>
						<th rowSpan={2} className="px-3 py-2">
							{t('loads.courseOutcomeMappingMaintenance.grid.courseCode')}
						</th>
						<th rowSpan={2} className="px-3 py-2">
							{t('loads.courseOutcomeMappingMaintenance.grid.courseName')}
						</th>
						<th rowSpan={2} className="border-l border-zinc-100 px-3 py-2 text-center">
							{t('loads.courseOutcomeMappingMaintenance.grid.cf')}
						</th>
						{outcomes.length > 0 && (
							<th
								colSpan={outcomes.length}
								className="border-l border-zinc-100 px-3 py-2 text-center">
								{t('loads.courseOutcomeMappingMaintenance.grid.studentOutcome')}
							</th>
						)}
					</tr>
					<tr className="bg-zinc-50 text-[13px] font-semibold text-zinc-500">
						{outcomes.map((outcome: CourseOutcomeMappingColumn) => (
							<th
								key={outcome.outcomeId}
								className="border-l border-zinc-100 px-3 py-2 text-center"
								title={localized(outcome.outcomeName, locale)}>
								{outcome.outcomeCode}
							</th>
						))}
					</tr>
				</thead>
				<tbody>{courses.map(renderCourseRow)}</tbody>
			</table>
		</div>
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start">
				<Card className="lg:flex-1">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div className="space-y-1">
							<Button variant="ghost" size="sm" onClick={onBack} className="mb-1 -ml-2">
								<ArrowLeftIcon className="h-4 w-4" />
								<span>{t('loads.courseOutcomeMappingMaintenance.actions.back')}</span>
							</Button>
							<Title
								title={localized(header.programName, locale)}
								className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
							/>
							<SubTitle
								name={`${header.accreditorCode} ${header.commissionCode} ${header.academicPeriodCode}`}
								className="[&_h3]:text-sm [&_h3]:font-mono [&_h3]:text-gray-500"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="surface"
								size="sm"
								onClick={handleExport}
								disabled={editMode}
								loading={exportPdf.isPending}>
								<ArrowDownTrayIcon className="h-4 w-4" />
								<span>{t('loads.courseOutcomeMappingMaintenance.actions.exportPdf')}</span>
							</Button>
							{editMode ? (
								<>
									<Button
										variant="secondary"
										size="sm"
										onClick={handleCancel}
										disabled={bulkSave.isPending}>
										<XMarkIcon className="h-4 w-4" />
										<span>{t('dialog.actions.cancel')}</span>
									</Button>
									<Button
										variant="primary"
										size="sm"
										onClick={handleSave}
										disabled={bulkSave.isPending}>
										<CheckIcon className="h-4 w-4" />
										<span>{t('loads.courseOutcomeMappingMaintenance.actions.save')}</span>
									</Button>
								</>
							) : (
								<Button
									variant="primary"
									size="sm"
									onClick={() => setEditMode(true)}
									disabled={!canEdit}>
									<PencilSquareIcon className="h-4 w-4" />
									<span>{t('loads.courseOutcomeMappingMaintenance.actions.edit')}</span>
								</Button>
							)}
						</div>
					</div>

					{saveErrors.length > 0 && (
						<ul className="mt-4 list-disc space-y-1 rounded-lg border border-red-200 bg-red-50 px-5 py-3 pl-8 text-sm text-red-700">
							{saveErrors.map((reason, index) => (
								<li key={`${reason}-${index}`}>{reason}</li>
							))}
						</ul>
					)}
				</Card>

				<div className="lg:w-80 lg:shrink-0">
					<CollapsibleSection
						title={t('loads.courseOutcomeMappingMaintenance.grid.legend')}
						icon={<InformationCircleIcon className="h-4 w-4" />}>
						<ul className="divide-y divide-zinc-100">
							{view.outcomeTypes.map((type) => (
								<li key={type.id} className="flex items-center gap-4 px-4 py-3">
									<CourseOutcomeMappingGlyph type={type} className="w-6" />
									<span className="text-sm text-zinc-700">{localized(type.name, locale)}</span>
								</li>
							))}
						</ul>
					</CollapsibleSection>
				</div>
			</div>

			{view.levels.map((level) => (
				<CollapsibleSection
					key={level.levelTypeId}
					title={localized(level.levelName, locale)}
					icon={<CubeIcon className="h-4 w-4" />}>
					{renderTable(level.courses)}
				</CollapsibleSection>
			))}

			{view.electives.length > 0 && (
				<CollapsibleSection
					title={t('loads.courseOutcomeMappingMaintenance.grid.electives')}
					icon={<CubeIcon className="h-4 w-4" />}>
					{renderTable(view.electives)}
				</CollapsibleSection>
			)}

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
