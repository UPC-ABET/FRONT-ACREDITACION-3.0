'use client';

import { useI18n } from '@/providers';
import { SubTitle, Title } from '@/shared/components';
import { PerformanceLevel } from '@/modules';

interface PerformanceLevelsSummaryProps {
	levels: PerformanceLevel[];
}

function formatScore(value: number): string {
	return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

export function PerformanceLevelsSummary({ levels }: PerformanceLevelsSummaryProps) {
	const { t, locale } = useI18n();

	const sorted = [...levels].sort((a, b) => {
		const av = a.uniqueValue ?? a.minValue;
		const bv = b.uniqueValue ?? b.minValue;
		return av - bv;
	});

	return (
		<section className="rounded-xl border border-zinc-200 bg-white p-5">
			<div className="mb-4">
				<Title
					title={t('rubrics.editor.performanceLevels.title')}
					className="[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-zinc-900"
				/>
				<SubTitle
					name={t('rubrics.editor.performanceLevels.helper')}
					className="mt-1 [&_h3]:text-xs [&_h3]:font-normal [&_h3]:text-zinc-500"
				/>
			</div>

			{!levels.length ? (
				<p className="text-sm text-zinc-500">{t('rubrics.editor.performanceLevels.empty')}</p>
			) : (
				<div className="flex flex-wrap gap-2">
					{sorted.map((level) => (
						<div
							key={level.id}
							className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs"
							style={{ backgroundColor: level.color ?? 'transparent' }}>
							<span className={`font-medium ${level.color ? 'text-white' : 'text-zinc-800'}`}>
								{level.name[locale]}
							</span>
							<span className={level.color ? 'text-white/50' : 'text-zinc-300'}>·</span>
							{level.uniqueValue != null ? (
								<span className={`font-semibold ${level.color ? 'text-white' : 'text-zinc-600'}`}>
									{formatScore(level.uniqueValue)}
								</span>
							) : (
								<span className={level.color ? 'text-white/80' : 'text-zinc-500'}>
									{formatScore(level.minValue)} – {formatScore(level.maxValue)}
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</section>
	);
}
