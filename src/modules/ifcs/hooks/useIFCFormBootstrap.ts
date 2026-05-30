'use client';

import { useQuery } from '@tanstack/react-query';
import {
	getParameterByCode,
	getTypesByGroupCode,
	PARAMETER_CODES,
	TYPE_GROUP_CODES,
} from '@/modules/core';
import { getIFCPrefill, getIFCView } from '../services/ifcsService';
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
				getTypesByGroupCode(TYPE_GROUP_CODES.FINDING_CRITICALITY),
				mode.kind === 'edit' ? getIFCView(mode.ifcId) : Promise.resolve(null),
				mode.kind === 'create' ? getIFCPrefill(mode.chartId, mode.periodId) : Promise.resolve(null),
			]);

			const prefill: IFCPrefill =
				prefillCreate ??
				({
					courseName: existing!.ifc.courseName,
					courseLearningOutcome: existing!.ifc.courseLearningOutcome,
					areaLabel: existing!.ifc.areaLabel,
					subareaLabel: existing!.ifc.subareaLabel,
					academicPeriodCode: existing!.ifc.academicPeriodCode,
					coordinatorCode: existing!.ifc.coordinator.code,
					coordinatorName: existing!.ifc.coordinator.name,
					coordinatorUserId: existing!.ifc.coordinator.userId,
					outcomeCourseResult: existing!.outcomeCourseResult,
					previousActions: existing!.previousActions ?? [],
				} as IFCPrefill);

			return { languages, ifcFields, criticalities, prefill, existing };
		},
	});
}
