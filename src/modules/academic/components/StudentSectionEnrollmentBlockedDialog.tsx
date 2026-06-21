import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';

type StudentSectionEnrollmentBlockedDialogProps = {
	reasons: string[] | null;
	onOpenChange: (open: boolean) => void;
};

export function StudentSectionEnrollmentBlockedDialog({
	reasons,
	onOpenChange,
}: StudentSectionEnrollmentBlockedDialogProps) {
	const { t } = useI18n();

	return (
		<Dialog open={reasons != null} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-2 text-red-700">
						<ExclamationTriangleIcon className="h-5 w-5" />
						<DialogTitle>
							{t('loads.studentSectionEnrollmentsMaintenance.delete.blockedTitle')}
						</DialogTitle>
					</div>
					<DialogDescription>
						{t('loads.studentSectionEnrollmentsMaintenance.delete.blockedSubtitle')}
					</DialogDescription>
				</DialogHeader>
				<ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
					{(reasons ?? []).map((reason) => (
						<li key={reason}>{tryTranslate(t, reason)}</li>
					))}
				</ul>
				<DialogFooter showCloseButton />
			</DialogContent>
		</Dialog>
	);
}
