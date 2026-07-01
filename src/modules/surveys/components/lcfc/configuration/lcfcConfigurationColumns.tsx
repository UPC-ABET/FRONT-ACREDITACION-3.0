import React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Button, Badge } from '@/shared/components';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { LCFCCourse } from '../../../types';

interface BuildLCFCColumnsArgs {
	t: (key: string) => string;
	onEdit: (course: LCFCCourse) => void;
	onDelete: (id: number) => void;
}

export function buildLCFCConfigurationColumns({
	t,
	onEdit,
	onDelete,
}: BuildLCFCColumnsArgs): ColumnDef<LCFCCourse>[] {
	return [
		{ accessorKey: 'code', header: t('surveys.lcfc.config.colCode') },
		{ accessorKey: 'courseName', header: t('surveys.lcfc.config.colCourse') },
		{
			accessorKey: 'isActive',
			header: t('surveys.lcfc.config.colStatus'),
			cell: ({ getValue }) => {
				// NOSONAR — cell renderers are render functions, not React components
				const isActive = getValue() as boolean;
				return (
					<Badge variant={isActive ? 'success' : 'outline'}>
						{isActive
							? t('surveys.lcfc.config.statusActive')
							: t('surveys.lcfc.config.statusInactive')}
					</Badge>
				);
			},
		},
		{
			id: 'actions',
			header: t('surveys.lcfc.config.colActions'),
			cell: ({ row }) => (
				// NOSONAR — cell renderers are render functions, not React components
				<div className="flex items-center justify-end gap-1">
					<Button
						size="icon"
						variant="ghost"
						className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
						onClick={() => onEdit(row.original)}
						aria-label={t('surveys.lcfc.config.actionEdit')}>
						<PencilSquareIcon className="h-5 w-5" />
					</Button>
					<Button
						size="icon"
						variant="ghost"
						className="text-red-600 hover:bg-red-50"
						onClick={() => onDelete(row.original.id)}
						aria-label={t('surveys.lcfc.config.actionDelete')}>
						<TrashIcon className="h-5 w-5" />
					</Button>
				</div>
			),
			meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
		},
	];
}
