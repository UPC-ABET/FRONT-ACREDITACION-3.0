import { apiGet, ApiError } from '@/shared/lib';
import { ApiResponse } from '@/shared';
import type { SchoolSourceItem } from '@/shared/types';
import type { RawIfcSchool } from '../types';

export async function getIfcSchools(): Promise<SchoolSourceItem[]> {
	const envelope = await apiGet<ApiResponse<RawIfcSchool[]>>('/ifcs/schools');
	if (!envelope?.data) throw new ApiError(envelope?.message ?? 'ifcs.error.generic');
	return envelope.data.map((school) => ({
		id: Number(school.id),
		code: school.code,
		name: school.name,
	}));
}
