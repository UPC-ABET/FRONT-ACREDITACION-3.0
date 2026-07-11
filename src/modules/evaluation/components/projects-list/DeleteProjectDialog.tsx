'use client';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
	Button,
} from '@/shared/components/ui';
import { ApiError } from '@/shared/lib';
import { interpolate } from '@/shared/utils';
import { useI18n } from '@/providers';
import type { useDeleteProject } from '@/modules';
import type { ProjectResponse } from '@/modules';

interface DeleteProjectDialogProps {
	confirmTarget: ProjectResponse | null;
	onOpenChange: (open: boolean) => void;
	deleteError: string | null;
	setDeleteError: (error: string | null) => void;
	deleteMutation: ReturnType<typeof useDeleteProject>;
	setConfirmTarget: (project: ProjectResponse | null) => void;
}

export function DeleteProjectDialog({
	confirmTarget,
	onOpenChange,
	deleteError,
	setDeleteError,
	deleteMutation,
	setConfirmTarget,
}: DeleteProjectDialogProps) {
	const { t, locale } = useI18n();

	return (
		<Dialog open={!!confirmTarget} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{t('projects.list.deleteModal.title')}</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-zinc-600">
					{interpolate(t('projects.list.deleteModal.body'), {
						name: confirmTarget
							? (confirmTarget.name[locale as 'es' | 'en'] ?? confirmTarget.name.es)
							: '',
					})}
				</p>
				{deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
				<DialogFooter>
					<DialogClose
						render={
							<Button variant="secondary" disabled={deleteMutation.isPending}>
								{t('dialog.close')}
							</Button>
						}
					/>
					<Button
						variant="danger"
						disabled={deleteMutation.isPending}
						onClick={() => {
							if (!confirmTarget) return;
							setDeleteError(null);
							deleteMutation.mutate(confirmTarget.id, {
								onSuccess: () => setConfirmTarget(null),
								onError: (err: unknown) => {
									const hasEvaluations =
										err instanceof ApiError && err.message === 'error.project.hasEvaluations';
									setDeleteError(
										hasEvaluations
											? t('projects.list.deleteModal.errorHasEvaluations')
											: t('projects.list.deleteModal.errorGeneric'),
									);
								},
							});
						}}>
						{deleteMutation.isPending
							? t('projects.list.deleteModal.deleting')
							: t('projects.list.deleteModal.confirm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
