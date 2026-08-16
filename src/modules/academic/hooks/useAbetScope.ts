'use client';

import { useMemo } from 'react';
import { useABET } from '@/providers';
import type { AbetScope } from './queryKeys';

/**
 * The active school / period / modality. These travel as request headers, not as query
 * params, so every query whose response depends on them MUST carry the scope in its key —
 * otherwise a top-bar switch serves the previous scope's cache. Hooks call this internally;
 * call sites do not pass the scope.
 */
export function useAbetScope(): AbetScope {
	const { schoolId, academicPeriodId, modalityTypeId } = useABET();
	return useMemo(
		() => ({ schoolId, academicPeriodId, modalityTypeId }),
		[schoolId, academicPeriodId, modalityTypeId],
	);
}
