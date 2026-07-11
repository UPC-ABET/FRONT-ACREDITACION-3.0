'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, EyeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	ErrorDialog,
	I18nTextField,
	PageHeader,
	Skeleton,
	SuccessDialog,
	TableEmptyState,
	TableErrorState,
	Tabs,
} from '@/shared/components/ui';
import type { I18nValue } from '@/shared/components/ui/I18nTextField';
import { cn } from '@/shared/lib/utils';
import { useTabParam } from '@/shared';
import { useAuth, useI18n } from '@/providers';
import { useProfessorByUserId } from '@/modules/academic/hooks';
import { useProjectDetails, useQualificationStatusTypes } from '../hooks';
import { ProjectEvaluateRubricPanel } from '../components/project-evaluate/ProjectEvaluateRubricPanel';
import { TYPE_CODES } from '@/shared/constants';
import type { RubricTableHandle } from '../types';

interface ProjectEvaluatePageProps {
	projectId: string;
	competencyScopeCode: string;
}

const EMPTY_OBSERVATION: I18nValue = { es: '', en: '' };

function dirtyKey(studyPlanCourseId: number, gradeTypeId: number): string {
	return `${studyPlanCourseId}:${gradeTypeId}`;
}

function getInitialObservation(
	rubrics: {
		items: {
			students: { observation?: I18nValue | null }[];
		}[];
	}[],
): I18nValue {
	for (const rubricEntry of rubrics) {
		for (const item of rubricEntry.items) {
			const withObservation = item.students.find((student) => student.observation != null);
			if (withObservation?.observation) {
				return {
					es: withObservation.observation.es ?? '',
					en: withObservation.observation.en ?? '',
				};
			}
		}
	}

	return EMPTY_OBSERVATION;
}

export function ProjectEvaluatePage({ projectId, competencyScopeCode }: ProjectEvaluatePageProps) {
	const { t, locale } = useI18n();
	const { user: authUser } = useAuth();

	const { data: professor } = useProfessorByUserId(authUser?.id);
	const professorId = professor?.id;

	const { data, isLoading, isError, error } = useProjectDetails(projectId, {
		competencyScopeCode,
		isEvaluationMode: true,
	});
	const { statusTypes, isLoading: isLoadingStatuses } = useQualificationStatusTypes();

	const nonAttendanceTypeIds = useMemo(() => {
		return new Set(
			statusTypes
				.filter((status) => status.code !== TYPE_CODES.QUALIFICATION_STATUS.ASISTIO)
				.map((status) => status.id),
		);
	}, [statusTypes]);

	const myEvaluatorEntries = useMemo(
		() => (data?.evaluators ?? []).filter((e) => e.professorId === professorId),
		[data?.evaluators, professorId],
	);

	// Use the first canEvaluate entry as the grading identity; fall back to first entry
	const evaluatorId = useMemo(() => {
		if (!myEvaluatorEntries.length) return 0;
		const grading = myEvaluatorEntries.find((e) => e.canEvaluate);
		return (grading ?? myEvaluatorEntries[0]).id;
	}, [myEvaluatorEntries]);

	// Read-only when none of the professor's entries have canEvaluate
	const isReadOnly = useMemo(() => {
		if (!myEvaluatorEntries.length) return false;
		return !myEvaluatorEntries.some((e) => e.canEvaluate);
	}, [myEvaluatorEntries]);

	// Keep isDocEvaluator for the "view-only" banner
	const isDocEvaluator = useMemo(
		() =>
			myEvaluatorEntries.some(
				(e) => e.evaluatorTypeCode === TYPE_CODES.EVALUATOR_TYPE_CODE.TEACHER,
			),
		[myEvaluatorEntries],
	);

	const [activeTab, setTab] = useTabParam('');
	const activeStudyPlanCourseId = activeTab ? Number(activeTab) : null;

	const [activeGradeTab, setGradeTab] = useTabParam('', { paramName: 'gradeTab' });
	const activeGradeTypeId = activeGradeTab ? Number(activeGradeTab) : null;

	const [dirtyTabs, setDirtyTabs] = useState<Set<string>>(new Set());

	// Each career/gradeType panel reports its own validation messages (same text as before);
	// the page keeps them keyed by tab and renders the aggregate once, outside the rubric box.
	const [incompleteItemsByTab, setIncompleteItemsByTab] = useState<
		Map<string, { message: string; type: 'warning' | 'error' }[]>
	>(new Map());
	const handleIncompleteChange = (
		studyPlanCourseId: number,
		gradeTypeId: number,
		items: { message: string; type: 'warning' | 'error' }[],
	) => {
		setIncompleteItemsByTab((prev) => {
			const next = new Map(prev);
			const key = dirtyKey(studyPlanCourseId, gradeTypeId);
			if (items.length > 0) {
				next.set(key, items);
			} else {
				next.delete(key);
			}
			return next;
		});
	};
	const incompleteItems = useMemo(() => {
		const seen = new Map<string, { message: string; type: 'warning' | 'error' }>();
		for (const items of incompleteItemsByTab.values()) {
			for (const item of items) seen.set(item.message, item);
		}
		return [...seen.values()];
	}, [incompleteItemsByTab]);

	const statusOptions = useMemo(
		() =>
			statusTypes.map((s) => ({ value: s.id, label: s.name[locale as 'es' | 'en'] ?? s.name.es })),
		[statusTypes, locale],
	);

	const handleDirtyChange = (studyPlanCourseId: number, gradeTypeId: number, isDirty: boolean) => {
		setDirtyTabs((prev) => {
			const next = new Set(prev);
			const key = dirtyKey(studyPlanCourseId, gradeTypeId);
			if (isDirty) {
				next.add(key);
			} else {
				next.delete(key);
			}
			return next;
		});
	};

	const rubrics = useMemo(() => data?.rubrics ?? [], [data?.rubrics]);

	// The evaluation covers all students on the project regardless of career, so there is a
	// single shared observation — not one per career/gradeType tab.
	const initialObservation = useMemo(() => getInitialObservation(rubrics), [rubrics]);

	const [observation, setObservation] = useState<I18nValue>(initialObservation);
	const [observationDirty, setObservationDirty] = useState(false);
	const [trackedInitialObservation, setTrackedInitialObservation] = useState(initialObservation);
	if (initialObservation !== trackedInitialObservation) {
		setTrackedInitialObservation(initialObservation);
		if (!observationDirty) setObservation(initialObservation);
	}

	const careerIds = useMemo(
		() => [
			...new Set(
				(data?.students ?? [])
					.map((s) => s.studyPlanCourseId)
					.filter((id): id is number => id != null),
			),
		],
		[data?.students],
	);

	const effectiveStudyPlanCourseId = activeStudyPlanCourseId ?? careerIds[0] ?? null;

	const activeRubricEntry = useMemo(
		() => rubrics.find((r) => r.studyPlanCourseId === effectiveStudyPlanCourseId) ?? null,
		[rubrics, effectiveStudyPlanCourseId],
	);

	const activeItems = useMemo(() => activeRubricEntry?.items ?? [], [activeRubricEntry]);

	// Used only as a fallback when the selected career has no rubric items at all, so we can
	// still show who's in the project even though there's nothing to grade yet.
	const activeStudents = useMemo(
		() => (data?.students ?? []).filter((s) => s.studyPlanCourseId === effectiveStudyPlanCourseId),
		[data?.students, effectiveStudyPlanCourseId],
	);

	const effectiveGradeTypeId = useMemo(() => {
		if (activeItems.some((item) => item.gradeType.id === activeGradeTypeId)) {
			return activeGradeTypeId;
		}
		return activeItems[0]?.gradeType.id ?? null;
	}, [activeItems, activeGradeTypeId]);

	// Every (career, gradeType) combination stays mounted at all times so switching tabs
	// never discards in-progress edits — only the active one is shown (CSS `hidden`).
	const panels = useMemo(() => {
		return careerIds.flatMap((careerId) => {
			const rubricEntry = rubrics.find((r) => r.studyPlanCourseId === careerId);
			const studentsForCareer = (data?.students ?? []).filter(
				(s) => s.studyPlanCourseId === careerId,
			);
			return (rubricEntry?.items ?? []).map((item) => ({
				key: dirtyKey(careerId, item.gradeType.id),
				studyPlanCourseId: careerId,
				gradeTypeId: item.gradeType.id,
				item,
				students: studentsForCareer,
			}));
		});
	}, [careerIds, rubrics, data?.students]);

	// Editing the shared observation touches every career/gradeType panel, so mark them all
	// dirty — otherwise "Save" would only persist it for whichever tab is currently active.
	const handleObservationChange = (value: I18nValue) => {
		setObservation(value);
		setObservationDirty(true);
		setDirtyTabs((prev) => new Set([...prev, ...panels.map((p) => p.key)]));
	};

	const panelRefs = useRef(new Map<string, RubricTableHandle>());
	const registerPanelRef = (key: string) => (handle: RubricTableHandle | null) => {
		if (handle) {
			panelRefs.current.set(key, handle);
		} else {
			panelRefs.current.delete(key);
		}
	};

	const [isSavingAll, setIsSavingAll] = useState(false);
	const [showSaveAllSuccess, setShowSaveAllSuccess] = useState(false);
	const [saveAllError, setSaveAllError] = useState(false);

	const handleSaveAll = async () => {
		const dirtyKeys = [...dirtyTabs];
		const readyKeys = dirtyKeys.filter((key) => panelRefs.current.get(key)?.canSave);

		if (readyKeys.length === 0) return;

		setIsSavingAll(true);
		try {
			await Promise.all(readyKeys.map((key) => panelRefs.current.get(key)?.save()));
			setObservationDirty(false);
			setShowSaveAllSuccess(true);
		} catch {
			// Panels that failed stay dirty, so the user can retry them.
			setSaveAllError(true);
		} finally {
			setIsSavingAll(false);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-40 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div className="space-y-4">
				<Link
					href="/evaluation/grade-projects"
					className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800">
					<ArrowLeftIcon className="h-4 w-4" />
					{t('projects.evaluate.backButton')}
				</Link>
				<TableErrorState
					message={isError && error instanceof Error ? error.message : t('projects.evaluate.error')}
				/>
			</div>
		);
	}

	const { project, course } = data;

	const projectName = project.name[locale as 'es' | 'en'] ?? project.name.es;
	const courseName = course?.name[locale as 'es' | 'en'] ?? course?.name.es ?? '—';

	const isMultiple = competencyScopeCode === TYPE_CODES.COMPETENCY_SCOPE.MULTIPLE;

	return (
		<div className="space-y-6">
			<Link
				href="/evaluation/grade-projects"
				className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800">
				<ArrowLeftIcon className="h-4 w-4" />
				{t('projects.evaluate.backButton')}
			</Link>

			<PageHeader title={projectName} />

			<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-600">
				<span className="inline-flex w-fit items-center rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-mono text-xs font-medium text-zinc-600">
					{project.code}
				</span>
				<span className="text-zinc-200">|</span>
				<div className="flex items-center gap-1.5">
					<span className="font-medium text-zinc-400">{t('projects.evaluate.header.course')}</span>
					<span>{courseName}</span>
				</div>
			</div>

			{isReadOnly ? (
				<Alert variant="default" className="flex items-center gap-3">
					<EyeIcon className="h-5 w-5 shrink-0 text-zinc-500" />
					<AlertDescription>
						{isDocEvaluator
							? t('projects.evaluate.docReadOnly')
							: t('projects.evaluate.readOnlyNoPermission')}
					</AlertDescription>
				</Alert>
			) : null}

			{!evaluatorId && !isReadOnly ? (
				<Alert variant="warning" className="flex items-center gap-3">
					<ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-yellow-600" />
					<AlertDescription>{t('projects.evaluate.notAssigned')}</AlertDescription>
				</Alert>
			) : rubrics.length > 0 || careerIds.length > 0 ? (
				<div className="space-y-4">
					{careerIds.length > 0 && (
						<Tabs
							tabs={careerIds.map((id) => {
								const rubricEntry = rubrics.find((r) => r.studyPlanCourseId === id);
								const label =
									rubricEntry?.programName?.[locale as 'es' | 'en'] ??
									rubricEntry?.programName?.es ??
									String(id);
								const dirty = [...dirtyTabs].some((key) => key.startsWith(`${id}:`));
								return { id: String(id), label: dirty ? `${label} •` : label };
							})}
							activeTab={String(effectiveStudyPlanCourseId ?? '')}
							onChange={setTab}
						/>
					)}

					{activeItems.length > 0 && (
						<Tabs
							tabs={activeItems.map((item) => {
								const label = item.gradeType.name[locale as 'es' | 'en'] ?? item.gradeType.name.es;
								const dirty =
									effectiveStudyPlanCourseId != null &&
									dirtyTabs.has(dirtyKey(effectiveStudyPlanCourseId, item.gradeType.id));
								return { id: String(item.gradeType.id), label: dirty ? `${label} •` : label };
							})}
							activeTab={String(effectiveGradeTypeId ?? '')}
							onChange={setGradeTab}
						/>
					)}

					{activeItems.length === 0 && (
						<div className="space-y-4">
							<Card title={t('projects.evaluate.students.title')}>
								<div className="-m-4 divide-y divide-zinc-100">
									{activeStudents.length === 0 ? (
										<TableEmptyState message={t('projects.evaluate.students.empty')} />
									) : (
										activeStudents.map((student) => (
											<div key={student.id} className="flex flex-col gap-0.5 px-6 py-4">
												<span className="font-medium text-zinc-900">
													{student.firstName} {student.lastName}
												</span>
												<div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
													<span className="font-mono">{student.studentCode}</span>
													<span className="text-zinc-300">·</span>
													<span>{student.email}</span>
												</div>
											</div>
										))
									)}
								</div>
							</Card>
							<TableEmptyState message={t('projects.evaluate.rubric.noRubric')} />
						</div>
					)}

					{panels.map((panel) => (
						<ProjectEvaluateRubricPanel
							key={panel.key}
							ref={registerPanelRef(panel.key)}
							isVisible={
								panel.studyPlanCourseId === effectiveStudyPlanCourseId &&
								panel.gradeTypeId === effectiveGradeTypeId
							}
							item={panel.item}
							students={panel.students}
							evaluatorId={evaluatorId}
							projectId={projectId}
							academicPeriodId={data.academicPeriod?.id ?? null}
							nonAttendanceTypeIds={nonAttendanceTypeIds}
							statusOptions={statusOptions}
							isLoadingStatuses={isLoadingStatuses}
							isReadOnly={isReadOnly}
							disableDuplicate={careerIds.length > 1}
							isMultipleScope={isMultiple}
							t={t}
							onDirtyChange={(dirty) =>
								handleDirtyChange(panel.studyPlanCourseId, panel.gradeTypeId, dirty)
							}
							observation={observation}
							observationDirty={observationDirty}
							onIncompleteChange={(incomplete) =>
								handleIncompleteChange(panel.studyPlanCourseId, panel.gradeTypeId, incomplete)
							}
						/>
					))}
				</div>
			) : null}

			{!isReadOnly && rubrics.some((rubric) => rubric.items.length > 0) && (
				<div className="flex flex-col gap-4">
					<Card>
						<I18nTextField
							layout="row"
							label={`${t('projects.evaluate.rubric.observation')} (${t('projects.evaluate.rubric.observationOptional')})`}
							placeholder={t('projects.evaluate.rubric.observationPlaceholder')}
							value={observation}
							onChange={handleObservationChange}
							rows={3}
						/>
					</Card>

					{incompleteItems.length > 0 && (
						<ul className="space-y-1 text-sm">
							{incompleteItems.map((item) => (
								<li
									key={item.message}
									className={cn(
										'flex items-center gap-2 rounded-lg px-3 py-2',
										item.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800',
									)}>
									<ExclamationTriangleIcon
										className={cn(
											'h-4 w-4 shrink-0',
											item.type === 'error' ? 'text-red-500' : 'text-amber-500',
										)}
									/>
									{item.message}
								</li>
							))}
						</ul>
					)}
					<div className="flex justify-end">
						<Button
							variant="danger"
							loading={isSavingAll}
							disabled={dirtyTabs.size === 0 || isSavingAll}
							onClick={() => void handleSaveAll()}>
							{t('projects.evaluate.saveAll.button')}
						</Button>
					</div>
				</div>
			)}

			<SuccessDialog
				isOpen={showSaveAllSuccess}
				onClose={() => setShowSaveAllSuccess(false)}
				title={t('projects.evaluate.saveAll.successTitle')}
				message={t('projects.evaluate.saveAll.successMessage')}
			/>

			<ErrorDialog
				isOpen={saveAllError}
				onClose={() => setSaveAllError(false)}
				title={t('projects.evaluate.saveAll.errorTitle')}
				message={t('projects.evaluate.saveAll.errorMessage')}
			/>
		</div>
	);
}
