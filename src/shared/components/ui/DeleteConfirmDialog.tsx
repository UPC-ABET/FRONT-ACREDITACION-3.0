'use client';

import type { ReactNode } from 'react';
import { Button } from './Button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from './Dialog';

interface DeleteConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: ReactNode;
	description: ReactNode;
	error?: string | null;
	isPending?: boolean;
	onConfirm: () => void;
	cancelLabel: string;
	confirmLabel: string;
	pendingLabel?: string;
	contentClassName?: string;
}

export function DeleteConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	error,
	isPending = false,
	onConfirm,
	cancelLabel,
	confirmLabel,
	pendingLabel,
	contentClassName = 'sm:max-w-sm',
}: DeleteConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className={contentClassName}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-zinc-600">{description}</p>
				{error && <p className="text-xs text-red-600">{error}</p>}
				<DialogFooter>
					<DialogClose
						render={
							<Button variant="secondary" disabled={isPending}>
								{cancelLabel}
							</Button>
						}
					/>
					<Button variant="danger" disabled={isPending} loading={isPending} onClick={onConfirm}>
						{isPending && pendingLabel ? pendingLabel : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
