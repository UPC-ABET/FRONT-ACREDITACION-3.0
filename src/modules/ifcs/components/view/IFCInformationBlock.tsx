'use client';

import { useI18n } from '@/providers';
import { Card } from '@/shared/components';
import type { IFCInformationEntry } from '../../types';

type Props = { information: Record<string, unknown> };

export function IFCInformationBlock({ information }: Props) {
	const { locale: lang } = useI18n();
	if (!information || Object.keys(information).length === 0) return null;

	const entries = Object.entries(information as Record<string, IFCInformationEntry>)
		.map(([key, e]) => ({ key, ...e }))
		.filter((e) => e?.value?.[lang] || e?.value?.es || e?.value?.en)
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	if (entries.length === 0) return null;

	return (
		<Card>
			<dl className="space-y-6">
				{entries.map((e, idx) => (
					<div key={e.key} className={idx > 0 ? 'border-t border-zinc-100 pt-6' : undefined}>
						<dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
							{e.label?.[lang] ?? e.label?.es ?? e.key}
						</dt>
						<dd className="mt-2 whitespace-pre-line text-base leading-relaxed text-zinc-800">
							{e.value?.[lang] ?? e.value?.es ?? ''}
						</dd>
					</div>
				))}
			</dl>
		</Card>
	);
}
