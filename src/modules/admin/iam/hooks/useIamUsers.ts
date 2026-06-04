'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	assignUserRole,
	createUser,
	deleteUser,
	listUsers,
	unassignUserRole,
	updateUser,
} from '../services';
import type { IamUser, UserCreateBody, UserRole, UserUpdateBody } from '../types';
import { userRolesKeys } from './useUserRoles';

export const iamUsersKeys = {
	all: ['iam-users'] as const,
	list: () => [...iamUsersKeys.all, 'list'] as const,
};

export function useUsers() {
	return useQuery({
		queryKey: iamUsersKeys.list(),
		queryFn: listUsers,
		staleTime: 0,
	});
}

async function syncUserRoles(
	userId: number,
	desiredRoleIds: number[],
	currentLinks: UserRole[],
): Promise<void> {
	const desired = new Set(desiredRoleIds);
	const currentRoleIds = new Set(currentLinks.map((link) => link.roleId));
	const toAssign = desiredRoleIds.filter((roleId) => !currentRoleIds.has(roleId));
	const toUnassign = currentLinks.filter((link) => !desired.has(link.roleId));

	await Promise.all([
		...toAssign.map((roleId) => assignUserRole(userId, roleId)),
		...toUnassign.map((link) => unassignUserRole(link.id)),
	]);
}

interface SaveUserInput {
	id: number | null;
	body: UserCreateBody | UserUpdateBody;
	roleIds: number[];
	currentRoleLinks: UserRole[];
}

export function useSaveUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, body, roleIds, currentRoleLinks }: SaveUserInput): Promise<IamUser> => {
			const user = id
				? await updateUser(id, body as UserUpdateBody)
				: await createUser(body as UserCreateBody);
			await syncUserRoles(user.id, roleIds, currentRoleLinks);
			return user;
		},
		onSuccess: (user) => {
			queryClient.invalidateQueries({ queryKey: iamUsersKeys.all });
			queryClient.invalidateQueries({ queryKey: userRolesKeys.byUser(user.id) });
		},
	});
}

export function useDeleteUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => deleteUser(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: iamUsersKeys.all }),
	});
}
