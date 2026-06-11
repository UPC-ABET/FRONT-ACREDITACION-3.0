'use client';

import { useMemo } from 'react';
import { CodeBracketIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import type { NotifyVar } from '../types';

type Props = {
	notifyVars: NotifyVar[];
	currentStatusCode: string | null;
};

export function VariableLegend({ notifyVars, currentStatusCode }: Props) {
	const { t, locale: lang } = useI18n();

	const visibleVars = useMemo(() => {
		if (!currentStatusCode) return notifyVars;
		return notifyVars.filter(
			(v) => v.validStatusCodes === null || v.validStatusCodes.includes(currentStatusCode),
		);
	}, [notifyVars, currentStatusCode]);

	if (visibleVars.length === 0) {
		return (
			<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm italic text-zinc-500">
				{t('admin.notify.legend.empty')}
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-zinc-200 bg-white">
			<div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/60 px-5 py-3">
				<CodeBracketIcon className="h-5 w-5 text-red-700" />
				<p className="text-sm font-semibold uppercase tracking-wider text-zinc-700">
					{t('admin.notify.legend.title')}
				</p>
			</div>
			<ul className="max-h-96 space-y-4 overflow-y-auto p-5">
				{visibleVars.map((v) => (
					<li key={v.var} className="space-y-1.5">
						<code className="inline-block rounded bg-red-50 px-2 py-1 font-mono text-sm font-semibold text-red-700">
							{v.var}
						</code>
						<p className="text-sm leading-relaxed text-zinc-700">
							{v.description?.[lang] ?? v.description?.es ?? ''}
						</p>
					</li>
				))}
			</ul>
		</div>
	);
}
