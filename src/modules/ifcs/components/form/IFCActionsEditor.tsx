'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { Button, Card, Select, TextArea } from '@/shared/components';
import type { FormAction, FormFinding } from '../../services/types';
import { FORM_LABELS } from './formLabels';

type Props = {
	actions: FormAction[];
	findings: FormFinding[];
	languages: string[];
	onAdd: () => void;
	onUpdate: (tempId: string, patch: Partial<FormAction>) => void;
	onDelete: (tempId: string) => void;
};

export function IFCActionsEditor({
	actions,
	findings,
	languages,
	onAdd,
	onUpdate,
	onDelete,
}: Props) {
	const { locale: lang } = useI18n();

	const findingOptions = findings.map((f, idx) => ({
		value: f.tempId,
		label:
			f.description[lang]?.trim() ||
			f.description.es?.trim() ||
			`${FORM_LABELS.finding_placeholder[lang]} ${idx + 1}`,
	}));

	return (
		<section className="space-y-4">
			<h2 className="text-base font-bold uppercase tracking-wide text-zinc-700">
				{FORM_LABELS.section_actions[lang]}
			</h2>

			{actions.map((a, idx) => {
				const selectedFinding = findingOptions.find((o) => o.value === a.finding_temp_id);
				return (
					<Card key={a.tempId}>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold uppercase text-zinc-500">
									{FORM_LABELS.action_placeholder[lang]} {idx + 1}
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onDelete(a.tempId)}
									aria-label={FORM_LABELS.btn_delete[lang]}>
									<TrashIcon className="h-4 w-4" />
								</Button>
							</div>

							<Select
								label={FORM_LABELS.col_finding[lang]}
								value={selectedFinding ?? null}
								options={findingOptions}
								onChange={(_, opt) => {
									const v = (opt as { value?: string } | null)?.value ?? '';
									onUpdate(a.tempId, { finding_temp_id: v });
								}}
							/>

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
											value={a.description[l] ?? ''}
											onChange={(e) =>
												onUpdate(a.tempId, {
													description: { ...a.description, [l]: e.target.value },
												})
											}
										/>
									))}
								</div>
							</div>
						</div>
					</Card>
				);
			})}

			<div>
				<Button
					variant="secondary"
					size="md"
					disabled={findings.length === 0}
					onClick={onAdd}
					title={findings.length === 0 ? FORM_LABELS.btn_add_finding[lang] : undefined}>
					{FORM_LABELS.btn_add_action[lang]}
				</Button>
			</div>
		</section>
	);
}
