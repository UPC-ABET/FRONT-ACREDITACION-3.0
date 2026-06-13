'use client';

import { useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
} from '@/shared/components/ui';
import { useI18n } from '@/providers';
import type { S3Entry } from '../../types';

type Props = {
	isOpen: boolean;
	entry: S3Entry | null;
	onClose: () => void;
	onConfirm: (newName: string) => void;
	isLoading?: boolean;
};

/** Splits a file name into base + extension; folders have no extension. */
function splitName(entry: S3Entry): string {
	if (entry.isFolder) return entry.name;
	const dot = entry.name.lastIndexOf('.');
	return dot > 0 ? entry.name.slice(0, dot) : entry.name;
}

// Remounted via `key` by the parent each time it opens, so initial state is fresh.
export function RenameDialog({ isOpen, entry, onClose, onConfirm, isLoading }: Props) {
	const { t } = useI18n();
	const [name, setName] = useState(entry ? splitName(entry) : '');
	const [error, setError] = useState<string | null>(null);

	function handleSubmit() {
		const clean = name.trim();
		if (!clean) {
			setError(t('portfolio.rename.invalid'));
			return;
		}
		onConfirm(clean);
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}>
			<DialogContent showCloseButton={false} className="max-w-md">
				<DialogHeader className="gap-0">
					<DialogTitle>{t('portfolio.rename.title')}</DialogTitle>
				</DialogHeader>
				<div className="mt-2">
					<Input
						label={t('portfolio.rename.nameLabel')}
						value={name}
						error={error ?? undefined}
						autoFocus
						onChange={(e) => {
							setName(e.target.value);
							if (error) setError(null);
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleSubmit();
						}}
					/>
				</div>
				<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button variant="secondary" onClick={onClose} disabled={isLoading}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
						{isLoading ? t('portfolio.rename.saving') : t('portfolio.rename.save')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
