'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowLeftIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	I18nTextField,
	Input,
	LazySelect,
	Select,
	Toggle,
} from '@/shared/components';
import { useI18n } from '@/providers';
import type { I18nText } from '@/shared/types';
import { coursesService } from '../services';
import type { CourseLookupItem, StudyPlanCourseCreate, StudyPlanCourseLevelOption } from '../types';

const PAGE_SIZE = 20;

type CourseMode = 'existing' | 'new';

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

function hasText(text: I18nText): boolean {
	return (text.es ?? '').trim() !== '' || (text.en ?? '').trim() !== '';
}

type Props = {
	studyPlanId: number;
	levels: StudyPlanCourseLevelOption[];
	levelsLoading: boolean;
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onCreate: (body: StudyPlanCourseCreate) => void;
};

export function StudyPlanCourseCreateDialog({
	studyPlanId,
	levels,
	levelsLoading,
	saving,
	errorMessage,
	onClose,
	onCreate,
}: Props) {
	const { t, locale } = useI18n();

	const [mode, setMode] = useState<CourseMode>('existing');
	const [course, setCourse] = useState<CourseLookupItem | null>(null);
	const [newCourseCode, setNewCourseCode] = useState('');
	const [newCourseName, setNewCourseName] = useState<I18nText>({ es: '', en: '' });
	const [newCourseLearningOutcome, setNewCourseLearningOutcome] = useState<I18nText>({
		es: '',
		en: '',
	});
	const [isElective, setIsElective] = useState(false);
	const [levelTypeId, setLevelTypeId] = useState<number | null>(null);

	const loadCourses = useCallback(
		({ search, page }: { search: string; page: number }) =>
			coursesService.lookup({ search, page, pageSize: PAGE_SIZE }).then((response) => ({
				items: response.data.items,
				totalPages: response.data.totalPages,
			})),
		[],
	);

	const levelOptions = useMemo(
		() =>
			levels.map((level) => ({
				value: level.id,
				label: localized(level.name, locale),
			})),
		[levels, locale],
	);
	const selectedLevel = levelOptions.find((option) => option.value === levelTypeId) ?? null;

	const courseSelectionValid =
		mode === 'existing' ? course != null : newCourseCode.trim() !== '' && hasText(newCourseName);

	const canSave = levelTypeId != null && courseSelectionValid && !saving;

	const handleSubmit = () => {
		if (levelTypeId == null) return;
		const body: StudyPlanCourseCreate = { studyPlanId, isElective, levelTypeId };
		if (mode === 'existing') {
			if (!course) return;
			body.courseId = course.id;
		} else {
			if (newCourseCode.trim() === '' || !hasText(newCourseName)) return;
			body.newCourse = {
				code: newCourseCode.trim(),
				name: { es: newCourseName.es ?? '', en: newCourseName.en ?? '' },
			};
			if (hasText(newCourseLearningOutcome)) {
				body.newCourse.learningOutcome = {
					es: newCourseLearningOutcome.es ?? '',
					en: newCourseLearningOutcome.en ?? '',
				};
			}
		}
		onCreate(body);
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>{t('loads.studyPlanCoursesView.create.title')}</DialogTitle>
					<DialogDescription>{t('loads.studyPlanCoursesView.create.subtitle')}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{mode === 'existing' ? (
						<div className="space-y-2">
							<LazySelect<CourseLookupItem>
								label={t('loads.studyPlanCoursesView.create.course')}
								placeholder={t('loads.studyPlanCoursesView.create.coursePlaceholder')}
								value={
									course
										? { id: course.id, label: `${course.code} — ${localized(course.name, locale)}` }
										: null
								}
								onChange={setCourse}
								loadPage={loadCourses}
								getId={(courseItem) => courseItem.id}
								getLabel={(courseItem) =>
									`${courseItem.code} — ${localized(courseItem.name, locale)}`
								}
							/>
							<button
								type="button"
								className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-red-300 bg-red-50/60 px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 focus:ring-2 focus:ring-red-100 focus:outline-none"
								onClick={() => setMode('new')}>
								<PlusCircleIcon className="h-5 w-5" />
								{t('loads.studyPlanCoursesView.create.addNewCourse')}
							</button>
						</div>
					) : (
						<div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
							<div className="flex items-center justify-between gap-3">
								<p className="text-sm font-semibold text-zinc-800">
									{t('loads.studyPlanCoursesView.create.newCourseTitle')}
								</p>
								<button
									type="button"
									className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 underline underline-offset-2 hover:text-red-700"
									onClick={() => setMode('existing')}>
									<ArrowLeftIcon className="h-3.5 w-3.5" />
									{t('loads.studyPlanCoursesView.create.useExistingCourse')}
								</button>
							</div>
							<Input
								label={t('loads.studyPlanCoursesView.col.courseCode')}
								value={newCourseCode}
								onChange={(event) => setNewCourseCode(event.target.value)}
								required
							/>
							<I18nTextField
								as="input"
								layout="row"
								required
								label={t('loads.studyPlanCoursesView.col.courseName')}
								value={newCourseName}
								onChange={setNewCourseName}
							/>
							<I18nTextField
								layout="row"
								rows={3}
								label={t('loads.studyPlanCoursesView.col.learningOutcome')}
								value={newCourseLearningOutcome}
								onChange={setNewCourseLearningOutcome}
							/>
						</div>
					)}

					<Select
						name="level"
						label={t('loads.studyPlanCoursesView.create.level')}
						placeholder={t('loads.studyPlanCoursesView.create.levelPlaceholder')}
						isSearchable
						isClearable
						isDisabled={levelsLoading}
						options={levelOptions}
						value={selectedLevel}
						onChange={(_name, value) =>
							setLevelTypeId(value && !Array.isArray(value) ? Number(value.value) : null)
						}
					/>

					<Toggle
						label={t('loads.studyPlanCoursesView.create.elective')}
						description={t('loads.studyPlanCoursesView.create.electiveDescription')}
						checked={isElective}
						onChange={setIsElective}
					/>

					{errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={saving}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" onClick={handleSubmit} disabled={!canSave} loading={saving}>
						{t('loads.studyPlanCoursesView.create.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
