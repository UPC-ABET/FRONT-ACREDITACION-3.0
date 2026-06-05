'use client';

import { useRef, useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Button, Toast } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import { portfolioProjectsService } from '../../services';
import type { BulkUploadPortfolioResponse } from '../../types';

type Mode = 'basic' | 'filled';

type Props = {
	academicPeriodId: number | null;
	modalityTypeId: number | null;
	courseSectionId?: number | null;
	onSuccess?: (result: BulkUploadPortfolioResponse) => void;
};

export function PortfolioBulkUpload({
	academicPeriodId,
	modalityTypeId,
	courseSectionId,
	onSuccess,
}: Props) {
	const { t } = useI18n();
	const fileRef = useRef<HTMLInputElement>(null);
	const fileRefFilled = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState<Mode | null>(null);
	const [downloadingTemplate, setDownloadingTemplate] = useState<Mode | null>(null);
	const [result, setResult] = useState<BulkUploadPortfolioResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	const canUpload = academicPeriodId != null && modalityTypeId != null;
	const canUploadFilled = canUpload && courseSectionId != null;

	async function handleDownloadTemplate(mode: Mode) {
		setDownloadingTemplate(mode);
		try {
			if (mode === 'basic') {
				await portfolioProjectsService.downloadTemplate();
			} else {
				await portfolioProjectsService.downloadFilledTemplate();
			}
		} catch (e) {
			setError(getErrorMessage(e, t('portfolio.bulkUpload.errorDownload')));
		} finally {
			setDownloadingTemplate(null);
		}
	}

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, mode: Mode) {
		const file = e.target.files?.[0];
		if (!file || !academicPeriodId || !modalityTypeId) return;
		e.target.value = '';

		setUploading(mode);
		setResult(null);
		setError(null);
		try {
			let res: BulkUploadPortfolioResponse;
			if (mode === 'basic') {
				res = await portfolioProjectsService.bulkUpload(academicPeriodId, modalityTypeId, file);
			} else {
				if (!courseSectionId) return;
				res = await portfolioProjectsService.bulkUploadFilled(
					academicPeriodId,
					modalityTypeId,
					courseSectionId,
					file,
				);
			}
			setResult(res);
			onSuccess?.(res);
		} catch (e) {
			setError(getErrorMessage(e, t('portfolio.bulkUpload.errorUpload')));
		} finally {
			setUploading(null);
		}
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 space-y-3">
					<p className="text-sm font-semibold text-zinc-700">{t('portfolio.bulkUpload.basicTitle')}</p>
					<p className="text-xs text-zinc-500">{t('portfolio.bulkUpload.basicDesc')}</p>
					<div className="flex gap-2">
						<Button
							variant="surface"
							size="sm"
							disabled={downloadingTemplate === 'basic'}
							onClick={() => handleDownloadTemplate('basic')}>
							<ArrowDownTrayIcon className="h-4 w-4" />
							{downloadingTemplate === 'basic'
								? t('loading.default')
								: t('portfolio.bulkUpload.downloadTemplate')}
						</Button>
						<Button
							variant="primary"
							size="sm"
							disabled={!canUpload || uploading === 'basic'}
							onClick={() => fileRef.current?.click()}>
							<ArrowUpTrayIcon className="h-4 w-4" />
							{uploading === 'basic' ? t('loading.default') : t('portfolio.bulkUpload.upload')}
						</Button>
					</div>
					<input
						ref={fileRef}
						type="file"
						accept=".xlsx"
						className="hidden"
						onChange={(e) => handleFileChange(e, 'basic')}
					/>
				</div>

				<div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 space-y-3">
					<p className="text-sm font-semibold text-zinc-700">
						{t('portfolio.bulkUpload.filledTitle')}
					</p>
					<p className="text-xs text-zinc-500">{t('portfolio.bulkUpload.filledDesc')}</p>
					<div className="flex gap-2">
						<Button
							variant="surface"
							size="sm"
							disabled={downloadingTemplate === 'filled'}
							onClick={() => handleDownloadTemplate('filled')}>
							<ArrowDownTrayIcon className="h-4 w-4" />
							{downloadingTemplate === 'filled'
								? t('loading.default')
								: t('portfolio.bulkUpload.downloadTemplate')}
						</Button>
						<Button
							variant="primary"
							size="sm"
							disabled={!canUploadFilled || uploading === 'filled'}
							onClick={() => fileRefFilled.current?.click()}>
							<ArrowUpTrayIcon className="h-4 w-4" />
							{uploading === 'filled' ? t('loading.default') : t('portfolio.bulkUpload.upload')}
						</Button>
					</div>
					<input
						ref={fileRefFilled}
						type="file"
						accept=".xlsx"
						className="hidden"
						onChange={(e) => handleFileChange(e, 'filled')}
					/>
				</div>
			</div>

			{result && (
				<div
					className={`rounded-lg border p-4 text-sm ${
						result.errors.length > 0
							? 'border-amber-200 bg-amber-50 text-amber-800'
							: 'border-green-200 bg-green-50 text-green-800'
					}`}>
					<p className="font-semibold">
						{t('portfolio.bulkUpload.resultInserted')}: {result.inserted}
					</p>
					{result.errors.length > 0 && (
						<ul className="mt-2 space-y-1 text-xs">
							{result.errors.slice(0, 10).map((err) => (
								<li key={err.row}>
									{t('portfolio.bulkUpload.row')} {err.row}: {err.message}
								</li>
							))}
							{result.errors.length > 10 && (
								<li>
									… {t('portfolio.bulkUpload.moreErrors').replace(
										'{{count}}',
										String(result.errors.length - 10),
									)}
								</li>
							)}
						</ul>
					)}
				</div>
			)}

			{error && <Toast isOpen type="error" onClose={() => setError(null)} message={error} />}
		</div>
	);
}
