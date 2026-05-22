'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ErrorDialog, LoadingDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import { useIFCFormBootstrap, type IFCFormMode } from '../../hooks/useIFCFormBootstrap';
import { IFCForm } from './IFCForm';

function tryTranslate(t: (k: string) => string, key: string) {
	const translated = t(key);
	return translated === key ? key : translated;
}

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
					chartId: Number(searchParams.get('chart_id')),
					periodId: Number(searchParams.get('period_id')),
				}
			: { kind: 'edit', ifcId: Number(params?.id) };

	const { data, loading, error } = useIFCFormBootstrap(bootstrapMode);

	if (loading) {
		return <LoadingDialog isOpen label={t('loading.default')} />;
	}

	if (error || !data) {
		return (
			<ErrorDialog
				isOpen
				onClose={() => router.push('/ifcs')}
				message={tryTranslate(t, error ?? 'ifcs.error.bootstrapFailed')}
			/>
		);
	}

	return (
		<IFCForm
			mode={mode}
			chartId={bootstrapMode.kind === 'create' ? bootstrapMode.chartId : undefined}
			periodId={bootstrapMode.kind === 'create' ? bootstrapMode.periodId : undefined}
			existing={data.existing}
			prefill={data.prefill}
			languages={data.languages}
			ifcFields={data.ifcFields}
			criticalities={data.criticalities}
		/>
	);
}
