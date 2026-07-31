import { TYPE_CODES } from '@/shared/constants';
import esMessages from '@/language/locales/es.json';
import enMessages from '@/language/locales/en.json';

// Displayed label is fixed by code rather than trusting the type's stored `name`,
// so the UI stays correct even if backend seed data still has the old "Parcial"/"Final" text.
export const COMPETENCY_SCOPE_LABELS: Record<string, { en: string; es: string }> = {
	[TYPE_CODES.COMPETENCY_SCOPE.SINGLE]: {
		es: esMessages.rubrics.wizard.step2.competencyScope.single,
		en: enMessages.rubrics.wizard.step2.competencyScope.single,
	},
	[TYPE_CODES.COMPETENCY_SCOPE.MULTIPLE]: {
		es: esMessages.rubrics.wizard.step2.competencyScope.multiple,
		en: enMessages.rubrics.wizard.step2.competencyScope.multiple,
	},
};
