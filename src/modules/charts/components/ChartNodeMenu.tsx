'use client';

import { useEffect } from 'react';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { ENTITY_TYPE, isReadOnlyEntityType } from '../constants';
import type { ChartNode } from '../types';

interface ChartNodeMenuProps {
	node: ChartNode;
	x: number;
	y: number;
	onEdit: () => void;
	onAddChild: () => void;
	onDelete: () => void;
	onClose: () => void;
}

const MENU_WIDTH = 184;

export function ChartNodeMenu({
	node,
	x,
	y,
	onEdit,
	onAddChild,
	onDelete,
	onClose,
}: ChartNodeMenuProps) {
	const { t } = useI18n();

	useEffect(() => {
		const handleKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [onClose]);

	const code = node.entityType?.code;
	const readOnly = isReadOnlyEntityType(code);
	const canAddChild = code !== ENTITY_TYPE.DEAN;

	const left = Math.min(x, window.innerWidth - MENU_WIDTH - 12);
	const top = Math.min(y, window.innerHeight - 160);

	return (
		<>
			<div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
			<div
				className="fixed z-50 w-46 min-w-46 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
				style={{ left, top, width: MENU_WIDTH }}
				role="menu">
				{!readOnly && (
					<button
						type="button"
						role="menuitem"
						onClick={onEdit}
						className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50">
						<PencilSquareIcon className="h-4 w-4 text-zinc-500" />
						<span>{t('loads.organizationChartMaintenance.actions.edit')}</span>
					</button>
				)}
				{canAddChild && (
					<button
						type="button"
						role="menuitem"
						onClick={onAddChild}
						className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50">
						<PlusIcon className="h-4 w-4 text-zinc-500" />
						<span>{t('loads.organizationChartMaintenance.actions.addChild')}</span>
					</button>
				)}
				{!readOnly && (
					<button
						type="button"
						role="menuitem"
						onClick={onDelete}
						className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50">
						<TrashIcon className="h-4 w-4" />
						<span>{t('loads.organizationChartMaintenance.actions.delete')}</span>
					</button>
				)}
			</div>
		</>
	);
}
