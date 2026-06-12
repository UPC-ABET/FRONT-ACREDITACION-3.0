'use client';

import {
	EnrolledStudentsMaintenance,
	ProfessorsMaintenance,
	SectionsMaintenance,
} from '@/modules/academic';
import { OutcomesMaintenance } from '@/modules/accreditation';
import { TYPE_CODES } from '@/shared/constants';

interface UploadMaintenanceProps {
	typeCode: string;
}

/**
 * Renders the maintenance panel for an upload type, when one exists. Upload
 * types without a maintenance panel render nothing. Add new cases here as more
 * upload types gain maintenance support.
 */
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
		default:
			return null;
	}
}
