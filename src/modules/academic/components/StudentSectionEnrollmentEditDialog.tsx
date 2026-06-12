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

function CurrentValue({ label, value }: { label: string; value: string }) {
	return (
		<p className="mt-1 text-xs text-zinc-500">
			{label}: <span className="font-medium text-zinc-700">{value || '—'}</span>
		</p>
	);
}

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

	const [section, setSection] = useState<CourseSectionMaintenanceItem | null>(null);
	const [student, setStudent] = useState<EnrolledStudentMaintenanceItem | null>(null);

	const loadSections = useCallback(
		({ search, page }: { search: string; page: number }) =>
			courseSectionsService.maintenanceList({ search, page, pageSize: PAGE_SIZE }).then((response) => ({
				items: response.data.items,
				totalPages: response.data.totalPages,
			})),
		[],
	);

	const loadStudents = useCallback(
		({ search, page }: { search: string; page: number }) =>
			enrolledStudentsService.maintenanceList({ search, page, pageSize: PAGE_SIZE }).then((response) => ({
				items: response.data.items,
				totalPages: response.data.totalPages,
			})),
		[],
	);

	const canSave = (section != null || student != null) && !saving;

	const handleSubmit = () => {
		const body: StudentSectionEnrollmentMaintenanceUpdate = {};
		if (section) body.courseSectionId = section.id;
		if (student) body.enrolledStudentId = student.id;
		onSave(body);
	};

	const currentLabel = t('loads.studentSectionEnrollmentsMaintenance.edit.current');

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t('loads.studentSectionEnrollmentsMaintenance.edit.title')}</DialogTitle>
					<DialogDescription>
						{t('loads.studentSectionEnrollmentsMaintenance.edit.subtitle')}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<LazySelect<CourseSectionMaintenanceItem>
							label={t('loads.studentSectionEnrollmentsMaintenance.edit.section')}
							placeholder={t('loads.studentSectionEnrollmentsMaintenance.edit.sectionPlaceholder')}
							value={section ? { id: section.id, label: sectionLabel(section) } : null}
							onChange={setSection}
							loadPage={loadSections}
							getId={(sectionItem) => sectionItem.id}
							getLabel={sectionLabel}
						/>
						<CurrentValue
							label={currentLabel}
							value={`${item.courseCode} — ${item.sectionCode}`}
						/>
					</div>

					<div>
						<LazySelect<EnrolledStudentMaintenanceItem>
							label={t('loads.studentSectionEnrollmentsMaintenance.edit.student')}
							placeholder={t('loads.studentSectionEnrollmentsMaintenance.edit.studentPlaceholder')}
							value={student ? { id: student.id, label: studentLabel(student) } : null}
							onChange={setStudent}
							loadPage={loadStudents}
							getId={(studentItem) => studentItem.id}
							getLabel={studentLabel}
						/>
						<CurrentValue
							label={currentLabel}
							value={`${item.studentCode} — ${item.studentFirstName} ${item.studentLastName}`}
						/>
					</div>

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
