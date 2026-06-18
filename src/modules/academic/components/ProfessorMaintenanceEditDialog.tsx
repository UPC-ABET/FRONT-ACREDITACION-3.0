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
import type { ProfessorMaintenanceItem, ProfessorMaintenanceUpdate } from '../types';

type Props = {
	item: ProfessorMaintenanceItem;
	saving: boolean;
	errorMessage: string | null;
	onClose: () => void;
	onSave: (body: ProfessorMaintenanceUpdate) => void;
};

export function ProfessorMaintenanceEditDialog({
	item,
	saving,
	errorMessage,
	onClose,
	onSave,
}: Props) {
	const { t } = useI18n();
	const [code, setCode] = useState(item.code);
	const [firstName, setFirstName] = useState(item.firstName);
	const [lastName, setLastName] = useState(item.lastName);
	const [email, setEmail] = useState(item.staffEmail ?? '');

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
					<DialogTitle>{t('loads.maintenance.edit.title')}</DialogTitle>
					<DialogDescription>{t('loads.maintenance.edit.subtitle')}</DialogDescription>
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
					<Input
						type="email"
						label={t('loads.maintenance.col.email')}
						value={email}
						onChange={(event) => setEmail(event.target.value)}
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
						onClick={() =>
							onSave({
								code: code.trim(),
								firstName: firstName.trim(),
								lastName: lastName.trim(),
								staffEmail: email.trim() || null,
							})
						}>
						{t('loads.maintenance.edit.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
