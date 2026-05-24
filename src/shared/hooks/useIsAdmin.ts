'use client';

import { useState } from 'react';
import { getAuthCookie } from '@/shared/lib';

export function useIsAdmin(): boolean {
	const [isAdmin] = useState(() => {
		if (typeof window === 'undefined') return false;
		try {
			const raw = getAuthCookie('token');
			const user = raw ? JSON.parse(raw) : null;
			return user?.is_admin === true;
		} catch {
			return false;
		}
	});

	return isAdmin;
}
