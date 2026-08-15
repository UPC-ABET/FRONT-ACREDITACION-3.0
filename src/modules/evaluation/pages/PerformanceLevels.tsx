'use client';

import { useMemo, useState } from 'react';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	DeleteConfirmDialog,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	Table,
	TableBody,
	TableCell,
	TableEmptyState,
	TableErrorState,
	TableHead,
	TableHeader,
	TableLoadingState,
	TableRow,
} from '@/shared/components/ui';
import { Select } from '@/shared/components/ui/Select';
import { Input } from '@/shared/components/ui/Input';
import { tryTranslate } from '@/shared/utils';
import { useI18n, useABET } from '@/providers';
import {
	useAcademicPeriods,
	usePerformanceLevels,
	useCreatePerformanceLevel,
	useUpdatePerformanceLevel,
	useDeletePerformanceLevel,
	usePerformanceLevelForm,
} from '@/modules/academic/hooks';
import { useTypeGroups, useTypes } from '@/modules/core/hooks';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { DEFAULT_PERFORMANCE_LEVEL_COLOR } from '@/modules/academic/constants';
import { performanceLevelFormSchema } from '@/modules/academic/schemas';
import type { PerformanceLevelFormState } from '@/modules/academic/schemas';
import { PerformanceLevelResponse } from '@/modules/academic';

type OptionItem = { label: string; value: number };

function PerformanceLevelForm({
	form,
	onChange,
	instrumentTypeOptions,
}: {
	form: PerformanceLevelFormState;
	onChange: (f: PerformanceLevelFormState) => void;
	instrumentTypeOptions: OptionItem[];
}) {
	const { t } = useI18n();

	const set = (key: keyof PerformanceLevelFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
		onChange({
			...form,
			[key]:
				e.target.type === 'number'
					? e.target.value === ''
						? ''
						: Number(e.target.value)
					: e.target.value,
		});

	const selectedInstrument =
		instrumentTypeOptions.find((o) => o.value === form.instrumentTypeId) ?? null;

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<Select
				label={t('performanceLevels.form.instrument')}
				options={instrumentTypeOptions}
				value={selectedInstrument}
				isSearchable
				placeholder={t('performanceLevels.form.instrumentPlaceholder')}
				onChange={(_name, val) => {
					const opt = val as OptionItem | null;
					onChange({ ...form, instrumentTypeId: opt?.value ?? 0 });
				}}
			/>
			<Input
				label={t('performanceLevels.form.nameEs')}
				value={form.nameEs}
				onChange={set('nameEs')}
				required
			/>
			<Input
				label={t('performanceLevels.form.nameEn')}
				value={form.nameEn}
				onChange={set('nameEn')}
				required
			/>
			<Input
				label={t('performanceLevels.form.code')}
				value={form.code}
				onChange={set('code')}
				required
			/>
			<Input
				label={t('performanceLevels.form.uniqueValue')}
				type="number"
				step="0.01"
				value={form.uniqueValue}
				onChange={set('uniqueValue')}
				required
			/>
			<Input
				label={t('performanceLevels.form.minScore')}
				type="number"
				step="0.01"
				min="0"
				value={form.minScore}
				onChange={set('minScore')}
				required
			/>
			<Input
				label={t('performanceLevels.form.maxScore')}
				type="number"
				step="0.01"
				min="0"
				value={form.maxScore}
				onChange={set('maxScore')}
				required
			/>
			<Input
				label={t('performanceLevels.form.maxValue')}
				type="number"
				step="0.01"
				min="0"
				value={form.maxValue}
				onChange={set('maxValue')}
				required
			/>
			<div className="flex flex-col">
				<label className="block text-base font-semibold text-zinc-900 mb-2 select-none">
					{t('performanceLevels.form.color')}
				</label>
				<input
					type="color"
					value={form.color}
					onChange={(e) => onChange({ ...form, color: e.target.value })}
					className="h-10 w-full rounded-md border border-zinc-200 bg-white p-1 cursor-pointer"
				/>
			</div>
		</div>
	);
}

export function PerformanceLevelsPage() {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();

	const [selectedInstrument, setSelectedInstrument] = useState<OptionItem | null>(null);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingLevel, setEditingLevel] = useState<PerformanceLevelResponse | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<PerformanceLevelResponse | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const { form, setForm, resetForm, populateForm, toDto } = usePerformanceLevelForm();

	const { data: academicPeriods = [] } = useAcademicPeriods({});

	const { data: typeGroups } = useTypeGroups({
		code: TYPE_GROUP_CODES.PERFORMANCE_LEVEL_INSTRUMENT,
	});
	const typeGroupId = typeGroups?.[0]?.id ?? null;

	const { data: instrumentTypes = [] } = useTypes(
		{ typeGroupId: typeGroupId ?? undefined },
		{ enabled: typeGroupId != null },
	);

	const filters = useMemo(
		() => ({
			...(academicPeriodId ? { academicPeriodId } : {}),
			...(selectedInstrument?.value ? { instrumentTypeId: selectedInstrument.value } : {}),
		}),
		[academicPeriodId, selectedInstrument],
	);

	const hasPeriod = academicPeriodId != null;

	const {
		data: performanceLevels = [],
		isLoading,
		isError,
		error,
	} = usePerformanceLevels(filters, { enabled: hasPeriod });

	const sortedLevels = useMemo(
		() => [...performanceLevels].sort((a, b) => Number(a.uniqueValue) - Number(b.uniqueValue)),
		[performanceLevels],
	);

	const createMutation = useCreatePerformanceLevel();
	const updateMutation = useUpdatePerformanceLevel();
	const deleteMutation = useDeletePerformanceLevel();

	const isMutating =
		createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

	function openCreateModal() {
		setEditingLevel(null);
		resetForm(academicPeriodId ?? 0);
		setFormError(null);
		setModalOpen(true);
	}

	function openEditModal(level: PerformanceLevelResponse) {
		setEditingLevel(level);
		populateForm(level);
		setFormError(null);
		setModalOpen(true);
	}

	function handleModalClose() {
		if (isMutating) return;
		setModalOpen(false);
		setEditingLevel(null);
	}

	async function handleSubmit() {
		const result = performanceLevelFormSchema.safeParse(form);
		if (!result.success) {
			setFormError(tryTranslate(t, result.error.issues[0].message));
			return;
		}
		setFormError(null);

		if (editingLevel) {
			await updateMutation.mutateAsync({ id: editingLevel.id, ...toDto() });
		} else {
			await createMutation.mutateAsync(toDto());
		}
		handleModalClose();
	}

	async function handleDelete() {
		if (!deleteConfirm) return;
		await deleteMutation.mutateAsync(deleteConfirm.id);
		setDeleteConfirm(null);
	}

	function handleClearFilters() {
		setSelectedInstrument(null);
	}

	const instrumentTypeOptions = useMemo<OptionItem[]>(
		() =>
			instrumentTypes.map((t) => ({
				label: t.name?.[locale as 'es' | 'en'] ?? t.name?.es ?? t.code,
				value: t.id,
			})),
		[instrumentTypes, locale],
	);

	const instrumentTypeMap = useMemo(
		() => new Map(instrumentTypes.map((t) => [t.id, t])),
		[instrumentTypes],
	);

	const academicPeriodMap = useMemo(
		() => new Map(academicPeriods.map((p) => [p.id, p])),
		[academicPeriods],
	);

	return (
		<div className="space-y-6">
			<div className="flex justify-end">
				<Button variant="primary" size="md" onClick={openCreateModal} disabled={!hasPeriod}>
					<PlusIcon className="h-4 w-4 mr-2" />
					{t('performanceLevels.list.createButton')}
				</Button>
			</div>

			<Card>
				<div className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Select
							label={t('performanceLevels.list.instrumentFilter')}
							options={instrumentTypeOptions}
							value={selectedInstrument}
							isClearable
							isSearchable
							placeholder={t('performanceLevels.list.allInstruments')}
							onChange={(_name, val) => setSelectedInstrument(val as OptionItem | null)}
						/>
					</div>

					{selectedInstrument != null && (
						<div className="flex justify-end">
							<Button variant="secondary" onClick={handleClearFilters}>
								<TrashIcon className="h-4 w-4" />
								{t('performanceLevels.list.clearFilters')}
							</Button>
						</div>
					)}
				</div>
			</Card>

			{!hasPeriod ? (
				<TableEmptyState message={t('performanceLevels.list.selectFilter')} />
			) : isLoading ? (
				<TableLoadingState label={t('performanceLevels.list.loading')} />
			) : isError ? (
				<TableErrorState
					message={
						error instanceof Error
							? tryTranslate(t, error.message)
							: t('performanceLevels.list.error')
					}
				/>
			) : !sortedLevels.length ? (
				<TableEmptyState message={t('performanceLevels.list.empty')} />
			) : (
				<div className="space-y-3">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t('performanceLevels.table.code')}</TableHead>
								<TableHead>{t('performanceLevels.table.name')}</TableHead>
								<TableHead>{t('performanceLevels.table.instrument')}</TableHead>
								<TableHead>{t('performanceLevels.table.period')}</TableHead>
								<TableHead>{t('performanceLevels.table.uniqueValue')}</TableHead>
								<TableHead>{t('performanceLevels.table.scoreRange')}</TableHead>
								<TableHead>{t('performanceLevels.table.color')}</TableHead>
								<TableHead className="text-right">{t('performanceLevels.table.actions')}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedLevels.map((level) => {
								const color =
									(level.extra as { color?: string })?.color ?? DEFAULT_PERFORMANCE_LEVEL_COLOR;
								const instrType = instrumentTypeMap.get(level.instrumentTypeId);
								const acadPeriod = academicPeriodMap.get(level.academicPeriodId);
								return (
									<TableRow key={level.id}>
										<TableCell>
											<span className="font-medium text-zinc-900">{level.code}</span>
										</TableCell>
										<TableCell>
											<span className="text-zinc-700">
												{level.name?.[locale as 'es' | 'en'] ?? level.name?.es}
											</span>
										</TableCell>
										<TableCell>
											<span className="text-zinc-700">
												{instrType?.name?.[locale as 'es' | 'en'] ?? instrType?.code ?? '-'}
											</span>
										</TableCell>
										<TableCell>
											<span className="text-zinc-700">{acadPeriod?.code ?? '-'}</span>
										</TableCell>
										<TableCell>
											<span className="text-zinc-700">{Number(level.uniqueValue).toFixed(2)}</span>
										</TableCell>
										<TableCell>
											<span className="text-zinc-700">
												{Number(level.minScore).toFixed(2)} - {Number(level.maxScore).toFixed(2)} /{' '}
												{Number(level.maxValue).toFixed(2)}
											</span>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<span
													className="inline-block h-5 w-5 rounded-full border border-zinc-200"
													style={{ backgroundColor: color }}
												/>
												<span className="text-xs text-zinc-500 font-mono">{color}</span>
											</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
													title={t('performanceLevels.table.edit')}
													aria-label={t('performanceLevels.table.edit')}
													onClick={() => openEditModal(level)}>
													<PencilSquareIcon className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-zinc-500 hover:bg-red-50 hover:text-red-600"
													title={t('performanceLevels.table.delete')}
													aria-label={t('performanceLevels.table.delete')}
													onClick={() => setDeleteConfirm(level)}>
													<TrashIcon className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}

			<Dialog open={modalOpen} onOpenChange={handleModalClose}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{editingLevel
								? t('performanceLevels.form.editTitle')
								: t('performanceLevels.form.createTitle')}
						</DialogTitle>
						<DialogDescription>
							{editingLevel
								? t('performanceLevels.form.editDescription')
								: t('performanceLevels.form.createDescription')}
						</DialogDescription>
					</DialogHeader>

					<PerformanceLevelForm
						form={form}
						onChange={setForm}
						instrumentTypeOptions={instrumentTypeOptions}
					/>

					{formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
					{createMutation.isError && (
						<p className="text-sm text-red-600 mt-2">
							{createMutation.error?.message || t('performanceLevels.form.saveError')}
						</p>
					)}
					{updateMutation.isError && (
						<p className="text-sm text-red-600 mt-2">
							{updateMutation.error?.message || t('performanceLevels.form.saveError')}
						</p>
					)}

					<DialogFooter>
						<Button variant="secondary" onClick={handleModalClose} disabled={isMutating}>
							{t('performanceLevels.form.cancel')}
						</Button>
						<Button
							variant="primary"
							onClick={handleSubmit}
							disabled={isMutating}
							loading={isMutating}>
							{editingLevel
								? t('performanceLevels.form.update')
								: t('performanceLevels.form.create')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<DeleteConfirmDialog
				open={deleteConfirm != null}
				onOpenChange={() => setDeleteConfirm(null)}
				contentClassName="sm:max-w-md"
				title={t('performanceLevels.delete.title')}
				description={
					<>
						{t('performanceLevels.delete.description')}{' '}
						<strong>
							{deleteConfirm?.name?.[locale as 'es' | 'en'] ?? deleteConfirm?.code ?? ''}
						</strong>
					</>
				}
				error={
					deleteMutation.isError
						? deleteMutation.error?.message || t('performanceLevels.form.saveError')
						: null
				}
				isPending={isMutating}
				cancelLabel={t('performanceLevels.delete.cancel')}
				confirmLabel={t('performanceLevels.delete.confirm')}
				pendingLabel={t('performanceLevels.form.deleting')}
				onConfirm={handleDelete}
			/>
		</div>
	);
}
