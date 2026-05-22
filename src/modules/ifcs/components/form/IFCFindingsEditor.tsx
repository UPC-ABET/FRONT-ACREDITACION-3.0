'use client';

import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { Button, I18nTextField, Select } from '@/shared/components';
import type { CriticalityOption, FormFinding } from '../../services/types';
import { FORM_LABELS } from './formLabels';

type Props = {
	findings: FormFinding[];
	criticalities: CriticalityOption[];
	onAdd: () => void;
	onUpdate: (tempId: string, patch: Partial<FormFinding>) => void;
	onDelete: (tempId: string) => void;
};

export function IFCFindingsEditor({
	findings,
	criticalities,
	onAdd,
	onUpdate,
	onDelete,
}: Props) {
	const { locale: lang } = useI18n();

	return (
		<section className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-lg font-bold uppercase tracking-wide text-zinc-900">
					{FORM_LABELS.section_findings[lang]}
				</h2>
				<Button variant="secondary" size="lg" onClick={onAdd}>
					<PlusIcon className="h-5 w-5" />
					{FORM_LABELS.btn_add_finding[lang]}
				</Button>
			</div>

			{findings.length === 0 && (
				<div className="rounded-lg border border-dashed border-zinc-200 bg-white py-10 text-center text-base italic text-zinc-500">
					{FORM_LABELS.section_findings[lang]} — {FORM_LABELS.btn_add_finding[lang].toLowerCase()}
				</div>
			)}

			<div className="space-y-4">
				{findings.map((f, idx) => {
					const criticalityOption = criticalities
						.map((c) => ({
							value: c.code,
							label: c.name[lang] ?? c.name.es ?? c.code,
						}))
						.find((o) => o.value === f.criticality_code);

					return (
						<div
							key={f.tempId}
							className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
							<div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/60 px-5 py-3">
								<span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-700">
									<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
										{idx + 1}
									</span>
									{FORM_LABELS.finding_placeholder[lang]}
								</span>
								<Button
									variant="ghost"
									size="md"
									onClick={() => onDelete(f.tempId)}
									aria-label={FORM_LABELS.btn_delete[lang]}
									title={FORM_LABELS.btn_delete[lang]}
									className="text-zinc-500 hover:text-red-600">
									<TrashIcon className="h-5 w-5" />
								</Button>
							</div>

							<div className="space-y-5 p-5">
								<I18nTextField
									label={FORM_LABELS.col_description[lang]}
									required
									value={f.description}
									onChange={(next) => onUpdate(f.tempId, { description: next })}
								/>

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
						</div>
					);
				})}
			</div>
		</section>
	);
}
