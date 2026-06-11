'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Toast } from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { useI18n } from '@/providers';
import OpenPeriodDialog from './OpenPeriodDialog';
import PeriodsTable from './PeriodsTable';

export default function PeriodsTab() {
	const { t } = useI18n();
	const { toast, clearToast } = useApiErrorToast();
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<section className="space-y-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
				<div className="space-y-1">
					<h2 className="text-lg font-semibold text-gray-900">
						{t('admin.configuration.periods.title')}
					</h2>
					<p className="text-sm text-gray-500">{t('admin.configuration.periods.subtitle')}</p>
				</div>
				<Button
					variant="primary"
					size="sm"
					onClick={() => setDialogOpen(true)}
					className="w-full sm:w-auto">
					<Plus className="h-4 w-4" />
					<span>{t('admin.configuration.periods.openButton')}</span>
				</Button>
			</header>

			<PeriodsTable />

			<OpenPeriodDialog open={dialogOpen} onOpenChange={setDialogOpen} />

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</section>
	);
}
