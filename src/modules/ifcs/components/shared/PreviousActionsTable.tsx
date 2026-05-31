'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { LockClosedIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
	Badge,
	Button,
	Card,
	DataTable,
	FormDialog,
	I18nTextField,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { TYPE_CODES } from '@/shared/constants';
import type { I18nText, PreviousAction } from '../../types';
import { IFC_SHARED_LABELS as L } from './ifc.labels';

type Mode = 'view' | 'edit';

type Props = {
	previousActions: PreviousAction[] | undefined;
	mode: Mode;
	evidencesByActionId?: Record<number, I18nText | null>;
	onEvidenceChange?: (findingActionId: number, evidences: I18nText | null) => void;
};

export function PreviousActionsTable({
	previousActions,
	mode,
	evidencesByActionId,
	onEvidenceChange,
}: Props) {
	const { locale: lang } = useI18n();
	const rows = previousActions ?? [];

	const columns = useMemo<ColumnDef<PreviousAction>[]>(
		() => [
			{ accessorKey: 'code', header: L.colCode[lang] },
			{
				id: 'description',
				header: L.colDescription[lang],
				accessorFn: (row) => row.description?.[lang] ?? row.description?.es ?? '',
				cell: ({ row }) => (
					<span className="whitespace-pre-line text-base leading-relaxed">
						{row.original.description?.[lang] ?? row.original.description?.es ?? ''}
					</span>
				),
			},
			{
				id: 'finding',
				accessorFn: (row) => row.finding.code,
				header: L.colFinding[lang],
				cell: ({ row }) => (
					<span className="tabular-nums text-zinc-700">{row.original.finding.code}</span>
				),
			},
			{
				id: 'completeness',
				accessorFn: (row) => row.completeness.code,
				header: L.colCompleteness[lang],
				cell: ({ row }) => (
					<Badge color={row.original.completeness.color}>
						{row.original.completeness.name?.[lang] ?? row.original.completeness.name?.es ?? ''}
					</Badge>
				),
			},
			{
				id: 'evidence',
				header: L.colEvidence[lang],
				cell: ({ row }) => (
					<EvidenceCell
						action={row.original}
						mode={mode}
						liveEvidences={evidencesByActionId?.[row.original.findingActionId]}
						onChange={onEvidenceChange}
					/>
				),
			},
		],
		[lang, mode, evidencesByActionId, onEvidenceChange],
	);

	if (rows.length === 0) return null;

	return (
		<Card title={L.sectionPreviousActions[lang]}>
			<div className="overflow-x-auto">
				<DataTable<PreviousAction, unknown>
					columns={columns}
					data={rows}
					showSearch={false}
					showPagination={false}
				/>
			</div>
		</Card>
	);
}

type CellProps = {
	action: PreviousAction;
	mode: Mode;
	liveEvidences: I18nText | null | undefined;
	onChange?: (findingActionId: number, evidences: I18nText | null) => void;
};

function EvidenceCell({ action, mode, liveEvidences, onChange }: CellProps) {
	const { locale: lang } = useI18n();
	const lockedByServer = action.completeness.code === TYPE_CODES.ACTION_COMPLETENESS.IMPLEMENTED;
	const editable = mode === 'edit' && !lockedByServer;

	const evidences = liveEvidences !== undefined ? liveEvidences : action.evidences;
	const hasContent = Boolean(evidences && (evidences.es?.trim() || evidences.en?.trim()));

	const [modalOpen, setModalOpen] = useState(false);

	if (editable) {
		return (
			<>
				<Button
					variant={hasContent ? 'secondary' : 'ghost'}
					size="sm"
					onClick={() => setModalOpen(true)}
					className="inline-flex items-center gap-1.5">
					{hasContent ? <PencilSquareIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
					{hasContent ? L.evidenceEdit[lang] : L.evidenceAdd[lang]}
				</Button>
				{modalOpen && (
					<EvidenceEditDialog
						onClose={() => setModalOpen(false)}
						action={action}
						value={evidences ?? {}}
						onSave={(next) => {
							onChange?.(action.findingActionId, hasEvidenceText(next) ? next : null);
							setModalOpen(false);
						}}
					/>
				)}
			</>
		);
	}

	if (!hasContent) return <span className="text-zinc-400">—</span>;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="inline-flex items-center gap-1.5 text-zinc-600">
					{lockedByServer && mode === 'edit' && <LockClosedIcon className="h-4 w-4" />}
					{L.evidenceView[lang]}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end">
				<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
					{L.colEvidence[lang]}
				</p>
				<p className="whitespace-pre-line text-sm text-zinc-700">
					{evidences?.[lang] ?? evidences?.es ?? evidences?.en ?? ''}
				</p>
			</PopoverContent>
		</Popover>
	);
}

type DialogProps = {
	onClose: () => void;
	action: PreviousAction;
	value: I18nText;
	onSave: (next: I18nText) => void;
};

function EvidenceEditDialog({ onClose, action, value, onSave }: DialogProps) {
	const { locale: lang } = useI18n();
	const [draft, setDraft] = useState<I18nText>(value);

	return (
		<FormDialog
			isOpen
			onClose={onClose}
			onSubmit={() => onSave(draft)}
			title={`${L.evidenceModalTitle[lang]}${action.code}`}>
			<I18nTextField value={draft} onChange={setDraft} rows={5} />
		</FormDialog>
	);
}

function hasEvidenceText(value: I18nText): boolean {
	return Object.values(value).some((v) => (v ?? '').trim().length > 0);
}
