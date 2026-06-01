'use client';

import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
	Button,
	Card,
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
		(programs ?? []).forEach((p) =>
			map.set(p.id, { code: p.code, label: p.name[locale] ?? p.code }),
		);
		return map;
	}, [programs, locale]);

	const commissionById = useMemo(() => {
		const map = new Map<number, { code: string; label: string }>();
		(commissions ?? []).forEach((c) =>
			map.set(c.id, { code: c.code, label: c.name[locale] ?? c.code }),
		);
		return map;
	}, [commissions, locale]);

	const commissionTypeNameById = useMemo(() => {
		const map = new Map<number, string>();
		(commissionTypes ?? []).forEach((tp) => map.set(tp.id, tp.name[locale] ?? tp.code));
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

	const list = rows ?? [];

	return (
		<>
			<Card
				title={t('admin.configuration.programCommissions.table.title')}
				description={t('admin.configuration.programCommissions.table.description')}>
				{isLoading && (
					<p className="py-8 text-center text-sm text-gray-500">
						{t('admin.configuration.programCommissions.table.loading')}
					</p>
				)}
				{error && <p className="py-4 text-sm text-red-600">{error.message}</p>}
				{!isLoading && !error && list.length === 0 && (
					<p className="py-12 text-center text-sm text-gray-400">
						{t('admin.configuration.programCommissions.table.empty')}
					</p>
				)}

				{list.length > 0 && (
					<div className="-mx-4 overflow-x-auto sm:-mx-6">
						<div className="inline-block min-w-full align-middle">
							<table className="min-w-full divide-y divide-gray-200 text-sm">
								<thead className="bg-gray-50/60">
									<tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
										<th scope="col" className="px-4 py-3 sm:px-6">
											{t('admin.configuration.programCommissions.table.col.program')}
										</th>
										<th scope="col" className="px-4 py-3">
											{t('admin.configuration.programCommissions.table.col.commission')}
										</th>
										<th scope="col" className="px-4 py-3">
											{t('admin.configuration.programCommissions.table.col.commissionType')}
										</th>
										<th scope="col" className="px-4 py-3 text-right sm:px-6">
											<span className="sr-only">
												{t('admin.configuration.programCommissions.table.col.actions')}
											</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100 bg-white">
									{list.map((row) => {
										const program = programById.get(row.programId);
										const commission = commissionById.get(row.commissionId);
										const commissionTypeLabel =
											commissionTypeNameById.get(row.commissionTypeId) ?? '—';
										return (
											<tr key={row.id} className="transition-colors hover:bg-gray-50/60">
												<td className="px-4 py-4 sm:px-6">
													<div className="flex flex-col leading-tight">
														<span className="font-medium text-gray-900">
															{program?.label ?? `#${row.programId}`}
														</span>
														<span className="font-mono text-xs text-gray-400">
															{program?.code ?? `#${row.programId}`}
														</span>
													</div>
												</td>
												<td className="px-4 py-4">
													<div className="flex flex-col leading-tight">
														<span className="text-gray-700">
															{commission?.label ?? `#${row.commissionId}`}
														</span>
														<span className="font-mono text-xs text-gray-400">
															{commission?.code ?? `#${row.commissionId}`}
														</span>
													</div>
												</td>
												<td className="px-4 py-4 text-gray-700">{commissionTypeLabel}</td>
												<td className="px-4 py-4 whitespace-nowrap text-right sm:px-6">
													<Button
														variant="secondary"
														size="sm"
														onClick={() => setConfirm(row)}
														aria-label={t(
															'admin.configuration.programCommissions.table.unassociate',
														)}>
														<Trash2 className="h-3.5 w-3.5" />
														<span className="hidden sm:inline">
															{t('admin.configuration.programCommissions.table.unassociate')}
														</span>
													</Button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</Card>

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
