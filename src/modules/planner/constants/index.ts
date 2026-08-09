import type { PlannerScrapeRunStatus, PlannerSessionStatusValue } from '../types';

export const PLANNER_SCRAPE_STATUS_COLORS: Record<PlannerScrapeRunStatus, string> = {
	running: '#2563eb',
	completed: '#059669',
	partial: '#d97706',
	failed: '#dc2626',
	expired: '#dc2626',
};

export const PLANNER_SESSION_STATUS_COLORS: Record<PlannerSessionStatusValue, string> = {
	active: '#059669',
	expiring: '#d97706',
	expired: '#dc2626',
	not_configured: '#71717a',
};

export const PLANNER_CREDENTIALS_NOT_CONFIGURED_KEY =
	'error.planner.credentialsNotConfigured' as const;
