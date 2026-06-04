'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import {
	createModuleType,
	createPermissionType,
	deleteType,
	listTypesByGroupCode,
	updateType,
} from '../services';
import type { ModuleTypeCreateBody, PermissionTypeCreateBody, TypeUpdateBody } from '../types';

export const iamTypesKeys = {
	all: ['iam-types'] as const,
	byGroup: (groupCode: string) => [...iamTypesKeys.all, groupCode] as const,
};

export function useModules() {
	return useQuery({
		queryKey: iamTypesKeys.byGroup(TYPE_GROUP_CODES.IAM_MODULE),
		queryFn: () => listTypesByGroupCode(TYPE_GROUP_CODES.IAM_MODULE),
		staleTime: 0,
	});
}

export function usePermissions() {
	return useQuery({
		queryKey: iamTypesKeys.byGroup(TYPE_GROUP_CODES.IAM_PERMISSION),
		queryFn: () => listTypesByGroupCode(TYPE_GROUP_CODES.IAM_PERMISSION),
		staleTime: 0,
	});
}

export function useDocumentTypes() {
	return useQuery({
		queryKey: iamTypesKeys.byGroup(TYPE_GROUP_CODES.DOCUMENT_TYPE),
		queryFn: () => listTypesByGroupCode(TYPE_GROUP_CODES.DOCUMENT_TYPE),
		staleTime: Infinity,
	});
}

export function useModuleTypeMutations() {
	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: iamTypesKeys.byGroup(TYPE_GROUP_CODES.IAM_MODULE) });

	const create = useMutation({
		mutationFn: (body: ModuleTypeCreateBody) => createModuleType(body),
		onSuccess: invalidate,
	});
	const update = useMutation({
		mutationFn: ({ id, body }: { id: number; body: TypeUpdateBody }) => updateType(id, body),
		onSuccess: invalidate,
	});
	const remove = useMutation({
		mutationFn: (id: number) => deleteType(id),
		onSuccess: invalidate,
	});

	return { create, update, remove };
}

export function usePermissionTypeMutations() {
	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: iamTypesKeys.byGroup(TYPE_GROUP_CODES.IAM_PERMISSION),
		});

	const create = useMutation({
		mutationFn: (body: PermissionTypeCreateBody) => createPermissionType(body),
		onSuccess: invalidate,
	});
	const update = useMutation({
		mutationFn: ({ id, body }: { id: number; body: TypeUpdateBody }) => updateType(id, body),
		onSuccess: invalidate,
	});
	const remove = useMutation({
		mutationFn: (id: number) => deleteType(id),
		onSuccess: invalidate,
	});

	return { create, update, remove };
}
