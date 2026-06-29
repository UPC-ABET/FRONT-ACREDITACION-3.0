'use client';

import { Toast } from '@/shared';
import { useApiErrorToast } from '@/shared/hooks';
import PeriodsTable from './PeriodsTable';

export default function PeriodsTab() {
	const { toast, clearToast } = useApiErrorToast();

	return (
		<section className="space-y-6">
			<PeriodsTable />

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</section>
	);
}
