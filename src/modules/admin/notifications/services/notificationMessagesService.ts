import { apiDelete, apiGet, apiPost, apiPut, getApiData, ApiError } from '@/shared/lib';
import type { SurveyMessage, SurveyMessageBody, SurveyMessageFilters } from '../types';

function normalizeMessage(message: SurveyMessage): SurveyMessage {
	return {
		...message,
		id: Number(message.id),
		surveyTypeId: Number(message.surveyTypeId),
		programId: Number(message.programId),
		emailTemplateId: message.emailTemplateId == null ? null : Number(message.emailTemplateId),
		isActive: Boolean(message.isActive),
	};
}

export async function listSurveyMessages(): Promise<SurveyMessage[]> {
	const response = await apiGet('/notification-messages/get-all');
	const messages = getApiData<SurveyMessage[]>(response);
	if (!Array.isArray(messages)) throw new ApiError('admin.notify.error.listFailed');
	return messages.map(normalizeMessage);
}

export async function getSurveyMessagesByFilters(
	filters: SurveyMessageFilters,
): Promise<SurveyMessage[]> {
	const response = await apiPost('/notification-messages/get-by-filters', filters);
	const messages = getApiData<SurveyMessage[]>(response);
	if (!Array.isArray(messages)) throw new ApiError('admin.notify.error.listFailed');
	return messages.map(normalizeMessage);
}

export async function createSurveyMessage(body: SurveyMessageBody): Promise<SurveyMessage> {
	const response = await apiPost('/notification-messages/create', body);
	return normalizeMessage(getApiData<SurveyMessage>(response));
}

export async function updateSurveyMessage(
	id: number,
	body: Partial<SurveyMessageBody>,
): Promise<SurveyMessage> {
	const response = await apiPut(`/notification-messages/update/${Number(id)}`, body);
	return normalizeMessage(getApiData<SurveyMessage>(response));
}

export async function deleteSurveyMessage(id: number): Promise<void> {
	await apiDelete(`/notification-messages/delete/${Number(id)}`);
}
