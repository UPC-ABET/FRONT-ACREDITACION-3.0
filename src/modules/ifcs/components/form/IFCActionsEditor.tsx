'use client';

import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { Button, Card, I18nTextField, Select, TableEmptyState, Title } from '@/shared';
import type { FormAction, FormFinding } from '@/modules';

type Props = {
	actions: FormAction[];
	findings: FormFinding[];
	onAdd: () => void;
	onUpdate: (tempId: string, patch: Partial<FormAction>) => void;
	onDelete: (tempId: string) => void;
};

export function IFCActionsEditor({ actions, findings, onAdd, onUpdate, onDelete }: Props) {
	const { t, locale: lang } = useI18n();
	const sectionTitle = t('ifcs.form.section.actions');
	const addLabel = t('ifcs.form.btn.addAction');

	const findingOptions = findings.map((f, idx) => ({
		value: f.tempId,
		label:
			f.description[lang]?.trim() ||
			f.description.es?.trim() ||
			`${t('ifcs.form.findingPlaceholder')} ${idx + 1}`,
	}));

	const noFindings = findings.length === 0;

	return (
		<section className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Title
					title={sectionTitle}
					className="[&_h2]:text-lg [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-zinc-900"
				/>
				<Button variant="secondary" size="lg" disabled={noFindings} onClick={onAdd}>
					<PlusIcon className="h-5 w-5" />
					{addLabel}
				</Button>
			</div>

			{actions.length === 0 && (
				<TableEmptyState message={`${sectionTitle} — ${addLabel.toLowerCase()}`} />
			)}

			<div className="space-y-4">
				{actions.map((a, idx) => {
					const selectedFinding = findingOptions.find((o) => o.value === a.findingTempId);
					return (
						<Card key={a.tempId}>
							<div className="-m-4">
								<div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/60 px-5 py-3">
									<span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-700">
										<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
											{idx + 1}
										</span>
										{t('ifcs.form.actionPlaceholder')}
									</span>
									<Button
										variant="ghost"
										size="md"
										onClick={() => onDelete(a.tempId)}
										aria-label={t('ifcs.form.btn.delete')}
										title={t('ifcs.form.btn.delete')}
										className="text-zinc-500 hover:text-red-600">
										<TrashIcon className="h-5 w-5" />
									</Button>
								</div>

								<div className="space-y-5 p-5">
									<Select
										label={t('ifcs.form.col.finding')}
										value={selectedFinding ?? null}
										options={findingOptions}
										onChange={(_, opt) => {
											const v = (opt as { value?: string } | null)?.value ?? '';
											onUpdate(a.tempId, { findingTempId: v });
										}}
									/>

									<I18nTextField
										label={t('ifcs.form.col.description')}
										required
										value={a.description}
										onChange={(next) => onUpdate(a.tempId, { description: next })}
									/>
								</div>
							</div>
						</Card>
					);
				})}
			</div>
		</section>
	);
}
