'use client';

import { useCallback, useState } from 'react';
import { applyAction, applyFinding, initFormState } from '../components/form/formState';
import type {
	FormAction,
	FormFinding,
	I18nText,
	IFCFormState,
	IFCViewPayload,
} from '../services/types';

export function useIFCFormState(existing: IFCViewPayload | null) {
	const [state, setState] = useState<IFCFormState>(() => initFormState(existing));

	const addFinding = useCallback(() => setState((s) => applyFinding.add(s)), []);
	const updateFinding = useCallback(
		(tempId: string, patch: Partial<FormFinding>) =>
			setState((s) => applyFinding.update(s, tempId, patch)),
		[],
	);
	const deleteFinding = useCallback(
		(tempId: string) => setState((s) => applyFinding.delete(s, tempId)),
		[],
	);
	const addAction = useCallback(() => setState((s) => applyAction.add(s)), []);
	const updateAction = useCallback(
		(tempId: string, patch: Partial<FormAction>) =>
			setState((s) => applyAction.update(s, tempId, patch)),
		[],
	);
	const deleteAction = useCallback(
		(tempId: string) => setState((s) => applyAction.delete(s, tempId)),
		[],
	);
	const setInformation = useCallback(
		(key: string, value: I18nText) =>
			setState((s) => ({ ...s, information: { ...s.information, [key]: value } })),
		[],
	);

	return {
		state,
		addFinding,
		updateFinding,
		deleteFinding,
		addAction,
		updateAction,
		deleteAction,
		setInformation,
	};
}
