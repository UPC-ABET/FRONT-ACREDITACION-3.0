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
} as const;

export const LEVEL_LABELS: Record<string, { en: string; es: string }> = {
	[TYPE_CODES.CHART_LEVEL_TYPE.DEAN]: { en: "Dean's Office", es: 'Decanato' },
	[TYPE_CODES.CHART_LEVEL_TYPE.SCHOOL_DIRECTOR]: { en: 'School', es: 'Escuela' },
	[TYPE_CODES.CHART_LEVEL_TYPE.PROGRAM_COORDINATOR]: { en: 'Program', es: 'Carrera' },
	[TYPE_CODES.CHART_LEVEL_TYPE.AREA_COORDINATOR]: { en: 'Area', es: 'Área' },
	[TYPE_CODES.CHART_LEVEL_TYPE.SUBAREA_COORDINATOR]: { en: 'Subarea', es: 'Subárea' },
	[TYPE_CODES.CHART_LEVEL_TYPE.COURSE_COORDINATOR]: { en: 'Course', es: 'Curso' },
};

// Status filter options — value is the type code (or the 'ALL' sentinel).
export const STATUS_OPTIONS = [
	{ value: 'ALL', label: { en: 'All', es: 'Todos' } },
	{ value: TYPE_CODES.IFC_STATUS.UNREGISTERED, label: { en: 'Unregistered', es: 'Sin Registro' } },
	{ value: TYPE_CODES.IFC_STATUS.SAVED, label: { en: 'Saved', es: 'Guardado' } },
	{ value: TYPE_CODES.IFC_STATUS.SUBMITTED, label: { en: 'Submitted', es: 'Enviado' } },
	{ value: TYPE_CODES.IFC_STATUS.APPROVED, label: { en: 'Approved', es: 'Aprobado' } },
	{ value: TYPE_CODES.IFC_STATUS.OBSERVED, label: { en: 'Observed', es: 'Observado' } },
] as const;

export const ORG_LABELS = {
	chart_incomplete: {
		en: 'The organization chart is incomplete or has not been uploaded yet. Please contact the administrator.',
		es: 'El organigrama está incompleto o aún no ha sido cargado. Por favor, contacte al administrador.',
	},
	period_label: { en: 'Period', es: 'Período' },
	status_label: { en: 'Status', es: 'Estado' },
} as const;
