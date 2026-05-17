'use client';

import { useState } from 'react';
import { Badge, Button, Card, TextArea } from '@/shared/components';
import { useI18n } from '@/providers';
import { CRITICALITY_VARIANT } from '../../constants';
import type { FindingDetail, I18nText } from '../../services/types';
import { FINDING_VIEW_LABELS as L } from './findingViewLabels';

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
	const { locale: lang } = useI18n();
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
		finding.criticality.name?.[lang] ??
		finding.criticality.name?.es ??
		finding.criticality.code;

	const descriptionText = finding.description?.[lang] ?? finding.description?.es ?? '';

	return (
		<Card title={L.section_general[lang]}>
			<div className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
							{L.col_code[lang]}
						</p>
						<p className="text-sm text-zinc-600">{finding.finding_code}</p>
					</div>
					<div>
						<p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
							{L.col_period[lang]}
						</p>
						<p className="text-sm text-zinc-600">{finding.academic_period_code}</p>
					</div>
				</div>

				<div>
					<p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">
						{L.col_criticality[lang]}
					</p>
					<Badge variant={CRITICALITY_VARIANT[finding.criticality.code] ?? 'default'}>
						{criticalityLabel}
					</Badge>
				</div>

				<div>
					<p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">
						{L.col_description[lang]}
					</p>
					{editing ? (
						<div className="space-y-3">
							{languages.map((l) => (
								<TextArea
									key={l}
									label={l.toUpperCase()}
									value={draft[l] ?? ''}
									onChange={(e) =>
										setDraft((p) => ({ ...p, [l]: e.target.value }))
									}
									disabled={saving}
								/>
							))}
						</div>
					) : (
						<p className="text-sm text-zinc-600 whitespace-pre-line">{descriptionText}</p>
					)}
				</div>

				<div className="flex justify-end gap-2 pt-2">
					{!editing && (
						<>
							<Button variant="ghost" size="md" onClick={onDelete}>
								{L.btn_delete[lang]}
							</Button>
							<Button variant="secondary" size="md" onClick={startEdit}>
								{L.btn_edit[lang]}
							</Button>
						</>
					)}
					{editing && (
						<>
							<Button variant="ghost" size="md" disabled={saving} onClick={cancelEdit}>
								{L.btn_cancel[lang]}
							</Button>
							<Button
								variant="primary"
								size="md"
								disabled={saving}
								onClick={handleSave}>
								{L.btn_save[lang]}
							</Button>
						</>
					)}
				</div>
			</div>
		</Card>
	);
}
