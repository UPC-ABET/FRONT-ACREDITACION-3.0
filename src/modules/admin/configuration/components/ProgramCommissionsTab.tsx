'use client';

import { TableEmptyState, Toast } from '@/shared';
import { useApiErrorToast } from '@/shared/hooks';
import { useABET, useI18n } from '@/providers';
import ProgramCommissionsTable from './ProgramCommissionsTable';

export default function ProgramCommissionsTab() {
	const { t } = useI18n();
	const { toast, clearToast } = useApiErrorToast();
	const { academicPeriodId } = useABET();

	return (
		<section className="space-y-6">
			{academicPeriodId !== null ? (
				<ProgramCommissionsTable academicPeriodId={academicPeriodId} />
			) : (
				<TableEmptyState message={t('admin.configuration.programCommissions.selectPeriodHint')} />
			)}

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</section>
	);
}
