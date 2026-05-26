'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IfcFieldsPage } from '../components/IfcFieldsPage';
import { useAuth } from '@/providers';

export default function IfcFieldsPageEntry() {
	const router = useRouter();
	const { isAdmin, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading && !isAdmin) {
			router.replace('/ifcs');
		}
	}, [isLoading, isAdmin, router]);

	if (isLoading || !isAdmin) return null;
	return <IfcFieldsPage />;
}
