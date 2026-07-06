import { TYPE_CODES } from '@/shared/constants';

// Displayed label is fixed by code rather than trusting the type's stored `name`,
// so the UI stays correct even if backend seed data still has the old "Parcial"/"Final" text.
export const COMPETENCY_SCOPE_LABELS: Record<string, { en: string; es: string }> = {
	[TYPE_CODES.COMPETENCY_SCOPE.SINGLE]: { es: 'Única competencia', en: 'Single competency' },
	[TYPE_CODES.COMPETENCY_SCOPE.MULTIPLE]: { es: 'Múltiple competencia', en: 'Multiple competency' },
};
