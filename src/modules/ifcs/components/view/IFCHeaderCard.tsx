'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { Badge, Button, Card, I18nTextField, PageHeader, Toast } from '@/shared/components';
import { formatDateTime, tryTranslate } from '@/shared/utils';
import { VIEW_LABELS } from './viewLabels';
import { TYPE_CODES } from '@/shared/constants';
import { usePdfDownload } from '../../hooks/usePdfDownload';
import type { I18nText, IFCHeader } from '../../types';

type Props = {
	ifc: IFCHeader;
	showObservation: boolean;
	observationText: I18nText;
	onObservationChange: (next: I18nText) => void;
};

export function IFCHeaderCard({
	ifc,
	showObservation,
	observationText,
	onObservationChange,
}: Props) {
	const { t, locale: lang } = useI18n();
	const statusCode = ifc.status?.code ?? TYPE_CODES.IFC_STATUS.UNREGISTERED;
	const isObserved = statusCode === TYPE_CODES.IFC_STATUS.OBSERVED;
	const statusLabel = ifc.status?.name?.[lang] ?? ifc.status?.name?.es ?? '';
	const { downloadOne, downloadingId, error: pdfError, clearError } = usePdfDownload();
	const canExport = statusCode === TYPE_CODES.IFC_STATUS.APPROVED;
	const isDownloading = downloadingId === ifc.id;

	const coordinator = `${ifc.coordinator.name ?? '—'}${ifc.coordinator.code ? ` (${ifc.coordinator.code})` : ''}`;
	const courseName = ifc.courseName?.[lang] ?? '';
	const crumbs = [
		ifc.areaLabel?.[lang] ?? '',
		ifc.subareaLabel?.[lang] ?? '',
		ifc.academicPeriodCode,
	]
		.filter(Boolean)
		.join(' - ');

	return (
		<>
			<PageHeader
				title={courseName || '-'}
				description={crumbs || undefined}
				action={
					<Button
						variant="secondary"
						size="lg"
						disabled={!canExport || isDownloading}
						onClick={() => downloadOne(Number(ifc.id))}>
						<ArrowDownTrayIcon className="h-5 w-5" />
						{isDownloading ? t('loading.default') : VIEW_LABELS.export[lang]}
					</Button>
				}
			/>

			<Card>
				<div className="space-y-6">
					<dl className="grid grid-cols-1 gap-5 rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 sm:grid-cols-2 lg:grid-cols-3">
						<div>
							<dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
								{VIEW_LABELS.coordinator[lang]}
							</dt>
							<dd className="mt-1.5 text-base text-zinc-900">{coordinator}</dd>
						</div>
						<div>
							<dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
								{VIEW_LABELS.created[lang]}
							</dt>
							<dd className="mt-1.5 text-base text-zinc-900">{formatDateTime(ifc.createdAt)}</dd>
						</div>
						<div>
							<dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
								{VIEW_LABELS.status[lang]}
							</dt>
							<dd className="mt-1.5 flex flex-wrap items-center gap-2 text-base text-zinc-900">
								<Badge color={ifc.status?.color}>{statusLabel}</Badge>
								{ifc.status && (
									<span className="text-sm text-zinc-600">
										{VIEW_LABELS.by[lang]} {ifc.status.by ?? '—'} · {formatDateTime(ifc.status.at)}
									</span>
								)}
							</dd>
						</div>
					</dl>

					{isObserved && ifc.status?.comment && (
						<div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
							<p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
								{VIEW_LABELS.rejectionReason[lang]}
							</p>
							<p className="mt-2 whitespace-pre-line text-base leading-relaxed text-amber-900">
								{ifc.status.comment[lang] ?? ifc.status.comment.es ?? ''}
							</p>
						</div>
					)}

					{showObservation && (
						<I18nTextField
							label={VIEW_LABELS.observation[lang]}
							required
							value={observationText}
							onChange={onObservationChange}
						/>
					)}
				</div>
			</Card>

			{pdfError && (
				<Toast isOpen type="error" onClose={clearError} message={tryTranslate(t, pdfError)} />
			)}
		</>
	);
}
