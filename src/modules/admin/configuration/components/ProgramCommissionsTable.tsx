'use client';

import { useMemo, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import {
	Button,
	DataTable,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/components';
import { useCommissions } from '@/modules/accreditation';
import { usePrograms } from '@/modules/academic';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { useApiErrorToast } from '@/shared/hooks';
import { tryTranslate } from '@/shared/utils';
import { useI18n } from '@/providers';
import { useProgramCommissions, useUnassociateProgramCommission } from '../hooks';
import type { ProgramCommissionAssociation } from '../types';

interface ProgramCommissionsTableProps {
	academicPeriodId: number;
}

export default function ProgramCommissionsTable({
	academicPeriodId,
}: ProgramCommissionsTableProps) {
	const { t, locale } = useI18n();
	const { data: rows, isLoading, error } = useProgramCommissions(academicPeriodId);
	const { data: programs } = usePrograms({ isActive: true });
	const { data: commissions } = useCommissions({ isActive: true });
	const { data: commissionTypes } = useTypesByGroupCode(TYPE_GROUP_CODES.COMMISSION_TYPE);
	const unassociate = useUnassociateProgramCommission(academicPeriodId);
	const { showToast } = useApiErrorToast();
	const [confirm, setConfirm] = useState<ProgramCommissionAssociation | null>(null);

	const programById = useMemo(() => {
		const map = new Map<number, { code: string; label: string }>();
		(programs ?? []).forEach((program) =>
			map.set(program.id, { code: program.code, label: program.name[locale] ?? program.code }),
		);
		return map;
	}, [programs, locale]);

	const commissionById = useMemo(() => {
		const map = new Map<number, { code: string; label: string }>();
		(commissions ?? []).forEach((commission) =>
			map.set(commission.id, {
				code: commission.code,
				label: commission.name[locale] ?? commission.code,
			}),
		);
		return map;
	}, [commissions, locale]);

	const commissionTypeNameById = useMemo(() => {
		const map = new Map<number, string>();
		(commissionTypes ?? []).forEach((commissionType) =>
			map.set(commissionType.id, commissionType.name[locale] ?? commissionType.code),
		);
		return map;
	}, [commissionTypes, locale]);

	const handleConfirm = () => {
		if (!confirm) return;
		unassociate.mutate(confirm.id, {
			onSuccess: () => setConfirm(null),
			onError: (err) => {
				const raw = err instanceof Error ? err.message : '';
				const translated = raw ? tryTranslate(t, raw) : raw;
				showToast(
					translated && translated !== raw
						? translated
						: t('admin.configuration.programCommissions.error.unassociateFailed'),
					'error',
				);
			},
		});
	};

	const columns = useMemo<ColumnDef<ProgramCommissionAssociation>[]>(
		() => [
			{
				id: 'program',
				header: t('admin.configuration.programCommissions.table.col.program'),
				cell: ({ row }) => {
					const program = programById.get(row.original.programId);
					return (
						<div className="flex flex-col leading-tight">
							<span className="font-medium text-zinc-900">
								{program?.label ?? `#${row.original.programId}`}
							</span>
							<span className="font-mono text-xs text-zinc-400">
								{program?.code ?? `#${row.original.programId}`}
							</span>
						</div>
					);
				},
			},
			{
				id: 'commission',
				header: t('admin.configuration.programCommissions.table.col.commission'),
				cell: ({ row }) => {
					const commission = commissionById.get(row.original.commissionId);
					return (
						<div className="flex flex-col leading-tight">
							<span className="text-zinc-700">
								{commission?.label ?? `#${row.original.commissionId}`}
							</span>
							<span className="font-mono text-xs text-zinc-400">
								{commission?.code ?? `#${row.original.commissionId}`}
							</span>
						</div>
					);
				},
			},
			{
				id: 'commissionType',
				header: t('admin.configuration.programCommissions.table.col.commissionType'),
				cell: ({ row }) => commissionTypeNameById.get(row.original.commissionTypeId) ?? '—',
			},
			{
				id: 'actions',
				header: () => (
					<span className="sr-only">
						{t('admin.configuration.programCommissions.table.col.actions')}
					</span>
				),
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setConfirm(row.original)}
							aria-label={t('admin.configuration.programCommissions.table.unassociate')}>
							<TrashIcon className="h-5 w-5" />
						</Button>
					</div>
				),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
			},
		],
		[t, programById, commissionById, commissionTypeNameById],
	);

	return (
		<>
			<DataTable<ProgramCommissionAssociation, unknown>
				columns={columns}
				data={rows ?? []}
				title={t('admin.configuration.programCommissions.table.title')}
				description={t('admin.configuration.programCommissions.table.description')}
				showSearch={false}
				isLoading={isLoading}
				errorMessage={error?.message}
				emptyMessage={t('admin.configuration.programCommissions.table.empty')}
				aria-label={t('admin.configuration.programCommissions.table.title')}
			/>

			<Dialog
				open={confirm !== null}
				onOpenChange={(o) => {
					if (!o && !unassociate.isPending) setConfirm(null);
				}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t('admin.configuration.programCommissions.unassociate.title')}
						</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-gray-600">
						{t('admin.configuration.programCommissions.unassociate.body')}
					</p>
					<DialogFooter>
						<Button
							variant="secondary"
							onClick={() => setConfirm(null)}
							disabled={unassociate.isPending}>
							{t('dialog.actions.cancel')}
						</Button>
						<Button variant="primary" onClick={handleConfirm} disabled={unassociate.isPending}>
							{unassociate.isPending
								? t('admin.configuration.programCommissions.unassociate.running')
								: t('admin.configuration.programCommissions.unassociate.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
