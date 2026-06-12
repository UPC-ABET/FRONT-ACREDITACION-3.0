'use client';

import { ProfessorsMaintenance } from '@/modules/academic';
import { OutcomesMaintenance } from '@/modules/accreditation';

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
		case 'TG1101-T001': // staff / docentes
			return <ProfessorsMaintenance />;
		case 'TG1101-T003': // outcomes
			return <OutcomesMaintenance />;
		default:
			return null;
	}
}
