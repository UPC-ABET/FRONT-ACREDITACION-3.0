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

interface LCFCDeleteDialogProps {
	readonly deleteId: number | null;
	readonly onOpenChange: () => void;
	readonly onConfirm: () => void;
}

export function LCFCDeleteDialog({ deleteId, onOpenChange, onConfirm }: LCFCDeleteDialogProps) {
	const { t } = useI18n();

	return (
		<Dialog open={deleteId !== null} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('surveys.lcfc.config.deleteDialogTitle')}</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-zinc-600 py-2">{t('surveys.lcfc.config.deleteDialogBody')}</p>
				<DialogFooter showCloseButton>
					<Button variant="warning" onClick={onConfirm}>
						{t('surveys.lcfc.config.deleteConfirm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
