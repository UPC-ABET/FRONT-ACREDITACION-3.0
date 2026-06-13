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
	Input,
} from '@/shared/components';
import { useI18n } from '@/providers';
import type { ProfessorMaintenanceCreate } from '../types';

type Props = {
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onCreate: (body: ProfessorMaintenanceCreate) => void;
};

export function ProfessorMaintenanceCreateDialog({
	saving,
	errorMessage,
	onClose,
	onCreate,
}: Props) {
	const { t } = useI18n();
	const [code, setCode] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');

	const canSave =
		code.trim() !== '' && firstName.trim() !== '' && lastName.trim() !== '' && !saving;

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !saving) onClose();
			}}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{t('loads.maintenance.create.title')}</DialogTitle>
					<DialogDescription>{t('loads.maintenance.create.subtitle')}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						label={t('loads.maintenance.col.code')}
						value={code}
						onChange={(event) => setCode(event.target.value)}
						required
					/>
					<div className="grid gap-4 sm:grid-cols-2">
						<Input
							label={t('loads.maintenance.col.firstName')}
							value={firstName}
							onChange={(event) => setFirstName(event.target.value)}
							required
						/>
						<Input
							label={t('loads.maintenance.col.lastName')}
							value={lastName}
							onChange={(event) => setLastName(event.target.value)}
							required
						/>
					</div>
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
							onCreate({
								code: code.trim(),
								firstName: firstName.trim(),
								lastName: lastName.trim(),
							})
						}>
						{saving ? t('loading.default') : t('loads.maintenance.create.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
