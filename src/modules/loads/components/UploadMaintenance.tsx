'use client';

import {
	CourseOutcomeMappingMaintenance,
	EnrolledStudentsMaintenance,
	ProfessorsMaintenance,
	SectionsMaintenance,
	StudentSectionEnrollmentsMaintenance,
	StudyPlansMaintenance,
} from '@/modules/academic';
import { OutcomesMaintenance } from '@/modules/accreditation';
import { OrganizationChartMaintenance } from '@/modules/charts';
import { TYPE_CODES } from '@/shared/constants';

interface UploadMaintenanceProps {
	typeCode: string;
}

const MAINTENANCE_TYPE_CODES = new Set<string>([
	TYPE_CODES.UPLOAD_TYPE.STAFF,
	TYPE_CODES.UPLOAD_TYPE.OUTCOMES,
	TYPE_CODES.UPLOAD_TYPE.SECTIONS,
	TYPE_CODES.UPLOAD_TYPE.ENROLLED_STUDENTS,
	TYPE_CODES.UPLOAD_TYPE.STUDENT_SECTIONS,
	TYPE_CODES.UPLOAD_TYPE.STUDY_PLANS,
	TYPE_CODES.UPLOAD_TYPE.ARTICULATION,
	TYPE_CODES.UPLOAD_TYPE.CHARTS,
]);

/** Whether the given upload type has a maintenance view (editable table). */
export function hasUploadMaintenance(typeCode: string): boolean {
	return MAINTENANCE_TYPE_CODES.has(typeCode);
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
		case TYPE_CODES.UPLOAD_TYPE.ARTICULATION:
			return <CourseOutcomeMappingMaintenance />;
		case TYPE_CODES.UPLOAD_TYPE.CHARTS:
			return <OrganizationChartMaintenance />;
		default:
			return null;
	}
}
