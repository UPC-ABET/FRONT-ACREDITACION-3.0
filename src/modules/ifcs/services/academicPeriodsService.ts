import { apiPost, ApiError } from '@/shared/lib';
import type { AcademicPeriod } from './types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export interface AcademicPeriodFilters {
	modality_type_id: number;
	is_active?: boolean;
}

export async function getAcademicPeriodsByFilters(
	filters: AcademicPeriodFilters,
): Promise<AcademicPeriod[]> {
	const envelope = await apiPost<Envelope<AcademicPeriod[]>>(
		'/academic-periods/get-by-filters',
		filters,
	);
	if (!envelope?.data) throw new ApiError('academicPeriods.error.generic');

	// Newest period first (codes like "202502" sort lexicographically).
	return envelope.data.slice().sort((a, b) => b.code.localeCompare(a.code));
}
