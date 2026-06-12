'use client';

import { useState } from 'react';
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
} from '@/shared/components';
import { useI18n } from '@/providers';
import type { I18nText } from '@/shared/types';
import type { OutcomeMaintenanceItem, OutcomeMaintenanceUpdate } from '../types';

type Props = {
	item: OutcomeMaintenanceItem;
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onSave: (body: OutcomeMaintenanceUpdate) => void;
};

function asI18n(text: { es?: string; en?: string } | undefined): I18nText {
	return { es: text?.es ?? '', en: text?.en ?? '' };
}

export function OutcomeMaintenanceEditDialog({
	item,
	saving,
	errorMessage,
	onClose,
	onSave,
}: Props) {
	const { t } = useI18n();
	const [code, setCode] = useState(item.outcomeCode);
	const [name, setName] = useState<I18nText>(() => asI18n(item.outcomeName));
	const [description, setDescription] = useState<I18nText>(() => asI18n(item.outcomeDescription));

	const canSave = code.trim() !== '' && !saving;

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>{t('loads.outcomesMaintenance.edit.title')}</DialogTitle>
					<DialogDescription>{t('loads.outcomesMaintenance.edit.subtitle')}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						label={t('loads.outcomesMaintenance.col.outcomeCode')}
						value={code}
						onChange={(event) => setCode(event.target.value)}
						required
					/>
					<I18nTextField
						as="input"
						layout="row"
						label={t('loads.outcomesMaintenance.col.outcomeName')}
						value={name}
						onChange={setName}
					/>
					<I18nTextField
						layout="row"
						rows={3}
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
					<Button
						variant="primary"
						disabled={!canSave}
						onClick={() =>
							onSave({
								outcomeCode: code.trim(),
								outcomeName: { es: name.es ?? '', en: name.en ?? '' },
								outcomeDescription: { es: description.es ?? '', en: description.en ?? '' },
							})
						}>
						{saving ? t('loading.default') : t('loads.outcomesMaintenance.edit.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
