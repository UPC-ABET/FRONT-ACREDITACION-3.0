'use client';

import { useState } from 'react';
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
} from '@/shared/components';
import { useI18n } from '@/providers';
import type { I18nText } from '@/shared/types';
import type { CourseUpdateBody, StudyPlanCourseRow } from '../types';

function asI18n(text: { es?: string; en?: string } | undefined): I18nText {
	return { es: text?.es ?? '', en: text?.en ?? '' };
}

type Props = {
	item: StudyPlanCourseRow;
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onSave: (body: CourseUpdateBody) => void;
};

export function StudyPlanCourseEditDialog({ item, saving, errorMessage, onClose, onSave }: Props) {
	const { t } = useI18n();
	const [code, setCode] = useState(item.courseCode);
	const [name, setName] = useState<I18nText>(() => asI18n(item.courseName));
	const [learningOutcome, setLearningOutcome] = useState<I18nText>(() =>
		asI18n(item.learningOutcome),
	);

	const canSave = code.trim() !== '' && !saving;

	const handleSubmit = () => {
		onSave({
			code: code.trim(),
			name: { es: name.es ?? '', en: name.en ?? '' },
			learningOutcome: { es: learningOutcome.es ?? '', en: learningOutcome.en ?? '' },
		});
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-2xl">
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
						rows={3}
						label={t('loads.studyPlanCoursesView.col.learningOutcome')}
						value={learningOutcome}
						onChange={setLearningOutcome}
					/>
					{errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={saving}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" disabled={!canSave} onClick={handleSubmit}>
						{saving ? t('loading.default') : t('loads.studyPlanCoursesView.edit.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
