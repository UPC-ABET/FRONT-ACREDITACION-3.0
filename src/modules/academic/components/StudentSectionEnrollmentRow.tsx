import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, TableCell, TableRow } from '@/shared';
import type { StudentSectionEnrollmentMaintenanceItem } from '../types';

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

function RowActions({
	onEdit,
	onDelete,
	editLabel,
	deleteLabel,
}: {
	onEdit: () => void;
	onDelete: () => void;
	editLabel: string;
	deleteLabel: string;
}) {
	return (
		<div className="flex items-center justify-end gap-1">
			<Button variant="ghost" size="icon" onClick={onEdit} aria-label={editLabel} title={editLabel}>
				<PencilSquareIcon className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="text-red-600 hover:bg-red-50"
				onClick={onDelete}
				aria-label={deleteLabel}
				title={deleteLabel}>
				<TrashIcon className="h-4 w-4" />
			</Button>
		</div>
	);
}

type StudentSectionEnrollmentRowProps = {
	item: StudentSectionEnrollmentMaintenanceItem;
	locale: string;
	editLabel: string;
	deleteLabel: string;
	onEdit: (item: StudentSectionEnrollmentMaintenanceItem) => void;
	onDelete: (item: StudentSectionEnrollmentMaintenanceItem) => void;
};

export function StudentSectionEnrollmentRow({
	item,
	locale,
	editLabel,
	deleteLabel,
	onEdit,
	onDelete,
}: StudentSectionEnrollmentRowProps) {
	return (
		<TableRow key={item.id}>
			<TableCell className="text-zinc-800">{localized(item.courseName, locale)}</TableCell>
			<TableCell className="font-mono text-zinc-700">{item.courseCode}</TableCell>
			<TableCell className="font-mono text-zinc-700">{item.sectionCode}</TableCell>
			<TableCell className="font-mono text-zinc-700">{item.studentCode}</TableCell>
			<TableCell className="text-zinc-700">
				{item.studentFirstName} {item.studentLastName}
			</TableCell>
			<TableCell>
				<RowActions
					onEdit={() => onEdit(item)}
					onDelete={() => onDelete(item)}
					editLabel={editLabel}
					deleteLabel={deleteLabel}
				/>
			</TableCell>
		</TableRow>
	);
}

export function StudentSectionEnrollmentCard({
	item,
	locale,
	editLabel,
	deleteLabel,
	onEdit,
	onDelete,
}: StudentSectionEnrollmentRowProps) {
	return (
		<li key={item.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<p className="truncate font-medium text-zinc-900">{localized(item.courseName, locale)}</p>
					<p className="flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-500">
						<span>{item.courseCode}</span>
						<span>·</span>
						<span>{item.sectionCode}</span>
					</p>
					<p className="text-sm text-zinc-600">
						<span className="font-mono text-zinc-500">{item.studentCode}</span>{' '}
						{item.studentFirstName} {item.studentLastName}
					</p>
				</div>
				<div className="shrink-0">
					<RowActions
						onEdit={() => onEdit(item)}
						onDelete={() => onDelete(item)}
						editLabel={editLabel}
						deleteLabel={deleteLabel}
					/>
				</div>
			</div>
		</li>
	);
}
