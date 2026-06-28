'use client';

import { useCallback, useState } from 'react';
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	LazySelect,
} from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { enrolledStudentsService } from '@/modules/academic';
import type { EnrolledStudentMaintenanceItem } from '@/modules/academic';
import type { ArdInvitedStudent } from '../types';

const PAGE_SIZE = 20;

function studentLabel(student: EnrolledStudentMaintenanceItem): string {
	return `${student.studentCode} - ${student.firstName} ${student.lastName}`;
}

export function AddInvitedStudentDialog({
	open,
	onOpenChange,
	programId,
	existingEnrollmentStudentIds,
	onAdd,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	programId: number;
	existingEnrollmentStudentIds: number[];
	onAdd: (student: ArdInvitedStudent) => void;
}) {
	const { t } = useI18n();
	const [student, setStudent] = useState<EnrolledStudentMaintenanceItem | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleOpenChange = (next: boolean) => {
		if (!next) {
			setStudent(null);
			setError(null);
		}
		onOpenChange(next);
	};

	const loadStudents = useCallback(
		({ search, page }: { search: string; page: number }) =>
			enrolledStudentsService
				.maintenanceList({ search, page, pageSize: PAGE_SIZE, programId })
				.then((response) => ({
					items: response.data.items,
					totalPages: response.data.totalPages,
				})),
		[programId],
	);

	const handleAdd = () => {
		if (!student) return;
		if (existingEnrollmentStudentIds.includes(student.id)) {
			setError(t('ard.participants.invited.alreadyAdded'));
			return;
		}

		onAdd({
			enrollmentStudentId: student.id,
			studentCode: student.studentCode,
			studentFullName: `${student.firstName} ${student.lastName}`,
		});
		handleOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t('ard.participants.invited.dialogTitle')}</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					<LazySelect<EnrolledStudentMaintenanceItem>
						label={t('ard.participants.invited.studentLabel')}
						placeholder={t('ard.participants.invited.studentPlaceholder')}
						value={student ? { id: student.id, label: studentLabel(student) } : null}
						onChange={(next) => {
							setStudent(next);
							setError(null);
						}}
						loadPage={loadStudents}
						getId={(item) => item.id}
						getLabel={studentLabel}
						error={error ?? undefined}
					/>
				</div>

				<DialogFooter>
					<DialogClose render={<Button variant="surface">{t('dialog.close')}</Button>} />
					<Button onClick={handleAdd} disabled={!student}>
						{t('ard.participants.invited.add')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
