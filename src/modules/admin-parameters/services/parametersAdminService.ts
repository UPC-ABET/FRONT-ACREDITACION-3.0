import { apiPost, apiPut } from '@/shared/lib';
import type { ParameterRow, UpdateParameterBody } from './types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function getParameterByFilters<T>(code: string): Promise<ParameterRow<T>> {
	const body = await apiPost<Envelope<Array<ParameterRow<T>>>>('/parameters/get-by-filters', { code });

	if (!body?.data) throw new Error(body?.message ?? 'admin.params.error.loadFailed');

	const row = body.data[0];
	if (!row) throw new Error('admin.params.error.notFound');
	return { ...row, id: Number(row.id) };
}

export async function updateParameter<T>(
	id: number,
	payload: UpdateParameterBody<T>,
): Promise<ParameterRow<T>> {
	const body = await apiPut<Envelope<ParameterRow<T>>>(`/parameters/update/${Number(id)}`, payload);

	if (!body?.data) throw new Error(body?.message ?? 'admin.params.error.saveFailed');
	return { ...body.data, id: Number(body.data.id) };
}
