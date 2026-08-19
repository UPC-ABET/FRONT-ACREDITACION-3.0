'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	approveIFC,
	createIFC,
	getIFCStatusHistory,
	getIFCView,
	listIFCs,
	patchIFC,
	rejectIFC,
	submitIFC,
} from '../services/ifcsService';
import type { CreateIFCBody, PatchIFCBody, RejectIFCBody, SubmitResult } from '../types';

export const ifcQueryKeys = {
	all: ['ifcs'] as const,
	list: (chartIds: number[], periodId: number) => ['ifcs', 'list', { chartIds, periodId }] as const,
	view: (id: number) => ['ifcs', 'view', id] as const,
	statusHistory: (id: number) => ['ifcs', 'statusHistory', id] as const,
};

export function useIFCs(chartIds: number[], periodId: number, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: ifcQueryKeys.list(chartIds, periodId),
		queryFn: () => listIFCs(chartIds),
		enabled: (options?.enabled ?? true) && chartIds.length > 0 && periodId > 0,
	});
}

export function useIFCView(id: number | undefined) {
	return useQuery({
		queryKey: ifcQueryKeys.view(id!),
		queryFn: () => getIFCView(id!),
		enabled: id != null && Number.isFinite(id),
	});
}

export function useIFCStatusHistory(id: number | undefined) {
	return useQuery({
		queryKey: ifcQueryKeys.statusHistory(id!),
		queryFn: () => getIFCStatusHistory(id!),
		enabled: id != null && Number.isFinite(id),
	});
}

export function useCreateIFC() {
	const queryClient = useQueryClient();
	return useMutation<SubmitResult, Error, CreateIFCBody>({
		mutationFn: (body) => createIFC(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.all });
		},
	});
}

export function usePatchIFC() {
	const queryClient = useQueryClient();
	return useMutation<SubmitResult, Error, { id: number; payload: PatchIFCBody }>({
		mutationFn: ({ id, payload }) => patchIFC(id, payload),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.view(variables.id) });
		},
	});
}

export function useSubmitIFC() {
	const queryClient = useQueryClient();
	return useMutation<SubmitResult, Error, number>({
		mutationFn: (id) => submitIFC(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.view(id) });
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.statusHistory(id) });
		},
	});
}

export function useApproveIFC() {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: (id) => approveIFC(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.view(id) });
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.statusHistory(id) });
		},
	});
}

export function useRejectIFC() {
	const queryClient = useQueryClient();
	return useMutation<void, Error, { id: number; comment: RejectIFCBody['comment'] }>({
		mutationFn: ({ id, comment }) => rejectIFC(id, comment),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.view(variables.id) });
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.statusHistory(variables.id) });
		},
	});
}
