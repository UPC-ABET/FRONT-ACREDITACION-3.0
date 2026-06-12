'use client';

import {
	EnrolledStudentsMaintenance,
	ProfessorsMaintenance,
	SectionsMaintenance,
	StudentSectionEnrollmentsMaintenance,
	StudyPlansMaintenance,
} from '@/modules/academic';
import { OutcomesMaintenance } from '@/modules/accreditation';
import { TYPE_CODES } from '@/shared/constants';

interface UploadMaintenanceProps {
	typeCode: string;
}

export default function UploadMaintenance({ typeCode }: UploadMaintenanceProps) {
	switch (typeCode) {
		case TYPE_CODES.UPLOAD_TYPE.STAFF:
			return <ProfessorsMaintenance />;
		case TYPE_CODES.UPLOAD_TYPE.OUTCOMES:
			return <OutcomesMaintenance />;
		case TYPE_CODES.UPLOAD_TYPE.SECTIONS:
			return <SectionsMaintenance />;
		case TYPE_CODES.UPLOAD_TYPE.ENROLLED_STUDENTS:
			return <EnrolledStudentsMaintenance />;
		case TYPE_CODES.UPLOAD_TYPE.STUDENT_SECTIONS:
			return <StudentSectionEnrollmentsMaintenance />;
		case TYPE_CODES.UPLOAD_TYPE.STUDY_PLANS:
			return <StudyPlansMaintenance />;
		default:
			return null;
	}
}
