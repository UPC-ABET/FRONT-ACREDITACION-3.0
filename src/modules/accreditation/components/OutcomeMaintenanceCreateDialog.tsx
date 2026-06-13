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
	I18nTextField,
	Input,
	Select,
} from '@/shared/components';
import { useI18n } from '@/providers';
import type { I18nText } from '@/shared/types';
import type { OutcomeCommissionOption, OutcomeMaintenanceCreate } from '../types';

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

function hasText(text: I18nText): boolean {
	return (text.es ?? '').trim() !== '' || (text.en ?? '').trim() !== '';
}

type Props = {
	programId: number;
	commissions: OutcomeCommissionOption[];
	commissionsLoading: boolean;
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onCreate: (body: OutcomeMaintenanceCreate) => void;
};

export function OutcomeMaintenanceCreateDialog({
	programId,
	commissions,
	commissionsLoading,
	saving,
	errorMessage,
	onClose,
	onCreate,
}: Props) {
	const { t, locale } = useI18n();
	const [commissionId, setCommissionId] = useState<number | null>(null);
	const [code, setCode] = useState('');
	const [name, setName] = useState<I18nText>({ es: '', en: '' });
	const [description, setDescription] = useState<I18nText>({ es: '', en: '' });

	const commissionOptions = useMemo(
		() =>
			commissions.map((commission) => ({
				value: commission.id,
				label: `${commission.code} — ${localized(commission.name, locale)}`,
			})),
		[commissions, locale],
	);
	const selectedCommission =
		commissionOptions.find((option) => option.value === commissionId) ?? null;

	const canSave = code.trim() !== '' && commissionId != null && hasText(name) && !saving;

	const handleSubmit = () => {
		if (commissionId == null) return;
		const body: OutcomeMaintenanceCreate = {
			outcomeCode: code.trim(),
			outcomeName: { es: name.es ?? '', en: name.en ?? '' },
			programId,
			commissionId,
		};
		if (hasText(description)) {
			body.outcomeDescription = { es: description.es ?? '', en: description.en ?? '' };
		}
		onCreate(body);
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>{t('loads.outcomesMaintenance.create.title')}</DialogTitle>
					<DialogDescription>{t('loads.outcomesMaintenance.create.subtitle')}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Select
						name="commission"
						label={t('loads.outcomesMaintenance.col.commissionCode')}
						placeholder={t('loads.outcomesMaintenance.create.commissionPlaceholder')}
						isSearchable
						isClearable
						isDisabled={commissionsLoading}
						options={commissionOptions}
						value={selectedCommission}
						onChange={(_name, value) =>
							setCommissionId(value && !Array.isArray(value) ? Number(value.value) : null)
						}
					/>
					<Input
						label={t('loads.outcomesMaintenance.col.outcomeCode')}
						value={code}
						onChange={(event) => setCode(event.target.value)}
						required
					/>
					<I18nTextField
						as="input"
						layout="row"
						required
						label={t('loads.outcomesMaintenance.col.outcomeName')}
						value={name}
						onChange={setName}
					/>
					<I18nTextField
						layout="row"
						rows={4}
						label={t('loads.outcomesMaintenance.col.outcomeDescription')}
						value={description}
						onChange={setDescription}
					/>
					{errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose} disabled={saving}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" disabled={!canSave} loading={saving} onClick={handleSubmit}>
						{t('loads.outcomesMaintenance.create.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
