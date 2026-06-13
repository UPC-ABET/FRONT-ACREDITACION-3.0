'use client';

import { useCallback, useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	LazySelect,
	type LazySelectValue,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { courseSectionsService, enrolledStudentsService } from '@/modules/academic';
import type {
	CourseSectionMaintenanceItem,
	EnrolledStudentMaintenanceItem,
	StudentSectionEnrollmentMaintenanceItem,
	StudentSectionEnrollmentMaintenanceUpdate,
} from '@/modules/academic';

const PAGE_SIZE = 20;

type Props = {
	item: StudentSectionEnrollmentMaintenanceItem;
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onSave: (body: StudentSectionEnrollmentMaintenanceUpdate) => void;
};

function sectionLabel(section: CourseSectionMaintenanceItem): string {
	return `${section.courseCode} — ${section.sectionCode}`;
}

function studentLabel(student: EnrolledStudentMaintenanceItem): string {
	return `${student.studentCode} — ${student.firstName} ${student.lastName}`;
}

export function StudentSectionEnrollmentEditDialog({
	item,
	saving,
	errorMessage,
	onClose,
	onSave,
}: Props) {
	const { t } = useI18n();

	const [section, setSection] = useState<LazySelectValue | null>(
		item.courseSectionId != null
			? { id: item.courseSectionId, label: `${item.courseCode} — ${item.sectionCode}` }
			: null,
	);
	const [student, setStudent] = useState<LazySelectValue | null>(
		item.enrolledStudentId != null
			? {
					id: item.enrolledStudentId,
					label: `${item.studentCode} — ${item.studentFirstName} ${item.studentLastName}`,
				}
			: null,
	);

	const loadSections = useCallback(
		({ search, page }: { search: string; page: number }) =>
			courseSectionsService
				.maintenanceList({ search, page, pageSize: PAGE_SIZE })
				.then((response) => ({
					items: response.data.items,
					totalPages: response.data.totalPages,
				})),
		[],
	);

	const loadStudents = useCallback(
		({ search, page }: { search: string; page: number }) =>
			enrolledStudentsService
				.maintenanceList({ search, page, pageSize: PAGE_SIZE })
				.then((response) => ({
					items: response.data.items,
					totalPages: response.data.totalPages,
				})),
		[],
	);

	const canSave = section != null && student != null && !saving;

	const handleSubmit = () => {
		if (!section || !student) return;
		onSave({ courseSectionId: section.id, enrolledStudentId: student.id });
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{t('loads.studentSectionEnrollmentsMaintenance.edit.title')}</DialogTitle>
					<DialogDescription>
						{t('loads.studentSectionEnrollmentsMaintenance.edit.subtitle')}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<LazySelect<CourseSectionMaintenanceItem>
						label={t('loads.studentSectionEnrollmentsMaintenance.edit.section')}
						placeholder={t('loads.studentSectionEnrollmentsMaintenance.edit.sectionPlaceholder')}
						value={section}
						onChange={(sectionItem) =>
							setSection(
								sectionItem ? { id: sectionItem.id, label: sectionLabel(sectionItem) } : null,
							)
						}
						loadPage={loadSections}
						getId={(sectionItem) => sectionItem.id}
						getLabel={sectionLabel}
					/>

					<LazySelect<EnrolledStudentMaintenanceItem>
						label={t('loads.studentSectionEnrollmentsMaintenance.edit.student')}
						placeholder={t('loads.studentSectionEnrollmentsMaintenance.edit.studentPlaceholder')}
						value={student}
						onChange={(studentItem) =>
							setStudent(
								studentItem ? { id: studentItem.id, label: studentLabel(studentItem) } : null,
							)
						}
						loadPage={loadStudents}
						getId={(studentItem) => studentItem.id}
						getLabel={studentLabel}
					/>

					{errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={saving}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" onClick={handleSubmit} disabled={!canSave}>
						{saving
							? t('loading.default')
							: t('loads.studentSectionEnrollmentsMaintenance.edit.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
