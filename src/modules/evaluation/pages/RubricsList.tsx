'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PencilSquareIcon, EyeIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
	Badge,
	Button,
	buttonVariants,
	Card,
	PageHeader,
	Select,
	Table,
	TableBody,
	TableCell,
	TableEmptyState,
	TableErrorState,
	TableHead,
	TableHeader,
	TableLoadingState,
	TableRow,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
} from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { tryTranslate } from '@/shared/utils';
import { useI18n, useABET } from '@/providers';
import { usePrograms, useStudyPlanCourses } from '@/modules/academic/hooks';
import { useRubrics, useDeleteRubric } from '../hooks';
import { mapRubricToRow } from '../utils/rubricsMappers';
import type { RubricListRow } from '../types';

type SelectOption = { label: string; value: number };
type AnyOption = { label: string; value: string | number };

function toSelectOption(opt: AnyOption | AnyOption[] | null): SelectOption | null {
	const single = Array.isArray(opt) ? (opt[0] ?? null) : opt;
	return single ? { label: single.label, value: Number(single.value) } : null;
}

export function RubricsListPage() {
	const { locale, t } = useI18n();
	const { academicPeriodId: selectedPeriodId, schoolId, modalityTypeId } = useABET();

	const [selectedProgram, setSelectedProgram] = useState<SelectOption | null>(null);
	const [selectedCourse, setSelectedCourse] = useState<SelectOption | null>(null);

	useEffect(() => {
		/* eslint-disable react-hooks/set-state-in-effect -- clear the program/course filters when the global school/period/modality context changes so stale selections aren't queried */
		setSelectedProgram(null);
		setSelectedCourse(null);
		/* eslint-enable react-hooks/set-state-in-effect */
	}, [schoolId, selectedPeriodId, modalityTypeId]);

	const { data: programs = [] } = usePrograms(
		{ isActive: true, schoolFilter: true, modalityTypeId: modalityTypeId ?? undefined },
		{ enabled: !!selectedPeriodId && !!schoolId },
	);

	const { data: evaluableSpcList = [] } = useStudyPlanCourses(
		{
			programId: selectedProgram?.value,
			extra: { isEvaluable: true },
			isActive: true,
		},
		{ enabled: !!selectedPeriodId && !!selectedProgram && !!schoolId },
	);

	const rubricParams = useMemo(
		() => ({
			...(schoolId ? { schoolId } : {}),
			...(selectedPeriodId ? { academicPeriodId: selectedPeriodId } : {}),
			...(selectedProgram ? { programId: selectedProgram.value } : {}),
			...(selectedCourse ? { courseId: selectedCourse.value } : {}),
		}),
		[schoolId, selectedPeriodId, selectedProgram, selectedCourse],
	);

	const { data, isLoading, isError, error } = useRubrics(rubricParams);
	const items = useMemo(() => (data ?? []).map(mapRubricToRow), [data]);

	const [confirmTarget, setConfirmTarget] = useState<RubricListRow | null>(null);
	const deleteMutation = useDeleteRubric();

	const programOptions = useMemo(
		() => programs.map((p) => ({ label: p.name[locale as 'es' | 'en'] ?? p.name.es, value: p.id })),
		[programs, locale],
	);

	const courseOptions = useMemo(
		() =>
			evaluableSpcList.map((spc) => {
				const name = spc.course?.name;
				const label =
					(typeof name === 'string' ? name : (name?.[locale as 'es' | 'en'] ?? name?.es)) ??
					String(spc.courseId);
				return { label, value: spc.courseId };
			}),
		[evaluableSpcList, locale],
	);

	const hasFilters = selectedProgram != null || selectedCourse != null;

	const handleClearFilters = () => {
		setSelectedProgram(null);
		setSelectedCourse(null);
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('rubrics.list.title')}
				description={t('rubrics.list.description')}
				action={
					<Link
						href="/rubrics/new"
						className={cn(
							buttonVariants({ variant: 'primary', size: 'md' }),
							'shrink-0 inline-flex items-center gap-1.5',
						)}>
						<PlusIcon className="h-4 w-4" />
						{t('rubrics.list.createButton')}
					</Link>
				}
			/>

			<Card>
				<div className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Select
							label={t('rubrics.list.filters.program')}
							options={programOptions}
							value={selectedProgram}
							isClearable
							isDisabled={!selectedPeriodId}
							onChange={(_, opt) => {
								setSelectedProgram(toSelectOption(opt as AnyOption | AnyOption[] | null));
								setSelectedCourse(null);
							}}
						/>
						<Select
							label={t('rubrics.list.filters.course')}
							options={courseOptions}
							value={selectedCourse}
							isClearable
							isDisabled={!selectedProgram}
							onChange={(_, opt) =>
								setSelectedCourse(toSelectOption(opt as AnyOption | AnyOption[] | null))
							}
						/>
					</div>

					{hasFilters && (
						<div className="flex justify-end">
							<button
								type="button"
								onClick={handleClearFilters}
								className={cn(
									buttonVariants({ variant: 'warning', size: 'md' }),
									'inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-red-100 hover:text-red-500',
								)}>
								<TrashIcon className="h-4 w-4" />
								{t('rubrics.list.clearFilters')}
							</button>
						</div>
					)}
				</div>
			</Card>

			{isLoading ? (
				<TableLoadingState label={t('rubrics.list.loading')} />
			) : isError ? (
				<TableErrorState
					message={
						error instanceof Error ? tryTranslate(t, error.message) : t('rubrics.list.error')
					}
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
								<TableHead className="w-24 text-right">
									{t('rubrics.list.columns.actions')}
								</TableHead>
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
										<div className="flex items-center justify-end gap-1">
											<Link
												href={`/rubrics/${row.id}/edit`}
												aria-label={
													row.canEdit
														? t('rubrics.list.actions.edit')
														: t('rubrics.list.actions.view')
												}
												title={
													row.canEdit
														? t('rubrics.list.actions.edit')
														: t('rubrics.list.actions.view')
												}
												className={cn(
													buttonVariants({ variant: 'ghost', size: 'icon' }),
													'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
												)}>
												{row.canEdit ? (
													<PencilSquareIcon className="h-5 w-5" />
												) : (
													<EyeIcon className="h-5 w-5" />
												)}
											</Link>
											<Button
												variant="ghost"
												size="icon"
												className="text-red-600 hover:bg-red-50"
												disabled={!row.canEdit}
												onClick={() => setConfirmTarget(row)}
												aria-label={t('rubrics.list.actions.delete')}
												title={t('rubrics.list.actions.delete')}>
												<TrashIcon className="h-5 w-5" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			<Dialog
				open={!!confirmTarget}
				onOpenChange={(open) => {
					if (!open) setConfirmTarget(null);
				}}>
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
							}}>
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
