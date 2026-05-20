'use client';

import { useMemo, useState } from 'react';
import { Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import type {
	CoreType,
	NotificationConfig,
	NotifyVar,
} from '../services/types';
import { TRIGGER_FALLBACK_LABEL } from './adminLabels';
import { ConfigEditor } from './ConfigEditor';

type Props = {
	periodId: number;
	triggers: CoreType[];
	statuses: CoreType[];
	chartLevels: CoreType[];
	notifyVars: NotifyVar[];
	configs: NotificationConfig[];
	onSaved: () => void;
	onError: (msg: string) => void;
	onSuccess: (msg: string) => void;
};

function labelFor(c: CoreType, lang: string): string {
	const fallback = TRIGGER_FALLBACK_LABEL[c.code]?.[lang as 'es' | 'en'];
	return c.name?.[lang] ?? c.name?.es ?? fallback ?? c.code;
}

export function ConfigTabs({
	periodId,
	triggers,
	statuses,
	chartLevels,
	notifyVars,
	configs,
	onSaved,
	onError,
	onSuccess,
}: Props) {
	const { locale: lang } = useI18n();

	const triggerTabs = useMemo(
		() => triggers.map((tr) => ({ id: String(tr.id), label: labelFor(tr, lang) })),
		[triggers, lang],
	);

	const statusTabs = useMemo(
		() => statuses.map((s) => ({ id: String(s.id), label: labelFor(s, lang) })),
		[statuses, lang],
	);

	const [activeTriggerState, setActiveTrigger] = useState<string>('');
	const [activeStatusState, setActiveStatus] = useState<string>('');

	if (triggerTabs.length === 0 || statusTabs.length === 0) {
		return null;
	}

	const activeTrigger = triggerTabs.find((t) => t.id === activeTriggerState)
		? activeTriggerState
		: triggerTabs[0].id;
	const activeStatus = statusTabs.find((t) => t.id === activeStatusState)
		? activeStatusState
		: statusTabs[0].id;

	const triggerId = Number(activeTrigger);
	const statusId = Number(activeStatus);
	const statusCode = statuses.find((s) => Number(s.id) === statusId)?.code ?? null;

	const existing =
		configs.find(
			(c) =>
				Number(c.trigger_type_id) === triggerId &&
				Number(c.ifc_status_type_id) === statusId,
		) ?? null;

	return (
		<div className="space-y-6">
			<Tabs tabs={triggerTabs} activeTab={activeTrigger} onChange={setActiveTrigger} />
			<Tabs tabs={statusTabs} activeTab={activeStatus} onChange={setActiveStatus} />

			<ConfigEditor
				key={`${triggerId}-${statusId}`}
				periodId={periodId}
				triggerTypeId={triggerId}
				statusTypeId={statusId}
				statusCode={statusCode ?? ''}
				chartLevels={chartLevels}
				notifyVars={notifyVars}
				existingConfig={existing}
				onSaved={onSaved}
				onError={onError}
				onSuccess={onSuccess}
			/>
		</div>
	);
}
