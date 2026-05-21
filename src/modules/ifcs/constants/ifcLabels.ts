// Mirrors backend src/modules/core/types/constants/type-codes.ts — keep both in sync.
export const TYPE_CODES = {
	CHART_LEVEL_TYPE: {
		DEAN: 'TG902-T001',
		SCHOOL_DIRECTOR: 'TG902-T002',
		PROGRAM_COORDINATOR: 'TG902-T003',
		AREA_COORDINATOR: 'TG902-T004',
		SUBAREA_COORDINATOR: 'TG902-T005',
		COURSE_COORDINATOR: 'TG902-T006',
	},
	IFC_STATUS: {
		SAVED: 'TG701-T001',
		SUBMITTED: 'TG701-T002',
		APPROVED: 'TG701-T003',
		OBSERVED: 'TG701-T004',
		UNREGISTERED: 'TG701-T005',
	},
	ACTION_COMPLETENESS: {
		PENDING: 'TG1003-T001',
		IMPLEMENTED: 'TG1003-T002',
	},
	CRITICALITY: {
		CRITICAL: 'TG801-T001',
		WORRYING: 'TG801-T002',
		NORMAL: 'TG801-T003',
	},
} as const;

export const TYPE_GROUP_CODES = {
	CRITICALITY: 'TG801',
	PROGRAM_MODALITY: 'TG102',
} as const;

export const PARAMETER_CODES = {
	LANGUAGES: 'PARAMETER_LANGUAGES',
	IFC_FIELDS: 'PARAMETER_IFC_FIELDS',
} as const;

export const CRITICALITY_VARIANT: Record<string, 'default' | 'danger' | 'success' | 'outline'> = {
	[TYPE_CODES.CRITICALITY.CRITICAL]: 'danger',
	[TYPE_CODES.CRITICALITY.WORRYING]: 'default',
	[TYPE_CODES.CRITICALITY.NORMAL]: 'outline',
};

export const COMPLETENESS_VARIANT: Record<string, 'default' | 'danger' | 'success' | 'outline'> = {
	[TYPE_CODES.ACTION_COMPLETENESS.PENDING]: 'outline',
	[TYPE_CODES.ACTION_COMPLETENESS.IMPLEMENTED]: 'success',
};

export const LEVEL_LABELS: Record<string, { en: string; es: string }> = {
	[TYPE_CODES.CHART_LEVEL_TYPE.DEAN]: { en: "Dean's Office", es: 'Decanato' },
	[TYPE_CODES.CHART_LEVEL_TYPE.SCHOOL_DIRECTOR]: { en: 'School', es: 'Escuela' },
	[TYPE_CODES.CHART_LEVEL_TYPE.PROGRAM_COORDINATOR]: { en: 'Program', es: 'Carrera' },
	[TYPE_CODES.CHART_LEVEL_TYPE.AREA_COORDINATOR]: { en: 'Area', es: 'Área' },
	[TYPE_CODES.CHART_LEVEL_TYPE.SUBAREA_COORDINATOR]: { en: 'Subarea', es: 'Subárea' },
	[TYPE_CODES.CHART_LEVEL_TYPE.COURSE_COORDINATOR]: { en: 'Course', es: 'Curso' },
};

export const ORG_LABELS = {
	chart_incomplete: {
		en: 'The organization chart is incomplete or has not been uploaded yet. Please contact the administrator.',
		es: 'El organigrama está incompleto o aún no ha sido cargado. Por favor, contacte al administrador.',
	},
	period_label: { en: 'Period', es: 'Período' },
	status_label: { en: 'Status', es: 'Estado' },
} as const;
