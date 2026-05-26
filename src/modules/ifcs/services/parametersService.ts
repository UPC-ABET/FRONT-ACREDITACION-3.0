import { apiPost, ApiError } from '@/shared/lib';
import type { I18nText } from '../types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

interface ParameterRow<T> {
	id: number;
	code: string;
	value: T;
	name: I18nText;
	description: I18nText;
	is_active: boolean;
}

export async function getParameterByCode<T>(code: string): Promise<T> {
	const envelope = await apiPost<Envelope<Array<ParameterRow<T>>>>('/parameters/get-by-filters', {
		code,
	});
	if (!envelope?.data) throw new ApiError('parameters.error.notFound');

	const row = envelope.data[0];
	if (!row) throw new ApiError('parameters.error.notFound');
	return row.value;
}
