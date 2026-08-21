import type {
	PlannerScraperPhase,
	PlannerScrapeRunStatus,
	PlannerSessionStatusValue,
} from '../types';

export const PLANNER_SCRAPE_STATUS_COLORS: Record<PlannerScrapeRunStatus, string> = {
	running: '#2563eb',
	completed: '#059669',
	partial: '#d97706',
	failed: '#dc2626',
	expired: '#dc2626',
};

// A lookup map, not a `t(`planner.run.phase.${phase}`)` template like the status label uses,
// so an unrecognized backend value misses the map and falls back to the raw string instead
// of an untranslated i18n key — see PlannerScrapePhaseLabel.
export const PLANNER_SCRAPE_PHASE_LABEL_KEYS: Record<PlannerScraperPhase, string> = {
	secciones: 'planner.run.phase.secciones',
	evaluaciones: 'planner.run.phase.evaluaciones',
	notas: 'planner.run.phase.notas',
};

export const PLANNER_SESSION_STATUS_COLORS: Record<PlannerSessionStatusValue, string> = {
	active: '#059669',
	expiring: '#d97706',
	expired: '#dc2626',
	not_configured: '#71717a',
};

export const PLANNER_CREDENTIALS_NOT_CONFIGURED_KEY =
	'error.planner.credentialsNotConfigured' as const;
