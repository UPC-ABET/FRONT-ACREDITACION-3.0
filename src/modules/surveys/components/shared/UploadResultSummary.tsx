'use client';

import React from 'react';
import { useI18n } from '@/providers';
import { tryTranslate, interpolate } from '@/shared/utils';
import type { MassiveUploadResult } from '../../types';

interface UploadResultSummaryProps {
	readonly result: MassiveUploadResult;
}

export function UploadResultSummary({ result }: UploadResultSummaryProps) {
	const { t } = useI18n();

	return (
		<div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
			<p className="text-sm font-bold text-zinc-700">{t('surveys.shared.upload.resultTitle')}</p>
			<div className="grid grid-cols-3 gap-3 text-sm">
				<div>
					<span className="text-xs text-zinc-500 block">{t('surveys.shared.upload.total')}</span>
					<span className="font-semibold text-zinc-800">{result.total}</span>
				</div>
				<div>
					<span className="text-xs text-zinc-500 block">{t('surveys.shared.upload.success')}</span>
					<span className="font-semibold text-emerald-600">{result.success}</span>
				</div>
				<div>
					<span className="text-xs text-zinc-500 block">{t('surveys.shared.upload.failed')}</span>
					<span className="font-semibold text-red-600">{result.failed}</span>
				</div>
			</div>

			{result.errors.length > 0 && (
				<ul className="space-y-1 max-h-48 overflow-y-auto">
					{result.errors.map((error, index) => (
						<li
							key={`${error.code ?? error.row ?? index}-${index}`}
							className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
							{error.row != null
								? interpolate(t('surveys.shared.upload.rowError'), {
										row: error.row,
										reason: tryTranslate(t, error.reason),
									})
								: tryTranslate(t, error.reason)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
