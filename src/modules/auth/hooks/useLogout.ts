'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { clearPreferenceCookies } from '@/shared/lib';
import { logoutUser } from '@/modules/auth/services';
import { useAuth } from '@/providers';

export function useLogout() {
	const router = useRouter();
	const { clearUser } = useAuth();

	return useCallback(async () => {
		try {
			await logoutUser();
		} catch {
			// Silent — don't block local session cleanup.
		} finally {
			clearUser();
			clearPreferenceCookies();
			sessionStorage.clear();
			router.replace('/auth/login');
		}
	}, [router, clearUser]);
}
