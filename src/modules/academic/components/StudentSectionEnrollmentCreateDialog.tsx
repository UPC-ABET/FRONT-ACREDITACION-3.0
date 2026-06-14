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
} from '@/shared/components';
import { useI18n } from '@/providers';
import { courseSectionsService, enrolledStudentsService } from '@/modules/academic';
import type {
	CourseSectionMaintenanceItem,
	EnrolledStudentMaintenanceItem,
	StudentSectionEnrollmentMaintenanceCreate,
} from '@/modules/academic';

const PAGE_SIZE = 20;

function sectionLabel(section: CourseSectionMaintenanceItem): string {
	return `${section.courseCode} — ${section.sectionCode}`;
}

function studentLabel(student: EnrolledStudentMaintenanceItem): string {
	return `${student.studentCode} — ${student.firstName} ${student.lastName}`;
}

type Props = {
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onCreate: (body: StudentSectionEnrollmentMaintenanceCreate) => void;
};

export function StudentSectionEnrollmentCreateDialog({
	saving,
	errorMessage,
	onClose,
	onCreate,
}: Props) {
	const { t } = useI18n();

	const [section, setSection] = useState<CourseSectionMaintenanceItem | null>(null);
	const [student, setStudent] = useState<EnrolledStudentMaintenanceItem | null>(null);

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
		onCreate({ courseSectionId: section.id, enrolledStudentId: student.id });
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{t('loads.studentSectionEnrollmentsMaintenance.create.title')}</DialogTitle>
					<DialogDescription>
						{t('loads.studentSectionEnrollmentsMaintenance.create.subtitle')}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<LazySelect<CourseSectionMaintenanceItem>
						label={t('loads.studentSectionEnrollmentsMaintenance.edit.section')}
						placeholder={t('loads.studentSectionEnrollmentsMaintenance.edit.sectionPlaceholder')}
						value={section ? { id: section.id, label: sectionLabel(section) } : null}
						onChange={setSection}
						loadPage={loadSections}
						getId={(sectionItem) => sectionItem.id}
						getLabel={sectionLabel}
					/>

					<LazySelect<EnrolledStudentMaintenanceItem>
						label={t('loads.studentSectionEnrollmentsMaintenance.edit.student')}
						placeholder={t('loads.studentSectionEnrollmentsMaintenance.edit.studentPlaceholder')}
						value={student ? { id: student.id, label: studentLabel(student) } : null}
						onChange={setStudent}
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
					<Button variant="primary" onClick={handleSubmit} disabled={!canSave} loading={saving}>
						{t('loads.studentSectionEnrollmentsMaintenance.create.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
