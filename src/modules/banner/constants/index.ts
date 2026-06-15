import type { ScrapeRunStatus } from '../types';

export const SCRAPE_STATUS_COLORS: Record<ScrapeRunStatus, string> = {
	running: '#2563eb',
	completed: '#059669',
	partial: '#d97706',
	failed: '#dc2626',
	expired: '#dc2626',
};
