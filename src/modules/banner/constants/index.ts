import type { ScraperPhase, ScrapeRunStatus } from '../types';

export const SCRAPE_STATUS_COLORS: Record<ScrapeRunStatus, string> = {
	running: '#2563eb',
	completed: '#059669',
	partial: '#d97706',
	failed: '#dc2626',
	expired: '#dc2626',
};

// A lookup map, not a `t(`banner.run.phase.${phase}`)` template like the status label uses,
// so an unrecognized backend value misses the map and falls back to the raw string instead
// of an untranslated i18n key — see ScrapePhaseLabel.
export const SCRAPE_PHASE_LABEL_KEYS: Record<ScraperPhase, string> = {
	horario: 'banner.run.phase.horario',
	matricula: 'banner.run.phase.matricula',
	alumnosYNotas: 'banner.run.phase.alumnosYNotas',
};
