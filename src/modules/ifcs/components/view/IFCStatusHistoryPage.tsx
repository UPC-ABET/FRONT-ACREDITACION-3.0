'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button, ErrorDialog, LoadingDialog, PageHeader } from '@/shared/components';
import { useGlobalAcademicFiltersLockOverride, useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { useIFCStatusHistory } from '../../hooks/useIfcs';
import { IFCStatusHistoryTable } from './IFCStatusHistoryTable';

export default function IFCStatusHistoryPage() {
	const { t } = useI18n();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const id = Number(params?.id);

	useGlobalAcademicFiltersLockOverride({ school: true, modality: true, period: true });

	const { data, isLoading, error } = useIFCStatusHistory(id);

	if (isLoading) {
		return <LoadingDialog isOpen label={t('loading.default')} />;
	}

	if (error || !data) {
		return (
			<ErrorDialog
				isOpen
				onClose={() => router.push(`/ifcs/${id}`)}
				message={tryTranslate(t, getErrorMessage(error, 'ifcs.error.statusHistoryFailed'))}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('ifcs.statusHistory.title')}
				action={
					<Button variant="ghost" size="lg" onClick={() => router.push(`/ifcs/${id}`)}>
						<ArrowLeftIcon className="h-5 w-5" />
						{t('ifcs.statusHistory.btn.back')}
					</Button>
				}
			/>

			<IFCStatusHistoryTable entries={data} />
		</div>
	);
}
