'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
	Button,
	buttonVariants,
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
	TableRow,
} from '@/shared/components/ui';
import { Select } from '@/shared/components/ui/Select';
import { Input } from '@/shared/components/ui/Input';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import { academicPeriodsService, typeGroupsService, typesService } from '@/modules/academic/services';
import {
	usePerformanceLevels,
	useCreatePerformanceLevel,
	useUpdatePerformanceLevel,
	useDeletePerformanceLevel,
} from '../hooks/use-performance-levels';
import type { PerformanceLevelResponse } from '@/modules/academic/api/dtos';
import type { CreatePerformanceLevelDto } from '@/modules/academic/services/performanceLevelsService';

type OptionItem = { label: string; value: number };

type FormState = {
	instrument_type_id: number;
	academic_period_id: number;
	name_es: string;
	name_en: string;
	code: string;
	unique_value: number;
	min_score: number;
	max_score: number;
	max_value: number;
	color: string;
};

const emptyForm: FormState = {
	instrument_type_id: 0,
	academic_period_id: 0,
	name_es: '',
	name_en: '',
	code: '',
	unique_value: 0,
	min_score: 0,
	max_score: 0,
	max_value: 0,
	color: '#000000',
};

function round2(n: number) {
	return Number(n.toFixed(2));
}

function formToDto(form: FormState): CreatePerformanceLevelDto {
	return {
		instrument_type_id: form.instrument_type_id,
		academic_period_id: form.academic_period_id,
		name: { es: form.name_es, en: form.name_en },
		code: form.code,
		unique_value: round2(form.unique_value),
		min_score: round2(form.min_score),
		max_score: round2(form.max_score),
		max_value: round2(form.max_value),
		extra: { color: form.color },
	};
}

function levelToForm(level: PerformanceLevelResponse): FormState {
	return {
		instrument_type_id: level.instrument_type_id,
		academic_period_id: level.academic_period_id,
		name_es: level.name?.es ?? '',
		name_en: level.name?.en ?? '',
		code: level.code,
		unique_value: Number(level.unique_value),
		min_score: Number(level.min_score),
		max_score: Number(level.max_score),
		max_value: Number(level.max_value),
		color: (level.extra as { color?: string })?.color ?? '#000000',
	};
}

function PerformanceLevelForm({
	form,
	onChange,
	instrumentTypeOptions,
	academicPeriodOptions,
}: {
	form: FormState;
	onChange: (f: FormState) => void;
	instrumentTypeOptions: OptionItem[];
	academicPeriodOptions: OptionItem[];
}) {
	const set =
		(key: keyof FormState) =>
		(e: React.ChangeEvent<HTMLInputElement>) =>
			onChange({
				...form,
				[key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value,
			});

	const selectedInstrument = instrumentTypeOptions.find((o) => o.value === form.instrument_type_id) ?? null;
	const selectedPeriod = academicPeriodOptions.find((o) => o.value === form.academic_period_id) ?? null;

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<Select
				label="Instrumento"
				options={instrumentTypeOptions}
				value={selectedInstrument}
				placeholder="Seleccionar instrumento"
				onChange={(_name, val) => {
					const opt = val as OptionItem | null;
					onChange({ ...form, instrument_type_id: opt?.value ?? 0 });
				}}
			/>
			<Select
				label="Período Académico"
				options={academicPeriodOptions}
				value={selectedPeriod}
				placeholder="Seleccionar período"
				onChange={(_name, val) => {
					const opt = val as OptionItem | null;
					onChange({ ...form, academic_period_id: opt?.value ?? 0 });
				}}
			/>

			<Input label="Nombre (ES)" value={form.name_es} onChange={set('name_es')} required />
			<Input label="Nombre (EN)" value={form.name_en} onChange={set('name_en')} required />
			<Input label="Código" value={form.code} onChange={set('code')} required />
			<Input
				label="Valor único"
				type="number"
				step="0.01"
				value={form.unique_value}
				onChange={set('unique_value')}
				required
			/>
			<Input
				label="Puntaje mínimo"
				type="number"
				step="0.01"
				value={form.min_score}
				onChange={set('min_score')}
				required
			/>
			<Input
				label="Puntaje máximo"
				type="number"
				step="0.01"
				value={form.max_score}
				onChange={set('max_score')}
				required
			/>
			<Input
				label="Valor máximo"
				type="number"
				step="0.01"
				value={form.max_value}
				onChange={set('max_value')}
				required
			/>
			<div className="flex flex-col">
				<label className="block text-base font-semibold text-zinc-900 mb-2 select-none">
					Color
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

	// Filters
	const [selectedPeriod, setSelectedPeriod] = useState<OptionItem | null>(null);
	const [selectedInstrument, setSelectedInstrument] = useState<OptionItem | null>(null);

	// Modal state
	const [modalOpen, setModalOpen] = useState(false);
	const [editingLevel, setEditingLevel] = useState<PerformanceLevelResponse | null>(null);
	const [form, setForm] = useState<FormState>(emptyForm);
	const [deleteConfirm, setDeleteConfirm] = useState<PerformanceLevelResponse | null>(null);

	// Fetch academic periods
	const { data: academicPeriods = [] } = useQuery({
		queryKey: ['academic-periods', 'all'],
		queryFn: () => academicPeriodsService.getByFilters({}).then((r) => r.data),
		staleTime: Infinity,
	});

	// Fetch instrument type group (TG206)
	const { data: typeGroups } = useQuery({
		queryKey: ['type-groups', 'TG206'],
		queryFn: () => typeGroupsService.getByFilters({ code: 'TG206' }).then((r) => r.data),
		staleTime: Infinity,
	});
	const typeGroupId = typeGroups?.[0]?.id ?? null;

	const { data: instrumentTypes = [] } = useQuery({
		queryKey: ['types', 'instrument', typeGroupId],
		queryFn: () => typesService.getByFilters({ type_group_id: typeGroupId! }).then((r) => r.data),
		enabled: typeGroupId != null,
		staleTime: Infinity,
	});

	// Performance levels
	const filters = useMemo(
		() => ({
			...(selectedPeriod?.value ? { academic_period_id: selectedPeriod.value } : {}),
			...(selectedInstrument?.value ? { instrument_type_id: selectedInstrument.value } : {}),
		}),
		[selectedPeriod, selectedInstrument],
	);

	const hasFilters = selectedPeriod != null || selectedInstrument != null;

	const {
		data: performanceLevels = [],
		isLoading,
		isError,
		error,
	} = usePerformanceLevels(filters, { enabled: hasFilters });

	const sortedLevels = useMemo(
		() => [...performanceLevels].sort((a, b) => Number(a.unique_value) - Number(b.unique_value)),
		[performanceLevels],
	);

	// Mutations
	const createMutation = useCreatePerformanceLevel();
	const updateMutation = useUpdatePerformanceLevel();
	const deleteMutation = useDeletePerformanceLevel();

	const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

	// Handlers
	function openCreateModal() {
		setEditingLevel(null);
		setForm({ ...emptyForm });
		setModalOpen(true);
	}

	function openEditModal(level: PerformanceLevelResponse) {
		setEditingLevel(level);
		setForm(levelToForm(level));
		setModalOpen(true);
	}

	function handleModalClose() {
		if (isMutating) return;
		setModalOpen(false);
		setEditingLevel(null);
	}

	async function handleSubmit() {
		const dto = formToDto(form);
		if (editingLevel) {
			await updateMutation.mutateAsync({ id: editingLevel.id, ...dto });
		} else {
			await createMutation.mutateAsync(dto);
		}
		handleModalClose();
	}

	async function handleDelete() {
		if (!deleteConfirm) return;
		await deleteMutation.mutateAsync(deleteConfirm.id);
		setDeleteConfirm(null);
	}

	function handleClearFilters() {
		setSelectedPeriod(null);
		setSelectedInstrument(null);
	}

	// Derived
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

	const academicPeriodOptions = useMemo<OptionItem[]>(
		() =>
			academicPeriods
				.filter((p) => p.is_active)
				.map((p) => ({ label: p.code, value: p.id })),
		[academicPeriods],
	);

	const academicPeriodMap = useMemo(
		() => new Map(academicPeriods.map((p) => [p.id, p])),
		[academicPeriods],
	);

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-zinc-900">
						{t('performanceLevels.list.title')}
					</h1>
					<p className="mt-2 text-zinc-600">{t('performanceLevels.list.description')}</p>
				</div>
				<Button variant="primary" size="md" onClick={openCreateModal}>
					<PlusIcon className="h-4 w-4 mr-2" />
					{t('performanceLevels.list.createButton')}
				</Button>
			</div>

			{/* Filters */}
			<div className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Select
						label={t('performanceLevels.list.periodFilter')}
						options={academicPeriodOptions}
						value={selectedPeriod}
						isClearable
						placeholder={t('performanceLevels.list.allPeriods')}
						onChange={(_name, val) => setSelectedPeriod(val as OptionItem | null)}
					/>
					<Select
						label={t('performanceLevels.list.instrumentFilter')}
						options={instrumentTypeOptions}
						value={selectedInstrument}
						isClearable
						placeholder={t('performanceLevels.list.allInstruments')}
						onChange={(_name, val) => setSelectedInstrument(val as OptionItem | null)}
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
							{t('performanceLevels.list.clearFilters')}
						</button>
					</div>
				)}
			</div>

			{/* Content */}
			{!hasFilters ? (
				<TableEmptyState message={t('performanceLevels.list.selectFilter')} />
			) : isLoading ? (
				<div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
					{t('performanceLevels.list.loading')}
				</div>
			) : isError ? (
				<TableErrorState
					message={error instanceof Error ? error.message : t('performanceLevels.list.error')}
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
								<TableHead className="text-center">
									{t('performanceLevels.table.actions')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedLevels.map((level) => {
								const color = (level.extra as { color?: string })?.color ?? '#000000';
								const instrType = instrumentTypeMap.get(level.instrument_type_id);
								const acadPeriod = academicPeriodMap.get(level.academic_period_id);
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
												{instrType?.name?.[locale as 'es' | 'en'] ??
													instrType?.code ??
													'-'}
											</span>
										</TableCell>
										<TableCell>
											<span className="text-zinc-700">{acadPeriod?.code ?? '-'}</span>
										</TableCell>
										<TableCell>
											<span className="text-zinc-700">{Number(level.unique_value).toFixed(2)}</span>
										</TableCell>
										<TableCell>
											<span className="text-zinc-700">
												{Number(level.min_score).toFixed(2)} - {Number(level.max_score).toFixed(2)} / {Number(level.max_value).toFixed(2)}
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
										<TableCell className="text-center">
											<div className="flex items-center justify-center gap-1">
												<button
													type="button"
													title="Editar"
													onClick={() => openEditModal(level)}
													className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 transition-colors hover:bg-blue-50 hover:text-blue-600">
													<PencilSquareIcon className="h-4 w-4" />
												</button>
												<button
													type="button"
													title="Eliminar"
													onClick={() => setDeleteConfirm(level)}
													className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600">
													<TrashIcon className="h-4 w-4" />
												</button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Create / Edit Modal */}
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
						academicPeriodOptions={academicPeriodOptions}
					/>

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
						<Button variant="primary" onClick={handleSubmit} disabled={isMutating}>
							{isMutating
								? t('performanceLevels.form.saving')
								: editingLevel
									? t('performanceLevels.form.update')
									: t('performanceLevels.form.create')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Modal */}
			<Dialog open={deleteConfirm != null} onOpenChange={() => setDeleteConfirm(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t('performanceLevels.delete.title')}</DialogTitle>
						<DialogDescription>
							{t('performanceLevels.delete.description')}{' '}
							<strong>
								{deleteConfirm?.name?.[locale as 'es' | 'en'] ?? deleteConfirm?.code ?? ''}
							</strong>
						</DialogDescription>
					</DialogHeader>

					{deleteMutation.isError && (
						<p className="text-sm text-red-600">
							{deleteMutation.error?.message || t('performanceLevels.form.saveError')}
						</p>
					)}

					<DialogFooter>
						<Button variant="secondary" onClick={() => setDeleteConfirm(null)} disabled={isMutating}>
							{t('performanceLevels.delete.cancel')}
						</Button>
						<Button variant="primary" onClick={handleDelete} disabled={isMutating}>
							{isMutating
								? t('performanceLevels.form.deleting')
								: t('performanceLevels.delete.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
