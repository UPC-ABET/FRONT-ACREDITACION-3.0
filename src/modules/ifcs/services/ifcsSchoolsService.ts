import { apiGet, ApiError } from '@/shared/lib';
import type { I18nText, SchoolSourceItem } from '@/shared/types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

interface RawIfcSchool {
	id: number | string;
	code: string;
	name: I18nText;
	facultyId?: number;
	facultyCode?: string | null;
	facultyName?: I18nText | null;
}

export async function getIfcSchools(academicPeriodId: number): Promise<SchoolSourceItem[]> {
	const envelope = await apiGet<Envelope<RawIfcSchool[]>>('/ifcs/schools', {
		headers: { 'X-Academic-Period-Id': String(academicPeriodId) },
	});
	if (!envelope?.data) throw new ApiError(envelope?.message ?? 'ifcs.error.generic');
	return envelope.data.map((school) => ({
		id: Number(school.id),
		code: school.code,
		name: school.name,
	}));
}
