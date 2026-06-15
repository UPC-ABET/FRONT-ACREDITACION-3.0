'use client';

import { useState } from 'react';
import {
	Card,
	LoadingDialog,
	SubTitle,
	SuccessDialog,
	TableErrorState,
	Title,
	Toast,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { useParameter } from '../hooks/useParameter';
import { PARAMETER_CODES } from '@/shared/constants';
import type { ParameterRow } from '../types';
import { PrefixParameterCard } from './PrefixParameterCard';

export function IfcCodesPage() {
	const { t } = useI18n();
	const finding = useParameter<string>(PARAMETER_CODES.FINDING_PREFIX);
	const action = useParameter<string>(PARAMETER_CODES.ACTION_PREFIX);

	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const loading = finding.loading || action.loading;
	const loadError = finding.error ?? action.error;

	function handleFindingSaved(updated: ParameterRow<string>) {
		finding.setData(updated);
	}

	function handleActionSaved(updated: ParameterRow<string>) {
		action.setData(updated);
	}

	return (
		<Card title={t('admin.params.codes.page.title')}>
			<div className="space-y-6">
				<div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 sm:p-6">
					<Title
						title={t('admin.params.codes.page.subtitle')}
						className="[&_h2]:text-sm [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-zinc-700"
					/>
					<SubTitle
						name={t('admin.params.codes.page.intro')}
						className="mt-1 max-w-3xl [&_h3]:text-sm [&_h3]:font-normal [&_h3]:leading-relaxed [&_h3]:text-zinc-500"
					/>
				</div>

				{loading && <LoadingDialog isOpen label={t('loading.default')} />}

				{!loading && loadError && <TableErrorState message={tryTranslate(t, loadError)} />}

				{!loading && !loadError && finding.data && (
					<PrefixParameterCard
						parameter={finding.data}
						onSaved={handleFindingSaved}
						onError={setErrorMsg}
						onSuccess={setSuccessMsg}
					/>
				)}

				{!loading && !loadError && action.data && (
					<PrefixParameterCard
						parameter={action.data}
						onSaved={handleActionSaved}
						onError={setErrorMsg}
						onSuccess={setSuccessMsg}
					/>
				)}

				{errorMsg && (
					<Toast
						isOpen
						type="error"
						onClose={() => setErrorMsg(null)}
						message={tryTranslate(t, errorMsg)}
					/>
				)}

				{successMsg && (
					<SuccessDialog isOpen onClose={() => setSuccessMsg(null)} message={successMsg} />
				)}
			</div>
		</Card>
	);
}
