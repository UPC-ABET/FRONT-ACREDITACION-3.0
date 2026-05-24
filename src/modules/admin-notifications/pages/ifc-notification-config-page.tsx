'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationConfigPage } from '../components/NotificationConfigPage';
import { getAuthCookie } from '@/shared/lib';

export default function IfcNotificationConfigPageEntry() {
	const router = useRouter();
	const [status, setStatus] = useState<'pending' | 'allowed' | 'denied'>('pending');

	useEffect(() => {
		try {
			const raw = getAuthCookie('token');
			const user = raw ? JSON.parse(raw) : null;
			if (user?.is_admin === true) {
				// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: defer localStorage check past hydration
				setStatus('allowed');
				return;
			}
		} catch {
			// fall through to denied
		}
		setStatus('denied');
		router.replace('/ifcs');
	}, [router]);

	if (status !== 'allowed') return null;
	return <NotificationConfigPage />;
}
