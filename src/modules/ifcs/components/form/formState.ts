import type {
	FormAction,
	FormFinding,
	I18nText,
	IFCFormState,
	IFCViewPayload,
	PreviousAction,
} from '../../types';

function newTempId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function seedPreviousActions(rows: PreviousAction[]): Record<number, I18nText | null> {
	const out: Record<number, I18nText | null> = {};
	for (const p of rows ?? []) {
		out[p.findingActionId] = p.evidences;
	}
	return out;
}

export function initFormState(
	existing: IFCViewPayload | null,
	prefillPreviousActions: PreviousAction[] = [],
): IFCFormState {
	if (!existing) {
		return {
			information: {},
			findings: [],
			actions: [],
			deletedFindingIds: [],
			deletedActionIds: [],
			previousActions: seedPreviousActions(prefillPreviousActions),
		};
	}

	const findings: FormFinding[] = existing.findings.map((f) => ({
		tempId: newTempId(),
		id: Number(f.id),
		description: f.description,
		criticalityCode: f.criticality.code,
	}));

	const tempIdByDbId = new Map<number, string>(findings.map((f) => [f.id!, f.tempId]));

	const actions: FormAction[] = existing.findings.flatMap((f) =>
		f.actions.map((a) => ({
			tempId: newTempId(),
			id: Number(a.id),
			description: a.description,
			findingTempId: tempIdByDbId.get(Number(f.id))!,
		})),
	);

	const information: Record<string, I18nText> = {};
	for (const [k, v] of Object.entries(existing.ifc.information ?? {})) {
		if (v && typeof v === 'object') {
			const entry = v as { value?: I18nText } & Partial<I18nText>;
			if (entry.value && typeof entry.value === 'object') {
				information[k] = entry.value;
			} else if ('en' in entry || 'es' in entry) {
				information[k] = entry as I18nText;
			}
		}
	}

	return {
		information,
		findings,
		actions,
		deletedFindingIds: [],
		deletedActionIds: [],
		previousActions: seedPreviousActions(existing.previousActions ?? []),
	};
}

export const applyFinding = {
	add(state: IFCFormState): IFCFormState {
		const finding: FormFinding = {
			tempId: newTempId(),
			id: null,
			description: {},
			criticalityCode: '',
		};
		return { ...state, findings: [...state.findings, finding] };
	},
	update(state: IFCFormState, tempId: string, patch: Partial<FormFinding>): IFCFormState {
		return {
			...state,
			findings: state.findings.map((f) => (f.tempId === tempId ? { ...f, ...patch } : f)),
		};
	},
	delete(state: IFCFormState, tempId: string): IFCFormState {
		const target = state.findings.find((f) => f.tempId === tempId);
		if (!target) return state;

		const droppedActions = state.actions.filter((a) => a.findingTempId === tempId);
		const droppedActionDbIds = droppedActions
			.map((a) => a.id)
			.filter((id): id is number => id !== null);

		return {
			...state,
			findings: state.findings.filter((f) => f.tempId !== tempId),
			actions: state.actions.filter((a) => a.findingTempId !== tempId),
			deletedFindingIds:
				target.id !== null ? [...state.deletedFindingIds, target.id] : state.deletedFindingIds,
			deletedActionIds: [...state.deletedActionIds, ...droppedActionDbIds],
		};
	},
};

export const applyPreviousAction = {
	updateEvidence(
		state: IFCFormState,
		findingActionId: number,
		evidences: I18nText | null,
	): IFCFormState {
		return {
			...state,
			previousActions: { ...state.previousActions, [findingActionId]: evidences },
		};
	},
};

export const applyAction = {
	add(state: IFCFormState): IFCFormState {
		const action: FormAction = {
			tempId: newTempId(),
			id: null,
			description: {},
			findingTempId: state.findings[0]?.tempId ?? '',
		};
		return { ...state, actions: [...state.actions, action] };
	},
	update(state: IFCFormState, tempId: string, patch: Partial<FormAction>): IFCFormState {
		return {
			...state,
			actions: state.actions.map((a) => (a.tempId === tempId ? { ...a, ...patch } : a)),
		};
	},
	delete(state: IFCFormState, tempId: string): IFCFormState {
		const target = state.actions.find((a) => a.tempId === tempId);
		if (!target) return state;

		return {
			...state,
			actions: state.actions.filter((a) => a.tempId !== tempId),
			deletedActionIds:
				target.id !== null ? [...state.deletedActionIds, target.id] : state.deletedActionIds,
		};
	},
};
