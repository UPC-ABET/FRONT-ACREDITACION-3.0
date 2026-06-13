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

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (name: string) => void;
	isLoading?: boolean;
};

// Remounted via `key` by the parent each time it opens, so initial state is fresh.
export function CreateCommentDialog({ isOpen, onClose, onConfirm, isLoading }: Props) {
	const { t } = useI18n();
	const [name, setName] = useState('');
	const [error, setError] = useState<string | null>(null);

	function handleSubmit() {
		const clean = name.trim();
		if (!clean) {
			setError(t('portfolio.comment.invalid'));
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
					<DialogTitle>{t('portfolio.comment.createTitle')}</DialogTitle>
				</DialogHeader>
				<div className="mt-2">
					<Input
						label={t('portfolio.comment.nameLabel')}
						placeholder={t('portfolio.comment.namePlaceholder')}
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
						{isLoading ? t('portfolio.comment.creating') : t('portfolio.comment.create')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
