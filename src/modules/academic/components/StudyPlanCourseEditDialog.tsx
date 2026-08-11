'use client';

import { useMemo, useState } from 'react';
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
	Select,
} from '@/shared/components';
import { useI18n } from '@/providers';
import type { TypeOption } from '@/modules/core';
import type { I18nText } from '@/shared/types';
import type { StudyPlanCourseEditBody, StudyPlanCourseRow } from '../types';

function asI18n(text: { es?: string; en?: string } | undefined): I18nText {
	return { es: text?.es ?? '', en: text?.en ?? '' };
}

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

type Props = {
	item: StudyPlanCourseRow;
	gradeTypes: TypeOption[];
	gradeTypesLoading: boolean;
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onSave: (body: StudyPlanCourseEditBody) => void;
};

export function StudyPlanCourseEditDialog({
	item,
	gradeTypes,
	gradeTypesLoading,
	saving,
	errorMessage,
	onClose,
	onSave,
}: Props) {
	const { t, locale } = useI18n();
	const [code, setCode] = useState(item.courseCode);
	const [name, setName] = useState<I18nText>(() => asI18n(item.courseName));
	const [learningOutcome, setLearningOutcome] = useState<I18nText>(() =>
		asI18n(item.learningOutcome),
	);
	const [gradeTypeId, setGradeTypeId] = useState<number | null>(item.gradeTypeId);

	const gradeTypeOptions = useMemo(
		() =>
			gradeTypes.map((gradeType) => ({
				value: gradeType.id,
				label: `${gradeType.code} — ${localized(gradeType.name, locale)}`,
			})),
		[gradeTypes, locale],
	);
	const selectedGradeType = gradeTypeOptions.find((option) => option.value === gradeTypeId) ?? null;

	const canSave = code.trim() !== '' && !saving;

	const handleSubmit = () => {
		onSave({
			code: code.trim(),
			name: { es: name.es ?? '', en: name.en ?? '' },
			learningOutcome: { es: learningOutcome.es ?? '', en: learningOutcome.en ?? '' },
			gradeTypeId,
		});
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>{t('loads.studyPlanCoursesView.edit.title')}</DialogTitle>
					<DialogDescription>{t('loads.studyPlanCoursesView.edit.subtitle')}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						label={t('loads.studyPlanCoursesView.col.courseCode')}
						value={code}
						onChange={(event) => setCode(event.target.value)}
						required
					/>
					<I18nTextField
						as="input"
						layout="row"
						label={t('loads.studyPlanCoursesView.col.courseName')}
						value={name}
						onChange={setName}
					/>
					<I18nTextField
						layout="row"
						rows={4}
						label={t('loads.studyPlanCoursesView.col.learningOutcome')}
						value={learningOutcome}
						onChange={setLearningOutcome}
					/>
					<div className="space-y-1">
						<Select
							name="gradeType"
							label={t('loads.studyPlanCoursesView.edit.gradeType')}
							placeholder={t('loads.studyPlanCoursesView.edit.gradeTypePlaceholder')}
							isSearchable
							isClearable
							isDisabled={gradeTypesLoading}
							options={gradeTypeOptions}
							value={selectedGradeType}
							onChange={(_name, value) =>
								setGradeTypeId(value && !Array.isArray(value) ? Number(value.value) : null)
							}
						/>
						<p className="text-xs text-zinc-500">
							{t('loads.studyPlanCoursesView.edit.gradeTypeDescription')}
						</p>
					</div>
					{errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={saving}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" disabled={!canSave} onClick={handleSubmit} loading={saving}>
						{t('loads.studyPlanCoursesView.edit.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
