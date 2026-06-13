'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PencilSquareIcon, EyeIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
	Badge,
	Button,
	buttonVariants,
	Select,
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
import { LoadingState } from '@/shared/components';
import { cn } from '@/shared/lib/utils';
import { useI18n, useABET } from '@/providers';
import { programsService, coursesService } from '@/modules/academic/services';
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
	const { academicPeriodId: selectedPeriodId, schoolId } = useABET();

	const [selectedProgram, setSelectedProgram] = useState<SelectOption | null>(null);
	const [selectedCourse, setSelectedCourse] = useState<SelectOption | null>(null);

	const { data: programs = [] } = useQuery({
		queryKey: ['programs', 'filtered', { schoolId, academicPeriodId: selectedPeriodId }],
		queryFn: () =>
			programsService
				.getByFilters({ schoolId: schoolId!, academicPeriodId: selectedPeriodId!, isActive: true })
				.then((r) => r.data),
		enabled: !!selectedPeriodId && !!schoolId,
	});

	const { data: courses = [] } = useQuery({
		queryKey: [
			'courses',
			'filtered',
			{ schoolId, academicPeriodId: selectedPeriodId, programId: selectedProgram?.value },
		],
		queryFn: () =>
			coursesService
				.getByFilters({
					schoolId: schoolId!,
					academicPeriodId: selectedPeriodId!,
					programId: selectedProgram!.value,
					isActive: true,
				})
				.then((r) => r.data),
		enabled: !!selectedPeriodId && !!selectedProgram && !!schoolId,
	});

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
		() => courses.map((c) => ({ label: c.name[locale as 'es' | 'en'] ?? c.name.es, value: c.id })),
		[courses, locale],
	);

	const hasFilters = selectedProgram != null || selectedCourse != null;

	const handleClearFilters = () => {
		setSelectedProgram(null);
		setSelectedCourse(null);
	};

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-zinc-900">{t('rubrics.list.title')}</h1>
					<p className="mt-2 text-zinc-600">{t('rubrics.list.description')}</p>
				</div>
				<Link
					href="/rubrics/new"
					className={cn(
						buttonVariants({ variant: 'primary', size: 'md' }),
						'shrink-0 inline-flex items-center gap-1.5',
					)}>
					<PlusIcon className="h-4 w-4" />
					{t('rubrics.list.createButton')}
				</Link>
			</div>

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

			{isLoading ? (
				<div className="rounded-xl border border-zinc-200 bg-white p-10 shadow-sm">
					<LoadingState label={t('rubrics.list.loading')} />
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
								<TableHead className="w-24 text-center">
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
										<div className="flex items-center justify-center gap-1">
											<Link
												href={`/rubrics/${row.id}/edit`}
												title={
													row.canEdit
														? t('rubrics.list.actions.edit')
														: t('rubrics.list.actions.view')
												}
												className={cn(
													'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
													row.canEdit
														? 'text-zinc-500 hover:bg-blue-50 hover:text-blue-600'
														: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700',
												)}>
												{row.canEdit ? (
													<PencilSquareIcon className="h-4 w-4" />
												) : (
													<EyeIcon className="h-4 w-4" />
												)}
											</Link>
											<button
												type="button"
												disabled={!row.canEdit}
												onClick={() => setConfirmTarget(row)}
												title={t('rubrics.list.actions.delete')}
												className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30">
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
