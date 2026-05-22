'use client';

import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { Button, I18nTextField, Select } from '@/shared/components';
import type { FormAction, FormFinding } from '../../services/types';
import { FORM_LABELS } from './formLabels';

type Props = {
	actions: FormAction[];
	findings: FormFinding[];
	onAdd: () => void;
	onUpdate: (tempId: string, patch: Partial<FormAction>) => void;
	onDelete: (tempId: string) => void;
};

export function IFCActionsEditor({ actions, findings, onAdd, onUpdate, onDelete }: Props) {
	const { locale: lang } = useI18n();

	const findingOptions = findings.map((f, idx) => ({
		value: f.tempId,
		label:
			f.description[lang]?.trim() ||
			f.description.es?.trim() ||
			`${FORM_LABELS.finding_placeholder[lang]} ${idx + 1}`,
	}));

	const noFindings = findings.length === 0;

	return (
		<section className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-lg font-bold uppercase tracking-wide text-zinc-900">
					{FORM_LABELS.section_actions[lang]}
				</h2>
				<Button variant="secondary" size="lg" disabled={noFindings} onClick={onAdd}>
					<PlusIcon className="h-5 w-5" />
					{FORM_LABELS.btn_add_action[lang]}
				</Button>
			</div>

			{actions.length === 0 && (
				<div className="rounded-lg border border-dashed border-zinc-200 bg-white py-10 text-center text-base italic text-zinc-500">
					{FORM_LABELS.section_actions[lang]} — {FORM_LABELS.btn_add_action[lang].toLowerCase()}
				</div>
			)}

			<div className="space-y-4">
				{actions.map((a, idx) => {
					const selectedFinding = findingOptions.find((o) => o.value === a.finding_temp_id);
					return (
						<div
							key={a.tempId}
							className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
							<div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/60 px-5 py-3">
								<span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-700">
									<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
										{idx + 1}
									</span>
									{FORM_LABELS.action_placeholder[lang]}
								</span>
								<Button
									variant="ghost"
									size="md"
									onClick={() => onDelete(a.tempId)}
									aria-label={FORM_LABELS.btn_delete[lang]}
									title={FORM_LABELS.btn_delete[lang]}
									className="text-zinc-500 hover:text-red-600">
									<TrashIcon className="h-5 w-5" />
								</Button>
							</div>

							<div className="space-y-5 p-5">
								<Select
									label={FORM_LABELS.col_finding[lang]}
									value={selectedFinding ?? null}
									options={findingOptions}
									onChange={(_, opt) => {
										const v = (opt as { value?: string } | null)?.value ?? '';
										onUpdate(a.tempId, { finding_temp_id: v });
									}}
								/>

								<I18nTextField
									label={FORM_LABELS.col_description[lang]}
									required
									value={a.description}
									onChange={(next) => onUpdate(a.tempId, { description: next })}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}
