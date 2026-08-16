'use client';

import { Select } from '@/shared';
import { useI18n } from '@/providers';
import type { CourseScopeOption, CourseScopeSelection } from '../../hooks';

interface CourseScopeFieldsProps {
	/** i18n namespace holding the labels, e.g. `projects.create.step1`. Both wizards keep their
	 * own wording; only the shape of the two fields is shared. */
	i18nPrefix: string;
	selection: CourseScopeSelection;
}

export function CourseScopeFields({ i18nPrefix, selection }: CourseScopeFieldsProps) {
	const { t } = useI18n();
	const {
		hasPeriod,
		selectedProgramId,
		selectedProgramOpt,
		selectedCourseOpt,
		programOptions,
		courseOptions,
		loadingPrograms,
		loadingSpc,
		selectProgram,
		selectCourse,
	} = selection;

	const single = (v: CourseScopeOption | CourseScopeOption[] | null) =>
		Array.isArray(v) ? (v[0] ?? null) : v;

	return (
		<div className="grid gap-6 sm:grid-cols-2">
			<Select
				label={t(`${i18nPrefix}.programLabel`)}
				placeholder={
					!hasPeriod
						? t(`${i18nPrefix}.selectPeriodFirst`)
						: loadingPrograms
							? t(`${i18nPrefix}.programLoading`)
							: programOptions.length === 0
								? t(`${i18nPrefix}.programNoOptions`)
								: t(`${i18nPrefix}.programPlaceholder`)
				}
				options={programOptions}
				value={selectedProgramOpt}
				isDisabled={!hasPeriod || loadingPrograms}
				isSearchable
				onChange={(_, v) =>
					selectProgram(single(v as CourseScopeOption | CourseScopeOption[] | null))
				}
			/>

			<Select
				label={t(`${i18nPrefix}.courseLabel`)}
				placeholder={
					!selectedProgramId
						? t(`${i18nPrefix}.courseSelectProgramFirst`)
						: loadingSpc
							? t(`${i18nPrefix}.courseLoading`)
							: courseOptions.length === 0
								? t(`${i18nPrefix}.courseNoOptions`)
								: t(`${i18nPrefix}.coursePlaceholder`)
				}
				options={courseOptions}
				value={selectedCourseOpt}
				isDisabled={!selectedProgramId || loadingSpc || courseOptions.length === 0}
				isSearchable
				onChange={(_, v) =>
					selectCourse(single(v as CourseScopeOption | CourseScopeOption[] | null))
				}
			/>
		</div>
	);
}
