'use client';

import { useI18n } from '@/providers';
import { Card, Button, ErrorDialog } from '@/shared/components';
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

	return (
		<Card>
			<div className="space-y-4">
				<IFCPageTitle
					area={ifc.area_label}
					subarea={ifc.subarea_label}
					course={ifc.course_name}
					period={ifc.academic_period_code}
				/>

				<div className="space-y-2 text-sm text-zinc-700">
					<p>
						<strong>{VIEW_LABELS.coordinator[lang]}:</strong> {ifc.coordinator.name ?? '—'}
						{ifc.coordinator.code && <> ({ifc.coordinator.code})</>}
					</p>

					<p>
						<strong>{VIEW_LABELS.created[lang]}:</strong> {formatDateTime(ifc.created_at)}
					</p>

					<p className="flex flex-wrap items-center gap-2">
						<strong>{VIEW_LABELS.status[lang]}:</strong>
						<StatusBadge status={statusCode} label={statusLabel} />
						{ifc.status && (
							<span className="text-xs text-zinc-500">
								{VIEW_LABELS.by[lang]} {ifc.status.by ?? '—'} — {formatDateTime(ifc.status.at)}
							</span>
						)}
					</p>

					{isObserved && ifc.status?.comment && (
						<p>
							<strong>{VIEW_LABELS.rejection_reason[lang]}:</strong>{' '}
							{ifc.status.comment[lang] ?? ifc.status.comment.es ?? ''}
						</p>
					)}
				</div>

				{showObservation && (
					<div>
						<label className="block text-sm font-medium text-zinc-700">
							{VIEW_LABELS.observation[lang]} <span className="text-red-600">*</span>
						</label>
						<textarea
							className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
							rows={3}
							value={observationText}
							onChange={(e) => onObservationChange(e.target.value)}
						/>
					</div>
				)}

				<div className="flex justify-end">
					<Button
						variant="secondary"
						size="md"
						disabled={!canExport || isDownloading}
						title={canExport ? undefined : t('ifcs.pdf.exportNotApproved')}
						onClick={() => downloadOne(Number(ifc.id))}>
						{isDownloading ? t('loading.default') : VIEW_LABELS.export[lang]}
					</Button>
				</div>
			</div>

			{pdfError && (
				<ErrorDialog isOpen onClose={clearError} message={tryTranslate(t, pdfError)} />
			)}
		</Card>
	);
}
