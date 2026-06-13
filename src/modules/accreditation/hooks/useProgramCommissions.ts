'use client';

import { useQuery } from '@tanstack/react-query';
import { programCommissionsService } from '../services';

// academicPeriodId is part of the key so a period switch re-fetches; it is sent to the API
// as the X-Academic-Period-Id header, not a query param.
export function useOutcomeCommissionOptions(
	programId: number | null,
	academicPeriodId: number | null,
) {
	return useQuery({
		queryKey: ['program-commissions', 'commission-options', programId, academicPeriodId] as const,
		queryFn: () =>
			programCommissionsService
				.commissionOptions(programId!)
				.then((response) => response.data ?? []),
		enabled: programId != null && academicPeriodId != null,
		staleTime: Infinity,
	});
}
