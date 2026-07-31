'use client';

import { useState } from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Badge, Button, Card, I18nTextField } from '@/shared/components';
import { useI18n } from '@/providers';
import type { FindingDetail, I18nText } from '../../types';

type Props = {
	finding: FindingDetail;
	languages: string[];
	saving: boolean;
	onSave: (description: I18nText) => Promise<void>;
	onDelete: () => void;
	onValidationError: (messageKey: string) => void;
};

export function FindingGeneralInfo({
	finding,
	languages,
	saving,
	onSave,
	onDelete,
	onValidationError,
}: Props) {
	const { t, locale: lang } = useI18n();
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState<I18nText>(finding.description ?? {});

	function startEdit() {
		setDraft(finding.description ?? {});
		setEditing(true);
	}

	function cancelEdit() {
		setDraft(finding.description ?? {});
		setEditing(false);
	}

	async function handleSave() {
		const hasAny = languages.some((l) => draft[l]?.trim());
		if (!hasAny) {
			onValidationError('ifcFindings.findingView.err.descriptionEmpty');
			return;
		}
		try {
			await onSave(draft);
			setEditing(false);
		} catch {
			// Parent surfaces the error; stay in edit mode so user can retry.
		}
	}

	const criticalityLabel =
		finding.criticality.name?.[lang] ?? finding.criticality.name?.es ?? finding.criticality.code;

	const descriptionText = finding.description?.[lang] ?? finding.description?.es ?? '';

	return (
		<Card title={t('ifcFindings.findingView.sectionGeneral')}>
			<div className="space-y-6">
				<dl className="grid grid-cols-1 gap-5 rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 sm:grid-cols-3">
					<div>
						<dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
							{t('ifcFindings.findingView.col.code')}
						</dt>
						<dd className="mt-1.5 text-base text-zinc-900">{finding.findingCode}</dd>
					</div>
					<div>
						<dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
							{t('ifcFindings.findingView.col.period')}
						</dt>
						<dd className="mt-1.5 text-base text-zinc-900">{finding.academicPeriodCode}</dd>
					</div>
					<div>
						<dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
							{t('ifcFindings.findingView.col.criticality')}
						</dt>
						<dd className="mt-1.5">
							<Badge color={finding.criticality.color}>{criticalityLabel}</Badge>
						</dd>
					</div>
				</dl>

				<div>
					<p className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
						{t('ifcFindings.findingView.col.description')}
					</p>
					{editing ? (
						<I18nTextField value={draft} onChange={setDraft} disabled={saving} />
					) : (
						<p className="whitespace-pre-line text-base leading-relaxed text-zinc-800">
							{descriptionText || '—'}
						</p>
					)}
				</div>

				<div className="flex flex-wrap justify-end gap-3 border-t border-zinc-100 pt-5">
					{!editing && (
						<>
							<Button variant="ghost" size="lg" onClick={onDelete}>
								<TrashIcon className="h-5 w-5" />
								{t('ifcFindings.findingView.btn.delete')}
							</Button>
							<Button variant="secondary" size="lg" onClick={startEdit}>
								<PencilSquareIcon className="h-5 w-5" />
								{t('ifcFindings.findingView.btn.edit')}
							</Button>
						</>
					)}
					{editing && (
						<>
							<Button variant="ghost" size="lg" disabled={saving} onClick={cancelEdit}>
								{t('ifcFindings.findingView.btn.cancel')}
							</Button>
							<Button variant="primary" size="lg" disabled={saving} onClick={handleSave}>
								{t('ifcFindings.findingView.btn.save')}
							</Button>
						</>
					)}
				</div>
			</div>
		</Card>
	);
}
