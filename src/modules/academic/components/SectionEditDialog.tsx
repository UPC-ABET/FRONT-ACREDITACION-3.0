'use client';

import { useCallback, useMemo, useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	LazySelect,
	Select,
	type LazySelectValue,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { coursesService, professorsService } from '@/modules/academic';
import type {
	CampusResponse,
	CourseLookupItem,
	CourseSectionMaintenanceItem,
	CourseSectionMaintenanceUpdate,
	ProfessorMaintenanceItem,
} from '@/modules/academic';
import type { TypeOption } from '@/modules/core';

const PAGE_SIZE = 20;

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

type Props = {
	item: CourseSectionMaintenanceItem;
	campuses: CampusResponse[];
	modalityTypes: TypeOption[];
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onSave: (body: CourseSectionMaintenanceUpdate) => void;
};

export function SectionEditDialog({
	item,
	campuses,
	modalityTypes,
	saving,
	errorMessage,
	onClose,
	onSave,
}: Props) {
	const { t, locale } = useI18n();

	const [sectionCode, setSectionCode] = useState(item.sectionCode);
	const [course, setCourse] = useState<LazySelectValue | null>(
		item.courseId != null ? { id: item.courseId, label: item.courseCode } : null,
	);
	const [professor, setProfessor] = useState<LazySelectValue | null>(
		item.professorId != null ? { id: item.professorId, label: item.professorCode } : null,
	);
	const [campusId, setCampusId] = useState<number | null>(item.campusId ?? null);
	const [modalityTypeId, setModalityTypeId] = useState<number | null>(
		item.sectionModalityTypeId ?? null,
	);

	const loadCourses = useCallback(
		({ search, page }: { search: string; page: number }) =>
			coursesService.lookup({ search, page, pageSize: PAGE_SIZE }).then((response) => ({
				items: response.data.items,
				totalPages: response.data.totalPages,
			})),
		[],
	);

	const loadProfessors = useCallback(
		({ search, page }: { search: string; page: number }) =>
			professorsService.maintenanceList({ search, page, pageSize: PAGE_SIZE }).then((response) => ({
				items: response.data.items,
				totalPages: response.data.totalPages,
			})),
		[],
	);

	const campusOptions = useMemo(
		() =>
			campuses.map((campus) => ({
				value: campus.id,
				label: localized(campus.name, locale) || campus.code,
			})),
		[campuses, locale],
	);
	const modalityOptions = useMemo(
		() =>
			modalityTypes.map((type) => ({
				value: type.id,
				label: localized(type.name, locale) || type.code,
			})),
		[modalityTypes, locale],
	);

	const selectedCampus = campusOptions.find((option) => option.value === campusId) ?? null;
	const selectedModality =
		modalityOptions.find((option) => option.value === modalityTypeId) ?? null;

	const canSave =
		sectionCode.trim() !== '' &&
		course != null &&
		professor != null &&
		campusId != null &&
		modalityTypeId != null &&
		!saving;

	const handleSubmit = () => {
		if (!course || !professor || campusId == null || modalityTypeId == null) return;
		onSave({
			sectionCode: sectionCode.trim(),
			courseId: course.id,
			professorId: professor.id,
			campusId,
			sectionModalityTypeId: modalityTypeId,
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
					<DialogTitle>{t('loads.sectionsMaintenance.edit.title')}</DialogTitle>
					<DialogDescription>{t('loads.sectionsMaintenance.edit.subtitle')}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						label={t('loads.sectionsMaintenance.col.sectionCode')}
						value={sectionCode}
						onChange={(event) => setSectionCode(event.target.value)}
						required
					/>

					<LazySelect<CourseLookupItem>
						label={t('loads.sectionsMaintenance.col.courseCode')}
						placeholder={t('loads.sectionsMaintenance.edit.coursePlaceholder')}
						value={course}
						onChange={(courseItem) =>
							setCourse(
								courseItem
									? {
											id: courseItem.id,
											label: `${courseItem.code} — ${localized(courseItem.name, locale)}`,
										}
									: null,
							)
						}
						loadPage={loadCourses}
						getId={(courseItem) => courseItem.id}
						getLabel={(courseItem) => `${courseItem.code} — ${localized(courseItem.name, locale)}`}
					/>

					<LazySelect<ProfessorMaintenanceItem>
						label={t('loads.sectionsMaintenance.col.professorCode')}
						placeholder={t('loads.sectionsMaintenance.edit.professorPlaceholder')}
						value={professor}
						onChange={(professorItem) =>
							setProfessor(
								professorItem
									? {
											id: professorItem.id,
											label: `${professorItem.code} — ${professorItem.firstName} ${professorItem.lastName}`,
										}
									: null,
							)
						}
						loadPage={loadProfessors}
						getId={(professorItem) => professorItem.id}
						getLabel={(professorItem) =>
							`${professorItem.code} — ${professorItem.firstName} ${professorItem.lastName}`
						}
					/>

					<div className="grid gap-4 sm:grid-cols-2">
						<Select
							name="campus"
							label={t('loads.sectionsMaintenance.col.campusCode')}
							placeholder={t('loads.sectionsMaintenance.edit.campusPlaceholder')}
							isSearchable
							isClearable
							options={campusOptions}
							value={selectedCampus}
							onChange={(_name, value) =>
								setCampusId(value && !Array.isArray(value) ? Number(value.value) : null)
							}
						/>
						<Select
							name="modality"
							label={t('loads.sectionsMaintenance.col.modality')}
							placeholder={t('loads.sectionsMaintenance.edit.modalityPlaceholder')}
							isSearchable
							isClearable
							options={modalityOptions}
							value={selectedModality}
							onChange={(_name, value) =>
								setModalityTypeId(value && !Array.isArray(value) ? Number(value.value) : null)
							}
						/>
					</div>

					{errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={saving}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" onClick={handleSubmit} disabled={!canSave} loading={saving}>
						{t('loads.sectionsMaintenance.edit.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
