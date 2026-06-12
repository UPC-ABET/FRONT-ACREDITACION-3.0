'use client';

import { useMemo, useState } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	Select,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import {
	useAccreditors,
	useCommissionOptions,
	useProgramCommissionsDetailed,
	useProgramOptions,
} from '../hooks';

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

	const renderNotice = (message: string) => (
		<div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
			<p className="text-sm text-zinc-500">{message}</p>
		</div>
	);

	return (
		<Card>
			<div className="space-y-5">
				<div className="space-y-1">
					<h2 className="text-lg font-semibold text-gray-900">
						{t('loads.courseOutcomeMappingMaintenance.title')}
					</h2>
					<p className="text-sm text-gray-500">
						{t('loads.courseOutcomeMappingMaintenance.subtitle')}
					</p>
				</div>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<Select
						name="accreditor"
						label={t('loads.courseOutcomeMappingMaintenance.filters.accreditor')}
						placeholder={t('loads.courseOutcomeMappingMaintenance.filters.accreditorPlaceholder')}
						isSearchable
						isClearable
						options={accreditorOptions}
						value={selectedOption(accreditorOptions, accreditorId)}
						onChange={(_name, value) =>
							handleAccreditorChange(toValue(value && !Array.isArray(value) ? value : null))
						}
					/>
					<Select
						name="commission"
						label={t('loads.courseOutcomeMappingMaintenance.filters.commission')}
						placeholder={t('loads.courseOutcomeMappingMaintenance.filters.commissionPlaceholder')}
						isSearchable
						isClearable
						isDisabled={accreditorId == null}
						options={commissionOptions}
						value={selectedOption(commissionOptions, commissionId)}
						onChange={(_name, value) =>
							handleCommissionChange(toValue(value && !Array.isArray(value) ? value : null))
						}
					/>
					<Select
						name="program"
						label={t('loads.courseOutcomeMappingMaintenance.filters.program')}
						placeholder={t('loads.courseOutcomeMappingMaintenance.filters.programPlaceholder')}
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

				{academicPeriodId == null ? (
					renderNotice(t('loads.courseOutcomeMappingMaintenance.selectPeriod'))
				) : detailedQuery.isError ? (
					<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
						<p className="text-sm text-zinc-500">
							{t('loads.courseOutcomeMappingMaintenance.error.loadFailed')}
						</p>
						<Button variant="surface" size="sm" onClick={() => detailedQuery.refetch()}>
							{t('loads.courseOutcomeMappingMaintenance.retry')}
						</Button>
					</div>
				) : detailedQuery.isLoading ? (
					<div className="space-y-2" aria-busy>
						{Array.from({ length: 6 }).map((_, index) => (
							<div key={index} className="h-12 animate-pulse rounded-lg bg-zinc-100" />
						))}
					</div>
				) : tableRows.length === 0 ? (
					renderNotice(t('loads.courseOutcomeMappingMaintenance.empty'))
				) : (
					<div
						className={
							detailedQuery.isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'
						}>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t('loads.courseOutcomeMappingMaintenance.col.accreditorCode')}
										</TableHead>
										<TableHead>
											{t('loads.courseOutcomeMappingMaintenance.col.commissionCode')}
										</TableHead>
										<TableHead>{t('loads.courseOutcomeMappingMaintenance.col.program')}</TableHead>
										<TableHead>
											{t('loads.courseOutcomeMappingMaintenance.col.academicPeriod')}
										</TableHead>
										<TableHead className="text-right">
											{t('loads.courseOutcomeMappingMaintenance.col.actions')}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tableRows.map((row) => (
										<TableRow key={row.programCommissionId}>
											<TableCell className="font-mono text-zinc-700">{row.accreditorCode}</TableCell>
											<TableCell className="font-mono text-zinc-700">{row.commissionCode}</TableCell>
											<TableCell className="text-zinc-800">
												{localized(row.programName, locale)}
											</TableCell>
											<TableCell className="font-mono text-zinc-700">
												{row.academicPeriodCode}
											</TableCell>
											<TableCell>
												<div className="flex justify-end">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => onView(row.programCommissionId)}>
														<EyeIcon className="h-4 w-4" />
														<span>{t('loads.courseOutcomeMappingMaintenance.actions.view')}</span>
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
