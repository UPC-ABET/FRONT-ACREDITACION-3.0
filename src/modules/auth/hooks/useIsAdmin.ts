'use client';

import { useAuth } from '@/providers';

export function useIsAdmin(): boolean {
	const { isAdmin } = useAuth();
	return isAdmin;
}
