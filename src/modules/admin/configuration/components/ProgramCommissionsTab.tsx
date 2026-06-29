'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, TableEmptyState, Toast } from '@/shared';
import { useApiErrorToast } from '@/shared/hooks';
import { useABET, useI18n } from '@/providers';
import AssociateProgramCommissionDialog from './AssociateProgramCommissionDialog';
import ProgramCommissionsTable from './ProgramCommissionsTable';

export default function ProgramCommissionsTab() {
	const { t } = useI18n();
	const { toast, clearToast } = useApiErrorToast();
	const { academicPeriodId } = useABET();
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<section className="space-y-6">
			<div className="flex justify-end">
				<Button
					variant="primary"
					size="md"
					onClick={() => setDialogOpen(true)}
					disabled={academicPeriodId === null}
					className="w-full sm:w-auto">
					<Plus className="h-4 w-4" />
					<span>{t('admin.configuration.programCommissions.associateButton')}</span>
				</Button>
			</div>

			{academicPeriodId !== null ? (
				<ProgramCommissionsTable academicPeriodId={academicPeriodId} />
			) : (
				<TableEmptyState message={t('admin.configuration.programCommissions.selectPeriodHint')} />
			)}

			{academicPeriodId !== null && (
				<AssociateProgramCommissionDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					academicPeriodId={academicPeriodId}
				/>
			)}

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</section>
	);
}
