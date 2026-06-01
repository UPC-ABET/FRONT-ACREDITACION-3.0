'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Toast } from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { useI18n } from '@/providers';
import AssociateProgramCommissionDialog from './AssociateProgramCommissionDialog';
import ConfigurationPeriodSelect from './ConfigurationPeriodSelect';
import ProgramCommissionsTable from './ProgramCommissionsTable';

export default function ProgramCommissionsTab() {
	const { t } = useI18n();
	const { toast, clearToast } = useApiErrorToast();
	const [academicPeriodId, setAcademicPeriodId] = useState<number | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<section className="space-y-6">
			<header className="space-y-1">
				<h2 className="text-lg font-semibold text-gray-900">
					{t('admin.configuration.programCommissions.title')}
				</h2>
				<p className="text-sm text-gray-500">
					{t('admin.configuration.programCommissions.subtitle')}
				</p>
			</header>

			<div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
				<ConfigurationPeriodSelect
					value={academicPeriodId}
					onChange={setAcademicPeriodId}
					placeholder={t('admin.configuration.programCommissions.periodPlaceholder')}
				/>
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
