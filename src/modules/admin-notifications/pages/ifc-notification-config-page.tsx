'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationConfigPage } from '../components/NotificationConfigPage';
import { useAuth } from '@/providers';

export default function IfcNotificationConfigPageEntry() {
	const router = useRouter();
	const { isAdmin, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading && !isAdmin) {
			router.replace('/ifcs');
		}
	}, [isLoading, isAdmin, router]);

	if (isLoading || !isAdmin) return null;
	return <NotificationConfigPage />;
}
