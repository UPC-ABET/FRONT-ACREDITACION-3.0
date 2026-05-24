'use client';

import { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Card, LoadingDialog, SuccessDialog, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/try-translate';
import { useParameter } from '../hooks/useParameter';
import { PARAM_CODES, type ParameterRow } from '../services/types';
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

				{!loading && loadError && (
					<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-base text-red-800">
						<ExclamationTriangleIcon
							className="h-6 w-6 flex-shrink-0 text-red-600"
							aria-hidden="true"
						/>
						<p>{tryTranslate(t, loadError)}</p>
					</div>
				)}

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
