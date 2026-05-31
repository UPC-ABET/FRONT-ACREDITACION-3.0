import type { PeriodModalityCode } from '../types';

export const MODALITY_LABEL_KEYS: Record<PeriodModalityCode, string> = {
	REGULAR: 'loadsSetup.period.modality.regular',
	EPE: 'loadsSetup.period.modality.epe',
};

export const STAGE_LABEL_KEYS = {
	PRE_ENROLL: 'uploads.canvas.stage.preEnroll',
	START_TERM: 'uploads.canvas.stage.startTerm',
	END_TERM: 'uploads.canvas.stage.endTerm',
} as const;
