'use client';

import { useMemo, useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Select,
} from '@/shared/components';
import { useI18n } from '@/providers';
import type {
	ProgramResponse,
	StudyPlanMaintenanceItem,
	StudyPlanMaintenanceUpdate,
} from '../types';

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

type Props = {
	item: StudyPlanMaintenanceItem;
	programs: ProgramResponse[];
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onSave: (body: StudyPlanMaintenanceUpdate) => void;
};

function CurrentValue({ label, value }: { label: string; value: string }) {
	return (
		<p className="mt-1 text-xs text-zinc-500">
			{label}: <span className="font-medium text-zinc-700">{value || '—'}</span>
		</p>
	);
}

export function StudyPlanEditDialog({
	item,
	programs,
	saving,
	errorMessage,
	onClose,
	onSave,
}: Props) {
	const { t, locale } = useI18n();
	const [code, setCode] = useState(item.code);
	const [programId, setProgramId] = useState<number | null>(null);

	const programOptions = useMemo(
		() =>
			programs.map((program) => ({
				value: program.id,
				label: localized(program.name, locale) || program.code,
			})),
		[programs, locale],
	);
	const selectedProgram = programOptions.find((option) => option.value === programId) ?? null;

	const canSave = code.trim() !== '' && !saving;

	const handleSubmit = () => {
		const body: StudyPlanMaintenanceUpdate = {};
		const trimmedCode = code.trim();
		if (trimmedCode && trimmedCode !== item.code) body.code = trimmedCode;
		if (programId != null) body.programId = programId;
		onSave(body);
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t('loads.studyPlansMaintenance.edit.title')}</DialogTitle>
					<DialogDescription>{t('loads.studyPlansMaintenance.edit.subtitle')}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						label={t('loads.studyPlansMaintenance.col.code')}
						value={code}
						onChange={(event) => setCode(event.target.value)}
						required
					/>
					<div>
						<Select
							name="program"
							label={t('loads.studyPlansMaintenance.col.program')}
							placeholder={t('loads.studyPlansMaintenance.edit.programPlaceholder')}
							isSearchable
							isClearable
							options={programOptions}
							value={selectedProgram}
							onChange={(_name, value) =>
								setProgramId(value && !Array.isArray(value) ? Number(value.value) : null)
							}
						/>
						<CurrentValue
							label={t('loads.studyPlansMaintenance.edit.current')}
							value={localized(item.programName, locale)}
						/>
					</div>
					{errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={saving}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" disabled={!canSave} onClick={handleSubmit}>
						{saving ? t('loading.default') : t('loads.studyPlansMaintenance.edit.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
