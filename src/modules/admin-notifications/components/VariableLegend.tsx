'use client';

import { useMemo } from 'react';
import { useI18n } from '@/providers';
import type { NotifyVar } from '../services/types';

type Props = {
	notifyVars: NotifyVar[];
	currentStatusCode: string | null;
};

export function VariableLegend({ notifyVars, currentStatusCode }: Props) {
	const { t, locale: lang } = useI18n();

	const visibleVars = useMemo(() => {
		if (!currentStatusCode) return notifyVars;
		return notifyVars.filter(
			(v) =>
				v.valid_status_codes === null || v.valid_status_codes.includes(currentStatusCode),
		);
	}, [notifyVars, currentStatusCode]);

	if (visibleVars.length === 0) {
		return (
			<div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500">
				{t('admin.notify.legend.empty')}
			</div>
		);
	}

	return (
		<div className="rounded border border-zinc-200 bg-zinc-50 p-3">
			<p className="mb-2 text-xs font-medium text-zinc-700">
				{t('admin.notify.legend.title')}
			</p>
			<ul className="space-y-1 text-xs">
				{visibleVars.map((v) => (
					<li key={v.var} className="flex flex-col gap-0.5">
						<code className="font-mono text-red-700">{v.var}</code>
						<span className="text-zinc-600">
							{v.description?.[lang] ?? v.description?.es ?? ''}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
