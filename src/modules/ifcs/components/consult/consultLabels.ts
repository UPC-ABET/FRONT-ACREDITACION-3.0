export const CONSULT_LABELS = {
	pageTitle: { en: 'Findings', es: 'Hallazgos' },
	colCriticality: { en: 'Criticality', es: 'Criticidad' },
	colCode: { en: 'Code', es: 'Código' },
	colPeriod: { en: 'Academic Period', es: 'Período Académico' },
	colDescription: { en: 'Description', es: 'Descripción' },
	colActions: { en: 'Options', es: 'Opciones' },
	actionView: { en: 'View', es: 'Ver' },
	actionDelete: { en: 'Delete', es: 'Eliminar' },
	deleteModalTitle: { en: 'Delete this finding?', es: '¿Eliminar este hallazgo?' },
	deleteModalBody: {
		en: "This will also delete the finding's actions and its links to the IFC. This action cannot be undone.",
		es: 'También se eliminarán las acciones del hallazgo y sus enlaces al IFC. Esta acción no se puede deshacer.',
	},
	deleteModalConfirm: { en: 'Delete', es: 'Eliminar' },
	deleteModalCancel: { en: 'Cancel', es: 'Cancelar' },
	empty: { en: 'No findings in scope', es: 'No hay hallazgos en este alcance' },
	chartIncomplete: {
		en: 'The organization chart is incomplete or has not been uploaded yet. Please contact the administrator.',
		es: 'El organigrama está incompleto o aún no ha sido cargado. Por favor, contacte al administrador.',
	},
} as const;
