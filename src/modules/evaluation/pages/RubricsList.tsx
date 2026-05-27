'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PencilSquareIcon, EyeIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
	Badge,
	Button,
	buttonVariants,
	Table,
	TableBody,
	TableCell,
	TableEmptyState,
	TableErrorState,
	TableHead,
	TableHeader,
	TableRow,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
} from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import { useRubrics, useDeleteRubric } from '../hooks';
import { mapRubricToRow } from '../utils/rubricsMappers';
import type { RubricListRow } from '../types';

export function RubricsListPage() {
	const { locale, t } = useI18n();
	const { data, isLoading, isError, error } = useRubrics();
	const items = useMemo(() => (data ?? []).map(mapRubricToRow), [data]);

	const [confirmTarget, setConfirmTarget] = useState<RubricListRow | null>(null);

	const deleteMutation = useDeleteRubric();

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-zinc-900">{t('rubrics.list.title')}</h1>
					<p className="mt-2 text-zinc-600">{t('rubrics.list.description')}</p>
				</div>
				<Link
					href="/rubrics/new"
					className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'shrink-0 inline-flex items-center gap-1.5')}>
					<PlusIcon className="h-4 w-4" />
					{t('rubrics.list.createButton')}
				</Link>
			</div>

			{isLoading ? (
				<div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
					{t('rubrics.list.loading')}
				</div>
			) : isError ? (
				<TableErrorState
					message={error instanceof Error ? error.message : t('rubrics.list.error')}
				/>
			) : !items.length ? (
				<TableEmptyState message={t('rubrics.list.empty')} />
			) : (
				<div className="space-y-3">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t('rubrics.list.columns.course')}</TableHead>
								<TableHead>{t('rubrics.list.columns.period')}</TableHead>
								<TableHead>{t('rubrics.list.columns.gradeType')}</TableHead>
								<TableHead>{t('rubrics.list.columns.rubricType')}</TableHead>
								<TableHead className="w-24 text-center">{t('rubrics.list.columns.actions')}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((row) => (
								<TableRow key={row.id}>
									<TableCell>
										<span className="font-medium text-zinc-900">{row.courseLabel[locale]}</span>
									</TableCell>
									<TableCell>
										<span className="text-zinc-700">{row.periodLabel}</span>
									</TableCell>
									<TableCell>
										<span className="text-zinc-700">{row.gradeTypeLabel[locale]}</span>
									</TableCell>
									<TableCell>
										{row.isCapstone ? (
											<Badge variant="success">Capstone</Badge>
										) : (
											<Badge variant="outline">No Capstone</Badge>
										)}
									</TableCell>
									<TableCell>
										<div className="flex items-center justify-center gap-1">
											<Link
												href={`/rubrics/${row.id}/edit`}
												title={row.canEdit ? t('rubrics.list.actions.edit') : t('rubrics.list.actions.view')}
												className={cn(
													'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
													row.canEdit
														? 'text-zinc-500 hover:bg-blue-50 hover:text-blue-600'
														: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700',
												)}>
												{row.canEdit
													? <PencilSquareIcon className="h-4 w-4" />
													: <EyeIcon className="h-4 w-4" />}
											</Link>
											<button
												type="button"
												disabled={!row.canEdit}
												onClick={() => setConfirmTarget(row)}
												title={t('rubrics.list.actions.delete')}
												className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
											>
												<TrashIcon className="h-4 w-4" />
											</button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Confirm delete modal */}
			<Dialog open={!!confirmTarget} onOpenChange={(open) => { if (!open) setConfirmTarget(null); }}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>{t('rubrics.list.deleteModal.title')}</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-zinc-600">
						{t('rubrics.list.deleteModal.body').replace(
							'{{course}}',
							confirmTarget ? confirmTarget.courseLabel[locale] : '',
						)}
					</p>
					<DialogFooter>
						<DialogClose
							render={
								<Button variant="secondary" disabled={deleteMutation.isPending}>
									{t('dialog.close')}
								</Button>
							}
						/>
						<Button
							variant="primary"
							className="bg-red-600 hover:bg-red-700"
							disabled={deleteMutation.isPending}
							onClick={() => {
								if (confirmTarget) {
									deleteMutation.mutate(confirmTarget.id, {
										onSuccess: () => setConfirmTarget(null),
										onError: () => setConfirmTarget(null),
									});
								}
							}}
						>
							{deleteMutation.isPending
								? t('rubrics.list.deleteModal.deleting')
								: t('rubrics.list.deleteModal.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
