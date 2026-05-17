'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { Button, Card, Select, TextArea } from '@/shared/components';
import type { CriticalityOption, FormFinding } from '../../services/types';
import { FORM_LABELS } from './formLabels';

type Props = {
	findings: FormFinding[];
	languages: string[];
	criticalities: CriticalityOption[];
	onAdd: () => void;
	onUpdate: (tempId: string, patch: Partial<FormFinding>) => void;
	onDelete: (tempId: string) => void;
};

export function IFCFindingsEditor({
	findings,
	languages,
	criticalities,
	onAdd,
	onUpdate,
	onDelete,
}: Props) {
	const { locale: lang } = useI18n();

	return (
		<section className="space-y-4">
			<h2 className="text-base font-bold uppercase tracking-wide text-zinc-700">
				{FORM_LABELS.section_findings[lang]}
			</h2>

			{findings.map((f, idx) => {
				const criticalityOption = criticalities
					.map((c) => ({
						value: c.code,
						label: c.name[lang] ?? c.name.es ?? c.code,
					}))
					.find((o) => o.value === f.criticality_code);

				return (
					<Card key={f.tempId}>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold uppercase text-zinc-500">
									{FORM_LABELS.finding_placeholder[lang]} {idx + 1}
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onDelete(f.tempId)}
									aria-label={FORM_LABELS.btn_delete[lang]}>
									<TrashIcon className="h-4 w-4" />
								</Button>
							</div>

							<div className="space-y-2">
								<label className="block text-sm font-semibold text-zinc-800">
									{FORM_LABELS.col_description[lang]}
									<span className="ml-1 text-red-600">*</span>
								</label>
								<div className="space-y-3">
									{languages.map((l) => (
										<TextArea
											key={l}
											label={l.toUpperCase()}
											value={f.description[l] ?? ''}
											onChange={(e) =>
												onUpdate(f.tempId, {
													description: { ...f.description, [l]: e.target.value },
												})
											}
										/>
									))}
								</div>
							</div>

							<Select
								label={FORM_LABELS.col_criticality[lang]}
								placeholder={FORM_LABELS.select_criticality[lang]}
								value={criticalityOption ?? null}
								options={criticalities.map((c) => ({
									value: c.code,
									label: c.name[lang] ?? c.name.es ?? c.code,
								}))}
								onChange={(_, opt) => {
									const v = (opt as { value?: string } | null)?.value ?? '';
									onUpdate(f.tempId, { criticality_code: v });
								}}
							/>
						</div>
					</Card>
				);
			})}

			<div>
				<Button variant="secondary" size="md" onClick={onAdd}>
					{FORM_LABELS.btn_add_finding[lang]}
				</Button>
			</div>
		</section>
	);
}
