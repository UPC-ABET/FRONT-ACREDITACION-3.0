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
import type { ProgramResponse, StudyPlanMaintenanceCreate } from '../types';

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

type Props = {
	programs: ProgramResponse[];
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onCreate: (body: StudyPlanMaintenanceCreate) => void;
};

const CODE_MAX_LENGTH = 10;

export function StudyPlanCreateDialog({
	programs,
	saving,
	errorMessage,
	onClose,
	onCreate,
}: Props) {
	const { t, locale } = useI18n();
	const [code, setCode] = useState('');
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

	const canSave = code.trim() !== '' && programId != null && !saving;

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t('loads.studyPlansMaintenance.create.title')}</DialogTitle>
					<DialogDescription>{t('loads.studyPlansMaintenance.create.subtitle')}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						label={t('loads.studyPlansMaintenance.col.code')}
						value={code}
						maxLength={CODE_MAX_LENGTH}
						onChange={(event) => setCode(event.target.value)}
						required
					/>
					<Select
						name="program"
						label={t('loads.studyPlansMaintenance.col.program')}
						placeholder={t('loads.studyPlansMaintenance.create.programPlaceholder')}
						isSearchable
						isClearable
						options={programOptions}
						value={selectedProgram}
						onChange={(_name, value) =>
							setProgramId(value && !Array.isArray(value) ? Number(value.value) : null)
						}
					/>
					{errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={saving}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button
						variant="primary"
						disabled={!canSave}
						loading={saving}
						onClick={() => {
							if (programId == null) return;
							onCreate({ code: code.trim(), programId });
						}}>
						{t('loads.studyPlansMaintenance.create.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
