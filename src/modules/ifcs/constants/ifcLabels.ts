import { TYPE_CODES } from '@/shared/constants';

export const LEVEL_LABELS: Record<string, { en: string; es: string }> = {
	[TYPE_CODES.CHART_LEVEL_TYPE.DEAN]: { en: "Dean's Office", es: 'Decanato' },
	[TYPE_CODES.CHART_LEVEL_TYPE.SCHOOL_DIRECTOR]: { en: 'School', es: 'Escuela' },
	[TYPE_CODES.CHART_LEVEL_TYPE.PROGRAM_COORDINATOR]: { en: 'Program', es: 'Carrera' },
	[TYPE_CODES.CHART_LEVEL_TYPE.AREA_COORDINATOR]: { en: 'Area', es: 'Área' },
	[TYPE_CODES.CHART_LEVEL_TYPE.SUBAREA_COORDINATOR]: { en: 'Subarea', es: 'Subárea' },
	[TYPE_CODES.CHART_LEVEL_TYPE.COURSE_COORDINATOR]: { en: 'Course', es: 'Curso' },
};

export const ORG_LABELS = {
	chartIncomplete: {
		en: 'The organization chart is incomplete or has not been uploaded yet. Please contact the administrator.',
		es: 'El organigrama está incompleto o aún no ha sido cargado. Por favor, contacte al administrador.',
	},
	periodLabel: { en: 'Period', es: 'Período' },
	statusLabel: { en: 'Status', es: 'Estado' },
} as const;
