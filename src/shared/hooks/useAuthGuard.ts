import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthCookie } from '@/shared/lib';

export function useAuthGuard(enabled = true) {
	const router = useRouter();
	const [checking, setChecking] = useState(false);

	useEffect(() => {
		if (!enabled) {
			setChecking(false);
			return;
		}
		const token = getAuthCookie('bearerToken');
		if (!token) {
			setChecking(true);
			router.replace('/auth/login');
		} else {
			setChecking(false);
		}
	}, [enabled, router]);

	return checking;
}
