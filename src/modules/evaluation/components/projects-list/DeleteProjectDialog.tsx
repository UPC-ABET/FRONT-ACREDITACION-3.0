'use client';

import { DeleteConfirmDialog } from '@/shared/components/ui';
import { ApiError } from '@/shared/lib';
import { interpolate } from '@/shared/utils';
import { useI18n } from '@/providers';
import type { useDeleteProject } from '../../hooks';
import type { ProjectResponse } from '../../types';

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
		<DeleteConfirmDialog
			open={!!confirmTarget}
			onOpenChange={onOpenChange}
			title={t('projects.list.deleteModal.title')}
			description={interpolate(t('projects.list.deleteModal.body'), {
				name: confirmTarget
					? (confirmTarget.name[locale as 'es' | 'en'] ?? confirmTarget.name.es)
					: '',
			})}
			error={deleteError}
			isPending={deleteMutation.isPending}
			cancelLabel={t('dialog.close')}
			confirmLabel={t('projects.list.deleteModal.confirm')}
			pendingLabel={t('projects.list.deleteModal.deleting')}
			onConfirm={() => {
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
			}}
		/>
	);
}
