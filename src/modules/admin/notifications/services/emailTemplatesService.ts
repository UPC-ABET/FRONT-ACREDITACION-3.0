import { apiDelete, apiGet, apiPost, apiPut, getApiData, ApiError } from '@/shared/lib';
import type { EmailTemplate, EmailTemplateBody, EmailTemplateFilters } from '../types';

function normalizeTemplate(template: EmailTemplate): EmailTemplate {
	return {
		...template,
		id: Number(template.id),
		categoryTypeId: Number(template.categoryTypeId),
		isActive: Boolean(template.isActive),
	};
}

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
	const response = await apiGet('/email-templates/get-all');
	const templates = getApiData<EmailTemplate[]>(response);
	if (!Array.isArray(templates)) throw new ApiError('admin.notify.error.listFailed');
	return templates.map(normalizeTemplate);
}

export async function getEmailTemplatesByFilters(
	filters: EmailTemplateFilters,
): Promise<EmailTemplate[]> {
	const response = await apiPost('/email-templates/get-by-filters', filters);
	const templates = getApiData<EmailTemplate[]>(response);
	if (!Array.isArray(templates)) throw new ApiError('admin.notify.error.listFailed');
	return templates.map(normalizeTemplate);
}

export async function createEmailTemplate(body: EmailTemplateBody): Promise<EmailTemplate> {
	const response = await apiPost('/email-templates/create', body);
	return normalizeTemplate(getApiData<EmailTemplate>(response));
}

export async function updateEmailTemplate(
	id: number,
	body: Partial<EmailTemplateBody>,
): Promise<EmailTemplate> {
	const response = await apiPut(`/email-templates/update/${Number(id)}`, body);
	return normalizeTemplate(getApiData<EmailTemplate>(response));
}

export async function deleteEmailTemplate(id: number): Promise<void> {
	await apiDelete(`/email-templates/delete/${Number(id)}`);
}
