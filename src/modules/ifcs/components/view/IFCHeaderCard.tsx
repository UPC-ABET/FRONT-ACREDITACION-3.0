'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { Button, Card, ErrorDialog } from '@/shared/components';
import { formatDateTime } from '@/shared/utils';
import { IFCPageTitle } from '../shared/IFCPageTitle';
import { StatusBadge } from '../StatusBadge';
import { VIEW_LABELS } from './viewLabels';
import { TYPE_CODES } from '../../constants';
import { usePdfDownload } from '../../hooks/usePdfDownload';
import type { IFCHeader } from '../../services/types';

function tryTranslate(t: (k: string) => string, key: string) {
	const translated = t(key);
	return translated === key ? key : translated;
}

type Props = {
	ifc: IFCHeader;
	showObservation: boolean;
	observationText: string;
	onObservationChange: (s: string) => void;
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

	return (
		<Card>
			<div className="space-y-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<IFCPageTitle
						area={ifc.area_label}
						subarea={ifc.subarea_label}
						course={ifc.course_name}
						period={ifc.academic_period_code}
					/>
					<Button
						variant="secondary"
						size="lg"
						disabled={!canExport || isDownloading}
						onClick={() => downloadOne(Number(ifc.id))}>
						<ArrowDownTrayIcon className="h-5 w-5" />
						{isDownloading ? t('loading.default') : VIEW_LABELS.export[lang]}
					</Button>
				</div>

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
						<dd className="mt-1.5 text-base text-zinc-900">{formatDateTime(ifc.created_at)}</dd>
					</div>
					<div>
						<dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
							{VIEW_LABELS.status[lang]}
						</dt>
						<dd className="mt-1.5 flex flex-wrap items-center gap-2 text-base text-zinc-900">
							<StatusBadge status={statusCode} label={statusLabel} color={ifc.status?.color} />
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
							{VIEW_LABELS.rejection_reason[lang]}
						</p>
						<p className="mt-2 whitespace-pre-line text-base leading-relaxed text-amber-900">
							{ifc.status.comment[lang] ?? ifc.status.comment.es ?? ''}
						</p>
					</div>
				)}

				{showObservation && (
					<div>
						<label className="mb-2 block text-base font-semibold text-zinc-800">
							{VIEW_LABELS.observation[lang]} <span className="text-red-600">*</span>
						</label>
						<textarea
							className="w-full rounded-md border border-zinc-300 p-3 text-base leading-relaxed transition-colors focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
							rows={4}
							value={observationText}
							onChange={(e) => onObservationChange(e.target.value)}
						/>
					</div>
				)}
			</div>

			{pdfError && <ErrorDialog isOpen onClose={clearError} message={tryTranslate(t, pdfError)} />}
		</Card>
	);
}
