'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, SubTitle, Title, Toast } from '@/shared/components';
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
			<header className="space-y-1">
				<Title
					title={t('admin.configuration.programCommissions.title')}
					className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
				/>
				<SubTitle
					name={t('admin.configuration.programCommissions.subtitle')}
					className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
				/>
			</header>

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
				<p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
					{t('admin.configuration.programCommissions.selectPeriodHint')}
				</p>
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
