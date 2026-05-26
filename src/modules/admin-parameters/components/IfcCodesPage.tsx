'use client';

import { useState } from 'react';
import { Card, LoadingDialog, SuccessDialog, TableErrorState, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/try-translate';
import { useParameter } from '../hooks/useParameter';
import { PARAM_CODES, type ParameterRow } from '../types';
import { PrefixParameterCard } from './PrefixParameterCard';

export function IfcCodesPage() {
	const { t } = useI18n();
	const finding = useParameter<string>(PARAM_CODES.FINDING_PREFIX);
	const action = useParameter<string>(PARAM_CODES.ACTION_PREFIX);

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
					<h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700">
						{t('admin.params.codes.page.subtitle')}
					</h2>
					<p className="mt-1 max-w-3xl text-sm text-zinc-500 leading-relaxed">
						{t('admin.params.codes.page.intro')}
					</p>
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
