'use client';

import { useI18n } from '@/providers';
import { Card } from '@/shared/components';
import type { IFCInformationEntry } from '../../services/types';

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
			<section className="space-y-4">
				{entries.map((e) => (
					<div key={e.key}>
						<h3 className="text-sm font-semibold text-zinc-800">
							{e.label?.[lang] ?? e.label?.es ?? e.key}
						</h3>
						<p className="text-sm text-zinc-600 whitespace-pre-line">
							{e.value?.[lang] ?? e.value?.es ?? ''}
						</p>
					</div>
				))}
			</section>
		</Card>
	);
}
