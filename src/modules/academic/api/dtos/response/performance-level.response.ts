import { AcademicPeriodResponse } from './academic-period.response';
import type { TypeItemResponse } from '@/modules/core/api/dtos/response';

export type PerformanceLevelResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	instrument_type_id: number;
	academic_period_id: number;
	name: { en: string; es: string };
	code: string;
	unique_value: string;
	min_score: string;
	max_score: string;
	max_value: string;
	academic_period: AcademicPeriodResponse;
	instrument_type?: TypeItemResponse;
};
