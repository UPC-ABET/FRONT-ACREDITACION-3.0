'use client';

import React from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/shared/components';
import { useI18n } from '@/providers';

interface LCFCCloneDialogProps {
	readonly open: boolean;
	readonly onOpenChange: (open: boolean) => void;
	readonly loading: boolean;
	readonly onConfirm: () => void;
}

export function LCFCCloneDialog({ open, onOpenChange, loading, onConfirm }: LCFCCloneDialogProps) {
	const { t } = useI18n();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('surveys.lcfc.config.cloneDialogTitle')}</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-zinc-600 py-2">{t('surveys.lcfc.config.cloneDialogBody')}</p>
				<DialogFooter showCloseButton>
					<Button onClick={onConfirm} disabled={loading}>
						{loading ? t('surveys.shared.generating') : t('surveys.lcfc.config.cloneConfirm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
