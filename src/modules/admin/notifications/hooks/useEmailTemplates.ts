'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coreQueryKeys, getParameterByCode, getTypesByGroupCode } from '@/modules/core';
import { PARAMETER_CODES, TYPE_GROUP_CODES } from '@/shared/constants';
import {
	createEmailTemplate,
	deleteEmailTemplate,
	listEmailTemplates,
	updateEmailTemplate,
} from '../services';
import type { CoreType, EmailTemplate, EmailTemplateBody, NotifyVar } from '../types';

export const emailTemplatesKeys = {
	all: ['notification-email-templates'] as const,
	list: () => [...emailTemplatesKeys.all, 'list'] as const,
};

export function useEmailTemplates() {
	return useQuery({
		queryKey: emailTemplatesKeys.list(),
		queryFn: listEmailTemplates,
		placeholderData: (previousData) => previousData,
		staleTime: 0,
	});
}

export function useNotificationCategories() {
	return useQuery({
		queryKey: coreQueryKeys.typesByGroupCode(TYPE_GROUP_CODES.NOTIFICATION_CATEGORY),
		queryFn: () =>
			getTypesByGroupCode(TYPE_GROUP_CODES.NOTIFICATION_CATEGORY) as Promise<CoreType[]>,
		staleTime: Infinity,
	});
}

export function useUserNotifyVars() {
	return useQuery({
		queryKey: coreQueryKeys.parameterByCode(PARAMETER_CODES.USER_NOTIFICATION_VARS),
		queryFn: () => getParameterByCode<NotifyVar[]>(PARAMETER_CODES.USER_NOTIFICATION_VARS),
		staleTime: Infinity,
	});
}

interface SaveEmailTemplateInput {
	id: number | null;
	body: EmailTemplateBody;
}

export function useEmailTemplateMutations() {
	const queryClient = useQueryClient();

	const invalidate = () => queryClient.invalidateQueries({ queryKey: emailTemplatesKeys.all });

	const save = useMutation({
		mutationFn: ({ id, body }: SaveEmailTemplateInput): Promise<EmailTemplate> =>
			id ? updateEmailTemplate(id, body) : createEmailTemplate(body),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (id: number) => deleteEmailTemplate(id),
		onSuccess: invalidate,
	});

	return { save, remove };
}
