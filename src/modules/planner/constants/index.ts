import type { PlannerScrapeRunStatus } from '../types';

export const PLANNER_SCRAPE_STATUS_COLORS: Record<PlannerScrapeRunStatus, string> = {
	running: '#2563eb',
	completed: '#059669',
	partial: '#d97706',
	failed: '#dc2626',
	expired: '#dc2626',
};
