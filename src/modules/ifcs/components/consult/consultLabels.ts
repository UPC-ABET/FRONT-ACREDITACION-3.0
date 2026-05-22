export const CONSULT_LABELS = {
	page_title: { en: 'Findings', es: 'Hallazgos' },
	col_criticality: { en: 'Criticality', es: 'Criticidad' },
	col_code: { en: 'Code', es: 'Código' },
	col_period: { en: 'Academic Period', es: 'Período Académico' },
	col_description: { en: 'Description', es: 'Descripción' },
	col_actions: { en: 'Options', es: 'Opciones' },
	action_view: { en: 'View', es: 'Ver' },
	action_delete: { en: 'Delete', es: 'Eliminar' },
	delete_modal_title: { en: 'Delete this finding?', es: '¿Eliminar este hallazgo?' },
	delete_modal_body: {
		en: "This will also delete the finding's actions and its links to the IFC. This action cannot be undone.",
		es: 'También se eliminarán las acciones del hallazgo y sus enlaces al IFC. Esta acción no se puede deshacer.',
	},
	delete_modal_confirm: { en: 'Delete', es: 'Eliminar' },
	delete_modal_cancel: { en: 'Cancel', es: 'Cancelar' },
	empty: { en: 'No findings in scope', es: 'No hay hallazgos en este alcance' },
	chart_incomplete: {
		en: 'The organization chart is incomplete or has not been uploaded yet. Please contact the administrator.',
		es: 'El organigrama está incompleto o aún no ha sido cargado. Por favor, contacte al administrador.',
	},
} as const;
