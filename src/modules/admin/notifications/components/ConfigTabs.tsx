'use client';

import { useMemo, useState } from 'react';
import { Tabs } from '@/shared';
import { useI18n } from '@/providers';
import type { CoreType, NotificationConfig } from '../types';
import { TRIGGER_FALLBACK_LABEL } from './adminLabels';
import { ConfigEditor } from './ConfigEditor';

type Props = {
	triggers: CoreType[];
	statuses: CoreType[];
	configs: NotificationConfig[];
};

function labelFor(c: CoreType, lang: string): string {
	const fallback = TRIGGER_FALLBACK_LABEL[c.code]?.[lang as 'es' | 'en'];
	return c.name?.[lang] ?? c.name?.es ?? fallback ?? c.code;
}

export function ConfigTabs({ triggers, statuses, configs }: Props) {
	const { t, locale: lang } = useI18n();

	const triggerTabs = useMemo(
		() => triggers.map((tr) => ({ id: String(tr.id), label: labelFor(tr, lang) })),
		[triggers, lang],
	);

	const statusItems = useMemo(
		() => statuses.map((s) => ({ id: String(s.id), label: labelFor(s, lang) })),
		[statuses, lang],
	);

	const [activeTriggerState, setActiveTrigger] = useState<string>('');
	const [activeStatusState, setActiveStatus] = useState<string>('');

	if (triggerTabs.length === 0 || statusItems.length === 0) {
		return null;
	}

	const activeTrigger = triggerTabs.find((t) => t.id === activeTriggerState)
		? activeTriggerState
		: triggerTabs[0].id;
	const activeStatus = statusItems.find((t) => t.id === activeStatusState)
		? activeStatusState
		: statusItems[0].id;

	const triggerId = Number(activeTrigger);
	const statusId = Number(activeStatus);
	const statusCode = statuses.find((s) => Number(s.id) === statusId)?.code ?? null;

	const existing =
		configs.find(
			(c) => Number(c.triggerTypeId) === triggerId && Number(c.ifcStatusTypeId) === statusId,
		) ?? null;

	return (
		<div className="space-y-6">
			<Tabs tabs={triggerTabs} activeTab={activeTrigger} onChange={setActiveTrigger} />

			<div className="space-y-2">
				<p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
					{t('ifcs.table.status')}
				</p>
				<Tabs
					tabs={statusItems}
					activeTab={activeStatus}
					onChange={setActiveStatus}
					ariaLabel={t('ifcs.table.status')}
				/>
			</div>

			<ConfigEditor
				key={`${triggerId}-${statusId}-${existing?.id ?? 'new'}-${existing?.isActive ?? 'na'}`}
				triggerTypeId={triggerId}
				statusTypeId={statusId}
				statusCode={statusCode ?? ''}
				existingConfig={existing}
			/>
		</div>
	);
}
