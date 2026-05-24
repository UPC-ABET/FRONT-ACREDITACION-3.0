'use client';

import { useEffect, useState } from 'react';
import { PARAMETER_CODES, TYPE_GROUP_CODES } from '../constants';
import { getIFCPrefill, getIFCView } from '../services/ifcsService';
import { getParameterByCode } from '../services/parametersService';
import { getTypesByGroupCode } from '../services/typesService';
import type { CriticalityOption, IFCField, IFCPrefill, IFCViewPayload } from '../services/types';

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

export function useIFCFormBootstrap(mode: IFCFormMode) {
	const [data, setData] = useState<IFCFormBootstrap | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const key = mode.kind === 'create' ? `c:${mode.chartId}:${mode.periodId}` : `e:${mode.ifcId}`;

	useEffect(() => {
		let alive = true;
		// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: hook auto-loads on mount and mode change
		setLoading(true);
		setError(null);

		(async () => {
			try {
				const [languages, ifcFields, criticalities, existing, prefillCreate] = await Promise.all([
					getParameterByCode<string[]>(PARAMETER_CODES.LANGUAGES),
					getParameterByCode<IFCField[]>(PARAMETER_CODES.IFC_FIELDS),
					getTypesByGroupCode(TYPE_GROUP_CODES.CRITICALITY),
					mode.kind === 'edit' ? getIFCView(mode.ifcId) : Promise.resolve(null),
					mode.kind === 'create'
						? getIFCPrefill(mode.chartId, mode.periodId)
						: Promise.resolve(null),
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

				if (alive) {
					setData({ languages, ifcFields, criticalities, prefill, existing });
				}
			} catch (e) {
				const message = e instanceof Error ? e.message : 'ifcs.error.bootstrapFailed';
				if (alive) setError(message);
			} finally {
				if (alive) setLoading(false);
			}
		})();

		return () => {
			alive = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	return { data, loading, error };
}
