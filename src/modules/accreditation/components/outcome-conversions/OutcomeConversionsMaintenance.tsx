'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Card,
	ConfirmDialog,
	DataTable,
	Select,
	SubTitle,
	Title,
	Toast,
} from '@/shared';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib';
import { interpolate, localizedText, tryTranslate } from '@/shared/utils';
import { useABET, useI18n } from '@/providers';
import { useProgramCommissionsDetailed, useProgramsByModality } from '@/modules/academic';
import {
	useOutcomeConversionCoverage,
	useOutcomeConversionMutations,
	useOutcomeConversions,
	useOutcomesMaintenance,
} from '../../hooks';
import type { OutcomeConversion, OutcomeConversionFilters } from '../../types';
import { OutcomeConversionFormulaDialog } from './OutcomeConversionFormulaDialog';

// A program's outcomes across every commission of the period. Commissions carry ~7-11 outcomes
// each, so one page covers the whole program in a single request.
const OUTCOMES_PAGE_SIZE = 100;

type ConversionRow = {
	outcomeId: number;
	outcomeCode: string;
	outcomeName: string;
	conversion: OutcomeConversion | null;
};

interface OutcomeConversionsMaintenanceProps {
	/** Slot for the RV rebuild action, which belongs to the evaluation domain. */
	readonly rebuildAction?: ReactNode;
	readonly onConversionsChanged?: () => void;
}

export function OutcomeConversionsMaintenance({
	rebuildAction,
	onConversionsChanged,
}: OutcomeConversionsMaintenanceProps) {
	const { t, locale } = useI18n();
	const { academicPeriodId, modalityTypeId } = useABET();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const [programId, setProgramId] = useState<number | null>(null);
	const [sourceProgramCommissionId, setSourceProgramCommissionId] = useState<number | null>(null);
	const [targetProgramCommissionId, setTargetProgramCommissionId] = useState<number | null>(null);
	const [editingRow, setEditingRow] = useState<ConversionRow | null>(null);
	const [formulaError, setFormulaError] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<ConversionRow | null>(null);
	const [syncedScope, setSyncedScope] = useState(`${modalityTypeId}:${academicPeriodId}`);

	// The whole screen is scoped to the active period and modality (headers). When either changes
	// the program and its commissions no longer apply, so the cascade is dropped during render —
	// a useEffect would first paint one frame against the previous scope's selections.
	const scope = `${modalityTypeId}:${academicPeriodId}`;
	if (scope !== syncedScope) {
		setSyncedScope(scope);
		setProgramId(null);
		setSourceProgramCommissionId(null);
		setTargetProgramCommissionId(null);
	}

	const { data: programs = [] } = useProgramsByModality(modalityTypeId);

	const programCommissionsQuery = useProgramCommissionsDetailed(
		{ programId: programId ?? undefined },
		programId != null && academicPeriodId != null,
	);

	const outcomesQuery = useOutcomesMaintenance({
		programId,
		academicPeriodId,
		page: 1,
		pageSize: OUTCOMES_PAGE_SIZE,
		search: '',
	});

	const conversionFilters = useMemo<OutcomeConversionFilters>(
		() => ({
			sourceProgramCommissionId: sourceProgramCommissionId ?? undefined,
			targetProgramCommissionId: targetProgramCommissionId ?? undefined,
		}),
		[sourceProgramCommissionId, targetProgramCommissionId],
	);

	const conversionsQuery = useOutcomeConversions(conversionFilters, academicPeriodId);
	const coverageQuery = useOutcomeConversionCoverage(academicPeriodId);
	const { create, update, remove } = useOutcomeConversionMutations();

	const programOptions = useMemo(
		() =>
			programs.map((program) => ({
				value: program.id,
				label: localizedText(program.name, locale) || program.code,
			})),
		[programs, locale],
	);

	// get-detailed-by-filters is scoped by the period header, but the rows carry their period, so
	// they are filtered again here: a source/target must belong to the period being reported on.
	const programCommissions = useMemo(
		() =>
			(programCommissionsQuery.data ?? []).filter(
				(row) => row.academicPeriodId === academicPeriodId,
			),
		[programCommissionsQuery.data, academicPeriodId],
	);

	const commissionOptions = useMemo(
		() =>
			programCommissions.map((row) => ({
				value: row.programCommissionId,
				label: `${row.commissionCode} — ${localizedText(row.commissionName, locale)}`,
			})),
		[programCommissions, locale],
	);

	// Origin and destination must differ, so the picked source is never offered as a target.
	const targetCommissionOptions = useMemo(
		() => commissionOptions.filter((option) => option.value !== sourceProgramCommissionId),
		[commissionOptions, sourceProgramCommissionId],
	);

	const sourceCommissionCode =
		programCommissions.find((row) => row.programCommissionId === sourceProgramCommissionId)
			?.commissionCode ?? '';
	const targetCommissionCode =
		programCommissions.find((row) => row.programCommissionId === targetProgramCommissionId)
			?.commissionCode ?? '';

	const outcomes = useMemo(() => outcomesQuery.data?.items ?? [], [outcomesQuery.data]);

	const sourceOutcomes = useMemo(
		() =>
			outcomes
				.filter((outcome) => outcome.commissionCode === sourceCommissionCode)
				.map((outcome) => ({
					outcomeCode: outcome.outcomeCode,
					outcomeName: localizedText(outcome.outcomeName, locale),
				})),
		[outcomes, sourceCommissionCode, locale],
	);

	const rows = useMemo<ConversionRow[]>(() => {
		if (targetCommissionCode === '') return [];

		const conversionByOutcomeId = new Map(
			(conversionsQuery.data ?? []).map((conversion) => [conversion.targetOutcomeId, conversion]),
		);
		const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

		return outcomes
			.filter((outcome) => outcome.commissionCode === targetCommissionCode)
			.map((outcome) => ({
				outcomeId: outcome.id,
				outcomeCode: outcome.outcomeCode,
				outcomeName: localizedText(outcome.outcomeName, locale),
				conversion: conversionByOutcomeId.get(outcome.id) ?? null,
			}))
			.sort((a, b) => collator.compare(a.outcomeCode, b.outcomeCode));
	}, [outcomes, targetCommissionCode, conversionsQuery.data, locale]);

	const coverage = useMemo(
		() =>
			(coverageQuery.data ?? []).find(
				(entry) => entry.targetProgramCommissionId === targetProgramCommissionId,
			),
		[coverageQuery.data, targetProgramCommissionId],
	);

	const hasSelection =
		academicPeriodId != null &&
		programId != null &&
		sourceProgramCommissionId != null &&
		targetProgramCommissionId != null;

	const handleProgramChange = (value: number | null) => {
		setProgramId(value);
		setSourceProgramCommissionId(null);
		setTargetProgramCommissionId(null);
	};

	const handleSourceChange = (value: number | null) => {
		setSourceProgramCommissionId(value);
		if (value != null && value === targetProgramCommissionId) setTargetProgramCommissionId(null);
	};

	const openFormulaDialog = (row: ConversionRow) => {
		setFormulaError(null);
		setEditingRow(row);
	};

	const handleSubmitFormula = async (formula: string) => {
		if (!editingRow || sourceProgramCommissionId == null || targetProgramCommissionId == null) {
			return;
		}
		setFormulaError(null);

		try {
			if (editingRow.conversion) {
				await update.mutateAsync({ id: editingRow.conversion.id, body: { formula } });
				showToast('outcomeConversions.toast.updated', 'success');
			} else {
				await create.mutateAsync({
					sourceProgramCommissionId,
					targetProgramCommissionId,
					targetOutcomeId: editingRow.outcomeId,
					formula,
				});
				showToast('outcomeConversions.toast.created', 'success');
			}
			setEditingRow(null);
			onConversionsChanged?.();
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setFormulaError(
				tryTranslate(t, reason ?? getErrorMessage(error, 'outcomeConversions.error.saveFailed')),
			);
		}
	};

	const handleConfirmDelete = async () => {
		if (!pendingDelete?.conversion) return;

		try {
			await remove.mutateAsync(pendingDelete.conversion.id);
			showToast('outcomeConversions.toast.deleted', 'success');
			setPendingDelete(null);
			onConversionsChanged?.();
		} catch (error) {
			setPendingDelete(null);
			showToast(getErrorMessage(error, 'outcomeConversions.error.deleteFailed'), 'error');
		}
	};

	const editLabel = t('outcomeConversions.actions.edit');
	const createLabel = t('outcomeConversions.actions.create');
	const deleteLabel = t('outcomeConversions.actions.delete');

	const columns = useMemo<ColumnDef<ConversionRow>[]>(
		() => [
			{
				accessorKey: 'outcomeCode',
				header: t('outcomeConversions.table.targetOutcome'),
				meta: { cellClassName: 'font-mono font-semibold text-zinc-800' },
			},
			{
				accessorKey: 'outcomeName',
				header: t('outcomeConversions.table.outcomeName'),
				cell: ({ row }) => (
					<span className="line-clamp-2 max-w-xs text-zinc-600">{row.original.outcomeName}</span>
				),
			},
			{
				id: 'formula',
				header: t('outcomeConversions.table.formula'),
				accessorFn: (row) => row.conversion?.formula ?? '',
				cell: ({ row }) =>
					row.original.conversion ? (
						<span className="font-mono text-zinc-800">{row.original.conversion.formula}</span>
					) : (
						<span className="text-zinc-400">{t('outcomeConversions.table.noFormula')}</span>
					),
			},
			{
				id: 'referencedOutcomeCodes',
				header: t('outcomeConversions.table.references'),
				enableGlobalFilter: false,
				cell: ({ row }) => {
					const references = row.original.conversion?.referencedOutcomeCodes ?? [];
					if (references.length === 0) return null;
					return (
						<div className="flex flex-wrap gap-1">
							{references.map((code) => (
								<Badge key={code} variant="outline" className="font-mono">
									{code}
								</Badge>
							))}
						</div>
					);
				},
			},
			{
				id: 'actions',
				header: t('outcomeConversions.table.actions'),
				enableGlobalFilter: false,
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => {
					const hasConversion = row.original.conversion != null;
					return (
						<div className="flex items-center justify-end gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
								onClick={() => openFormulaDialog(row.original)}
								aria-label={hasConversion ? editLabel : createLabel}
								title={hasConversion ? editLabel : createLabel}>
								{hasConversion ? (
									<PencilSquareIcon className="h-5 w-5" />
								) : (
									<PlusIcon className="h-5 w-5" />
								)}
							</Button>
							{hasConversion && (
								<Button
									variant="ghost"
									size="icon"
									className="text-red-600 hover:bg-red-50"
									onClick={() => setPendingDelete(row.original)}
									aria-label={deleteLabel}
									title={deleteLabel}>
									<TrashIcon className="h-5 w-5" />
								</Button>
							)}
						</div>
					);
				},
			},
		],
		[t, editLabel, createLabel, deleteLabel],
	);

	const emptyMessage =
		academicPeriodId == null
			? t('outcomeConversions.selectPeriod')
			: programId == null
				? t('outcomeConversions.selectProgram')
				: !hasSelection
					? t('outcomeConversions.selectCommissions')
					: t('outcomeConversions.empty');

	const isLoading =
		hasSelection && (conversionsQuery.isLoading || outcomesQuery.isLoading) && rows.length === 0;

	return (
		<Card>
			<div className="space-y-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-1">
						<Title
							title={t('outcomeConversions.title')}
							className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900"
						/>
						<SubTitle
							name={t('outcomeConversions.subtitle')}
							className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-zinc-500"
						/>
					</div>
					{rebuildAction && <div className="shrink-0">{rebuildAction}</div>}
				</div>

				{hasSelection && coverage && coverage.missingOutcomeCodes.length > 0 && (
					<Alert variant="warning">
						<AlertTitle>
							{interpolate(t('outcomeConversions.coverage.title'), {
								targetCommission: coverage.targetCommissionCode,
							})}
						</AlertTitle>
						<AlertDescription>
							{interpolate(t('outcomeConversions.coverage.description'), {
								mapped: coverage.mappedOutcomes,
								total: coverage.totalOutcomes,
								codes: coverage.missingOutcomeCodes.join(', '),
							})}
						</AlertDescription>
					</Alert>
				)}

				<DataTable
					columns={columns}
					data={hasSelection ? rows : []}
					aria-label={t('outcomeConversions.title')}
					searchPlaceholder={t('outcomeConversions.searchPlaceholder')}
					isLoading={isLoading}
					isFetching={conversionsQuery.isFetching}
					errorMessage={
						conversionsQuery.isError || outcomesQuery.isError
							? t('outcomeConversions.error.loadFailed')
							: undefined
					}
					emptyMessage={emptyMessage}
					filters={
						<>
							<div className="w-full sm:w-56">
								<Select
									name="program"
									aria-label={t('outcomeConversions.filters.program')}
									placeholder={t('outcomeConversions.filters.programPlaceholder')}
									isSearchable
									isClearable
									isDisabled={academicPeriodId == null}
									options={programOptions}
									value={programOptions.find((option) => option.value === programId) ?? null}
									onChange={(_name, value) =>
										handleProgramChange(value && !Array.isArray(value) ? Number(value.value) : null)
									}
								/>
							</div>
							<div className="w-full sm:w-56">
								<Select
									name="sourceCommission"
									aria-label={t('outcomeConversions.filters.sourceCommission')}
									placeholder={t('outcomeConversions.filters.sourceCommissionPlaceholder')}
									isSearchable
									isClearable
									isDisabled={programId == null || programCommissionsQuery.isLoading}
									options={commissionOptions}
									value={
										commissionOptions.find(
											(option) => option.value === sourceProgramCommissionId,
										) ?? null
									}
									onChange={(_name, value) =>
										handleSourceChange(value && !Array.isArray(value) ? Number(value.value) : null)
									}
								/>
							</div>
							<div className="w-full sm:w-56">
								<Select
									name="targetCommission"
									aria-label={t('outcomeConversions.filters.targetCommission')}
									placeholder={t('outcomeConversions.filters.targetCommissionPlaceholder')}
									isSearchable
									isClearable
									isDisabled={sourceProgramCommissionId == null}
									options={targetCommissionOptions}
									value={
										targetCommissionOptions.find(
											(option) => option.value === targetProgramCommissionId,
										) ?? null
									}
									onChange={(_name, value) =>
										setTargetProgramCommissionId(
											value && !Array.isArray(value) ? Number(value.value) : null,
										)
									}
								/>
							</div>
						</>
					}
				/>
			</div>

			{editingRow && (
				<OutcomeConversionFormulaDialog
					targetOutcomeCode={editingRow.outcomeCode}
					targetCommissionCode={targetCommissionCode}
					sourceCommissionCode={sourceCommissionCode}
					sourceOutcomes={sourceOutcomes}
					sourceOutcomesLoading={outcomesQuery.isLoading}
					conversion={editingRow.conversion}
					saving={create.isPending || update.isPending}
					errorMessage={formulaError}
					onClose={() => setEditingRow(null)}
					onSubmit={handleSubmitFormula}
				/>
			)}

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('outcomeConversions.delete.title')}
				message={interpolate(t('outcomeConversions.delete.message'), {
					targetOutcome: pendingDelete?.outcomeCode ?? '',
				})}
				confirmLabel={t('outcomeConversions.actions.delete')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirmDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={remove.isPending}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</Card>
	);
}
