'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
	Button,
	buttonVariants,
	Card,
	DataTable,
	PageHeader,
	Select,
	DeleteConfirmDialog,
} from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { tryTranslate } from '@/shared/utils';
import { useI18n, useABET } from '@/providers';
import { usePrograms, useStudyPlanCourses } from '@/modules/academic/hooks';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants';
import { useRubrics, useDeleteRubric } from '../hooks';
import { mapRubricToRow } from '../utils/rubricsMappers';
import { useRubricsColumns } from '../components/rubrics-list/useRubricsColumns';
import { toSelectOption, type SelectOption, type AnyOption } from '../utils/selectOption';
import type { RubricListRow } from '../types';

export function RubricsListPage() {
	const { locale, t } = useI18n();
	const { academicPeriodId: selectedPeriodId, schoolId, modalityTypeId } = useABET();

	const [selectedProgram, setSelectedProgram] = useState<SelectOption | null>(null);
	const [selectedCourse, setSelectedCourse] = useState<SelectOption | null>(null);
	const [page, setPage] = useState(1);

	useEffect(() => {
		/* eslint-disable react-hooks/set-state-in-effect -- clear the program/course filters when the global school/period/modality context changes so stale selections aren't queried */
		setSelectedProgram(null);
		setSelectedCourse(null);
		/* eslint-enable react-hooks/set-state-in-effect */
	}, [schoolId, selectedPeriodId, modalityTypeId]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset to page 1 whenever the program/course filter changes so paging starts fresh
		setPage(1);
	}, [selectedProgram?.value, selectedCourse?.value]);

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
			page,
			pageSize: DEFAULT_PAGE_SIZE,
		}),
		[schoolId, selectedPeriodId, selectedProgram, selectedCourse, page],
	);

	const { data, isLoading, isFetching, isError, error } = useRubrics(rubricParams);
	const items = useMemo(() => (data?.items ?? []).map(mapRubricToRow), [data]);
	const totalPages = data?.totalPages ?? 1;
	const total = data?.total ?? 0;

	const [confirmTarget, setConfirmTarget] = useState<RubricListRow | null>(null);
	const deleteMutation = useDeleteRubric();
	const columns = useRubricsColumns({ setConfirmTarget });

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
							<Button variant="secondary" onClick={handleClearFilters}>
								<TrashIcon className="h-4 w-4" />
								{t('rubrics.list.clearFilters')}
							</Button>
						</div>
					)}
				</div>
			</Card>

			<DataTable
				columns={columns}
				data={items}
				isLoading={isLoading}
				errorMessage={
					isError
						? error instanceof Error
							? tryTranslate(t, error.message)
							: t('rubrics.list.error')
						: undefined
				}
				emptyMessage={t('rubrics.list.empty')}
				showSearch={false}
				serverPagination={{
					page,
					pageCount: totalPages,
					total,
					onPageChange: setPage,
					isFetching,
				}}
			/>

			<DeleteConfirmDialog
				open={!!confirmTarget}
				onOpenChange={(open) => {
					if (!open) setConfirmTarget(null);
				}}
				title={t('rubrics.list.deleteModal.title')}
				description={t('rubrics.list.deleteModal.body').replace(
					'{{course}}',
					confirmTarget ? confirmTarget.courseLabel[locale] : '',
				)}
				isPending={deleteMutation.isPending}
				cancelLabel={t('dialog.close')}
				confirmLabel={t('rubrics.list.deleteModal.confirm')}
				pendingLabel={t('rubrics.list.deleteModal.deleting')}
				onConfirm={() => {
					if (confirmTarget) {
						deleteMutation.mutate(confirmTarget.id, {
							onSuccess: () => setConfirmTarget(null),
							onError: () => setConfirmTarget(null),
						});
					}
				}}
			/>
		</div>
	);
}
