'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getParameterByCode, getTypesByGroupCode } from '@/modules/core';
import { PARAMETER_CODES, TYPE_GROUP_CODES } from '@/shared/constants';
import {
	createSurveyMessage,
	deleteSurveyMessage,
	listSurveyMessages,
	updateSurveyMessage,
} from '../services';
import type { CoreType, NotifyVar, SurveyMessage, SurveyMessageBody } from '../types';

export const surveyMessagesKeys = {
	all: ['notification-survey-messages'] as const,
	list: () => [...surveyMessagesKeys.all, 'list'] as const,
};

export function useSurveyMessages() {
	return useQuery({
		queryKey: surveyMessagesKeys.list(),
		queryFn: listSurveyMessages,
		staleTime: 0,
	});
}

export function useSurveyTypes() {
	return useQuery({
		queryKey: ['types', TYPE_GROUP_CODES.SURVEY_TYPE],
		queryFn: () => getTypesByGroupCode(TYPE_GROUP_CODES.SURVEY_TYPE) as Promise<CoreType[]>,
		staleTime: Infinity,
	});
}

export function useSurveyNotifyVars() {
	return useQuery({
		queryKey: ['parameter', PARAMETER_CODES.SURVEY_NOTIFICATION_VARS],
		queryFn: () => getParameterByCode<NotifyVar[]>(PARAMETER_CODES.SURVEY_NOTIFICATION_VARS),
		staleTime: Infinity,
	});
}

interface SaveSurveyMessageInput {
	id: number | null;
	body: SurveyMessageBody;
}

export function useSurveyMessageMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: surveyMessagesKeys.all });

	const save = useMutation({
		mutationFn: ({ id, body }: SaveSurveyMessageInput): Promise<SurveyMessage> =>
			id ? updateSurveyMessage(id, body) : createSurveyMessage(body),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (id: number) => deleteSurveyMessage(id),
		onSuccess: invalidate,
	});

	return { save, remove };
}
