'use client';

import { useI18n } from '@/providers';
import { PLANNER_SCRAPE_PHASE_LABEL_KEYS } from '../constants';
import type { PlannerScraperPhase } from '../types';

interface PlannerScrapePhaseLabelProps {
	phase: PlannerScraperPhase | null;
}

export function PlannerScrapePhaseLabel({ phase }: PlannerScrapePhaseLabelProps) {
	const { t } = useI18n();

	if (!phase) return null;

	const labelKey = PLANNER_SCRAPE_PHASE_LABEL_KEYS[phase];
	return <span className="text-xs text-zinc-500">{labelKey ? t(labelKey) : phase}</span>;
}
