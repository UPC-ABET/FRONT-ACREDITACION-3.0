'use client';

import { useQuery } from '@tanstack/react-query';
import { PARAMETER_CODES, TYPE_GROUP_CODES } from '../constants';
import { getIFCPrefill, getIFCView } from '../services/ifcsService';
import { getParameterByCode, getTypesByGroupCode } from '@/modules/core';
import type { CriticalityOption, IFCField, IFCPrefill, IFCViewPayload } from '../types';

export type IFCFormMode =
	| { kind: 'create'; chartId: number; periodId: number }
	| { kind: 'edit'; ifcId: number };

export interface IFCFormBootstrap {
	languages: string[];
	ifcFields: IFCField[];
	criticalities: CriticalityOption[];
	prefill: IFCPrefill;
	existing: IFCViewPayload | null;
}

export const ifcFormBootstrapQueryKeys = {
	all: ['ifc-form-bootstrap'] as const,
	byMode: (key: string) => ['ifc-form-bootstrap', key] as const,
};

export function useIFCFormBootstrap(mode: IFCFormMode) {
	const key = mode.kind === 'create' ? `c:${mode.chartId}:${mode.periodId}` : `e:${mode.ifcId}`;

	return useQuery({
		queryKey: ifcFormBootstrapQueryKeys.byMode(key),
		queryFn: async (): Promise<IFCFormBootstrap> => {
			const [languages, ifcFields, criticalities, existing, prefillCreate] = await Promise.all([
				getParameterByCode<string[]>(PARAMETER_CODES.LANGUAGES),
				getParameterByCode<IFCField[]>(PARAMETER_CODES.IFC_FIELDS),
				getTypesByGroupCode(TYPE_GROUP_CODES.CRITICALITY),
				mode.kind === 'edit' ? getIFCView(mode.ifcId) : Promise.resolve(null),
				mode.kind === 'create' ? getIFCPrefill(mode.chartId, mode.periodId) : Promise.resolve(null),
			]);

			const prefill: IFCPrefill =
				prefillCreate ??
				({
					course_name: existing!.ifc.course_name,
					course_learning_outcome: existing!.ifc.course_learning_outcome,
					area_label: existing!.ifc.area_label,
					subarea_label: existing!.ifc.subarea_label,
					academic_period_code: existing!.ifc.academic_period_code,
					coordinator_code: existing!.ifc.coordinator.code,
					coordinator_name: existing!.ifc.coordinator.name,
					coordinator_user_id: existing!.ifc.coordinator.user_id,
					outcome_course_result: existing!.outcome_course_result,
					previous_actions: existing!.previous_actions ?? [],
				} as IFCPrefill);

			return { languages, ifcFields, criticalities, prefill, existing };
		},
	});
}
