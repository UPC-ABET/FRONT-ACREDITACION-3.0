'use client';

import { ConfirmDialog, SuccessDialog, Toast } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import type { S3Entry } from '../../types';
import { CreateCommentDialog } from './CreateCommentDialog';
import { CreateFolderDialog } from './CreateFolderDialog';
import { MoveDialog } from './MoveDialog';
import { RenameDialog } from './RenameDialog';
import { TreeViewerDialog } from './TreeViewerDialog';

type Props = {
	prefix: string;
	showCreateFolder: boolean;
	onCloseCreateFolder: () => void;
	onConfirmCreateFolder: (name: string) => void;
	creatingFolder: boolean;
	showCreateComment: boolean;
	onCloseCreateComment: () => void;
	onConfirmCreateComment: (name: string) => void;
	creatingComment: boolean;
	renameTarget: S3Entry | null;
	onCloseRename: () => void;
	onConfirmRename: (newName: string) => void;
	renaming: boolean;
	moveSources: S3Entry[] | null;
	onCloseMove: () => void;
	onConfirmMove: (destPrefix: string) => void;
	moving: boolean;
	showTree: boolean;
	onCloseTree: () => void;
	confirmDelete: S3Entry[] | null;
	onCloseConfirmDelete: () => void;
	onConfirmDelete: () => void;
	deleting: boolean;
	successMessage: string | null;
	onCloseSuccess: () => void;
	toastError: string | null;
	onCloseToast: () => void;
};

export function FileManagerDialogs({
	prefix,
	showCreateFolder,
	onCloseCreateFolder,
	onConfirmCreateFolder,
	creatingFolder,
	showCreateComment,
	onCloseCreateComment,
	onConfirmCreateComment,
	creatingComment,
	renameTarget,
	onCloseRename,
	onConfirmRename,
	renaming,
	moveSources,
	onCloseMove,
	onConfirmMove,
	moving,
	showTree,
	onCloseTree,
	confirmDelete,
	onCloseConfirmDelete,
	onConfirmDelete,
	deleting,
	successMessage,
	onCloseSuccess,
	toastError,
	onCloseToast,
}: Props) {
	const { t } = useI18n();

	return (
		<>
			<CreateFolderDialog
				key={showCreateFolder ? 'folder-open' : 'folder-closed'}
				isOpen={showCreateFolder}
				onClose={onCloseCreateFolder}
				onConfirm={onConfirmCreateFolder}
				isLoading={creatingFolder}
			/>

			<CreateCommentDialog
				key={showCreateComment ? 'comment-open' : 'comment-closed'}
				isOpen={showCreateComment}
				onClose={onCloseCreateComment}
				onConfirm={onConfirmCreateComment}
				isLoading={creatingComment}
			/>

			<RenameDialog
				key={renameTarget?.key ?? 'rename-closed'}
				isOpen={renameTarget != null}
				entry={renameTarget}
				onClose={onCloseRename}
				onConfirm={onConfirmRename}
				isLoading={renaming}
			/>

			{moveSources && (
				<MoveDialog
					key={`move-${moveSources.map((s) => s.key).join('|')}`}
					isOpen
					sources={moveSources}
					startPrefix={prefix}
					onClose={onCloseMove}
					onConfirm={onConfirmMove}
					isLoading={moving}
				/>
			)}

			<TreeViewerDialog isOpen={showTree} prefix={prefix} onClose={onCloseTree} />

			<ConfirmDialog
				isOpen={confirmDelete != null}
				onClose={onCloseConfirmDelete}
				onConfirm={onConfirmDelete}
				onDecline={onCloseConfirmDelete}
				title={t('portfolio.delete.title')}
				message={
					confirmDelete && confirmDelete.length === 1
						? t('portfolio.delete.bodyOne').replace('{{name}}', confirmDelete[0].name)
						: t('portfolio.delete.bodyMany').replace(
								'{{count}}',
								String(confirmDelete?.length ?? 0),
							)
				}
				confirmLabel={t('portfolio.delete.confirm')}
				isLoading={deleting}
			/>

			{successMessage && <SuccessDialog isOpen onClose={onCloseSuccess} message={successMessage} />}

			{toastError && <Toast isOpen type="error" onClose={onCloseToast} message={toastError} />}
		</>
	);
}
