'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthCookies } from '@/shared/lib';
import { logoutUser } from '@/modules/auth/services';

export function useLogout() {
	const router = useRouter();

	return useCallback(async () => {
		try {
			await logoutUser();
		} catch {
			// Silent — don't block local session cleanup.
		} finally {
			clearAuthCookies();
			sessionStorage.clear();
			router.replace('/auth/login');
		}
	}, [router]);
}
