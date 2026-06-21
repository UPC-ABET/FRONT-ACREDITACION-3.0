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
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="surface"
						onClick={() => onEdit(row.original)}
						aria-label={t('surveys.lcfc.config.actionEdit')}>
						<PencilSquareIcon className="h-4 w-4" />
					</Button>
					<Button
						size="sm"
						variant="warning"
						onClick={() => onDelete(row.original.id)}
						aria-label={t('surveys.lcfc.config.actionDelete')}>
						<TrashIcon className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	];
}
