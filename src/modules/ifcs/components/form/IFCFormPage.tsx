'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ErrorDialog, LoadingDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { useIFCFormBootstrap, type IFCFormMode } from '../../hooks/useIFCFormBootstrap';
import { IFCForm } from './IFCForm';

type Props = { mode: 'create' | 'edit' };

export function IFCFormPage({ mode }: Props) {
	const { t } = useI18n();
	const router = useRouter();
	const searchParams = useSearchParams();
	const params = useParams<{ id?: string }>();

	const bootstrapMode: IFCFormMode =
		mode === 'create'
			? {
					kind: 'create',
					chartId: Number(searchParams.get('chartId')),
					periodId: Number(searchParams.get('periodId')),
				}
			: { kind: 'edit', ifcId: Number(params?.id) };

	const { data, isLoading, error } = useIFCFormBootstrap(bootstrapMode);

	if (isLoading) {
		return <LoadingDialog isOpen label={t('loading.default')} />;
	}

	if (error || !data) {
		const errorMessage = getErrorMessage(error, 'ifcs.error.bootstrapFailed');
		return (
			<ErrorDialog
				isOpen
				onClose={() => router.push('/ifcs')}
				message={tryTranslate(t, errorMessage)}
			/>
		);
	}

	return (
		<IFCForm
			mode={mode}
			chartId={bootstrapMode.kind === 'create' ? bootstrapMode.chartId : undefined}
			existing={data.existing}
			prefill={data.prefill}
			languages={data.languages}
			ifcFields={data.ifcFields}
			criticalities={data.criticalities}
		/>
	);
}
