'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EyeIcon } from '@heroicons/react/24/outline';
import { Button, Card, DataTable, Select, SubTitle, Title } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import {
	useAccreditors,
	useCommissionOptions,
	useProgramCommissionsDetailed,
	useProgramOptions,
} from '../hooks';
import type { CourseOutcomeMappingFilterRow } from '../types';

interface CourseOutcomeMappingListProps {
	onView: (programCommissionId: number) => void;
}

interface FilterOption {
	value: number;
	label: string;
}

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

export function CourseOutcomeMappingList({ onView }: CourseOutcomeMappingListProps) {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();

	const [accreditorId, setAccreditorId] = useState<number | null>(null);
	const [commissionId, setCommissionId] = useState<number | null>(null);
	const [programId, setProgramId] = useState<number | null>(null);
	const [syncedPeriodId, setSyncedPeriodId] = useState(academicPeriodId);

	if (academicPeriodId !== syncedPeriodId) {
		setSyncedPeriodId(academicPeriodId);
		setAccreditorId(null);
		setCommissionId(null);
		setProgramId(null);
	}

	const accreditorsQuery = useAccreditors();
	const commissionsQuery = useCommissionOptions(accreditorId);
	const programsQuery = useProgramOptions(commissionId);
	const detailedQuery = useProgramCommissionsDetailed(
		{
			accreditorId: accreditorId ?? undefined,
			commissionId: commissionId ?? undefined,
			programId: programId ?? undefined,
		},
		academicPeriodId != null,
	);

	const accreditorOptions = useMemo<FilterOption[]>(
		() =>
			(accreditorsQuery.data ?? []).map((accreditor) => ({
				value: accreditor.id,
				label: `${accreditor.code} - ${localized(accreditor.name, locale)}`,
			})),
		[accreditorsQuery.data, locale],
	);

	const commissionOptions = useMemo<FilterOption[]>(
		() =>
			(commissionsQuery.data ?? []).map((commission) => ({
				value: commission.id,
				label: `${commission.code} - ${localized(commission.name, locale)}`,
			})),
		[commissionsQuery.data, locale],
	);

	const programOptions = useMemo<FilterOption[]>(
		() =>
			(programsQuery.data ?? []).map((program) => ({
				value: program.id,
				label: localized(program.name, locale) || program.code,
			})),
		[programsQuery.data, locale],
	);

	const tableRows = detailedQuery.data ?? [];

	const selectedOption = (options: FilterOption[], value: number | null) =>
		options.find((option) => option.value === value) ?? null;

	const handleAccreditorChange = (value: number | null) => {
		setAccreditorId(value);
		setCommissionId(null);
		setProgramId(null);
	};

	const handleCommissionChange = (value: number | null) => {
		setCommissionId(value);
		setProgramId(null);
	};

	const toValue = (option: { value: string | number } | null) =>
		option ? Number(option.value) : null;

	const columns = useMemo<ColumnDef<CourseOutcomeMappingFilterRow>[]>(
		() => [
			{
				accessorKey: 'accreditorCode',
				header: t('loads.courseOutcomeMappingMaintenance.col.accreditorCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				accessorKey: 'commissionCode',
				header: t('loads.courseOutcomeMappingMaintenance.col.commissionCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				id: 'program',
				header: t('loads.courseOutcomeMappingMaintenance.col.program'),
				meta: { cellClassName: 'text-zinc-800' },
				cell: ({ row }) => localized(row.original.programName, locale),
			},
			{
				accessorKey: 'academicPeriodCode',
				header: t('loads.courseOutcomeMappingMaintenance.col.academicPeriod'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				id: 'actions',
				header: t('loads.courseOutcomeMappingMaintenance.col.actions'),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							onClick={() => onView(row.original.programCommissionId)}
							aria-label={t('loads.courseOutcomeMappingMaintenance.actions.view')}
							title={t('loads.courseOutcomeMappingMaintenance.actions.view')}>
							<EyeIcon className="h-5 w-5" />
						</Button>
					</div>
				),
			},
		],
		[t, locale, onView],
	);

	return (
		<Card>
			<div className="space-y-5">
				<div className="space-y-1">
					<Title
						title={t('loads.courseOutcomeMappingMaintenance.title')}
						className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
					/>
					<SubTitle
						name={t('loads.courseOutcomeMappingMaintenance.subtitle')}
						className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
					/>
				</div>

				<DataTable
					columns={columns}
					data={tableRows}
					showSearch={false}
					showPagination={false}
					filters={
						<>
							<div className="w-full sm:w-56">
								<Select
									name="accreditor"
									aria-label={t('loads.courseOutcomeMappingMaintenance.filters.accreditor')}
									placeholder={t(
										'loads.courseOutcomeMappingMaintenance.filters.accreditorPlaceholder',
									)}
									isSearchable
									isClearable
									options={accreditorOptions}
									value={selectedOption(accreditorOptions, accreditorId)}
									onChange={(_name, value) =>
										handleAccreditorChange(toValue(value && !Array.isArray(value) ? value : null))
									}
								/>
							</div>
							<div className="w-full sm:w-56">
								<Select
									name="commission"
									aria-label={t('loads.courseOutcomeMappingMaintenance.filters.commission')}
									placeholder={t(
										'loads.courseOutcomeMappingMaintenance.filters.commissionPlaceholder',
									)}
									isSearchable
									isClearable
									isDisabled={accreditorId == null}
									options={commissionOptions}
									value={selectedOption(commissionOptions, commissionId)}
									onChange={(_name, value) =>
										handleCommissionChange(toValue(value && !Array.isArray(value) ? value : null))
									}
								/>
							</div>
							<div className="w-full sm:w-56">
								<Select
									name="program"
									aria-label={t('loads.courseOutcomeMappingMaintenance.filters.program')}
									placeholder={t(
										'loads.courseOutcomeMappingMaintenance.filters.programPlaceholder',
									)}
									isSearchable
									isClearable
									isDisabled={commissionId == null}
									options={programOptions}
									value={selectedOption(programOptions, programId)}
									onChange={(_name, value) =>
										setProgramId(toValue(value && !Array.isArray(value) ? value : null))
									}
								/>
							</div>
						</>
					}
					aria-label={t('loads.courseOutcomeMappingMaintenance.title')}
					isLoading={detailedQuery.isLoading}
					isFetching={detailedQuery.isFetching}
					errorMessage={
						detailedQuery.isError
							? t('loads.courseOutcomeMappingMaintenance.error.loadFailed')
							: undefined
					}
					emptyMessage={
						academicPeriodId == null
							? t('loads.courseOutcomeMappingMaintenance.selectPeriod')
							: t('loads.courseOutcomeMappingMaintenance.empty')
					}
				/>
			</div>
		</Card>
	);
}
