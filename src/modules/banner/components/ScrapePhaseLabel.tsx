'use client';

import { useI18n } from '@/providers';
import { SCRAPE_PHASE_LABEL_KEYS } from '../constants';
import type { ScraperPhase } from '../types';

interface ScrapePhaseLabelProps {
	phase: ScraperPhase | null;
}

export function ScrapePhaseLabel({ phase }: ScrapePhaseLabelProps) {
	const { t } = useI18n();

	if (!phase) return null;

	const labelKey = SCRAPE_PHASE_LABEL_KEYS[phase];
	return <span className="text-xs text-zinc-500">{labelKey ? t(labelKey) : phase}</span>;
}
