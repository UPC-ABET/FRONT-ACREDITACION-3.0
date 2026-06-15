'use client';

import React, { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
	DataTable,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	Input,
	TextArea,
	Select,
	Toggle,
	Toast,
} from '@/shared/components';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import type { CompetenceConfig, CompetenceFormData } from '../../types';
import { competenceSchema } from '../../schemas/competenceSchema';
import { MIN_PERFORMANCE_LEVEL, MAX_PERFORMANCE_LEVEL } from '../../constants/competence';
import { listGRAOutcomes } from '../../services/graService';

interface ProgramOutcomeOption {
	value: number;
	label: string;
	commissionId: number;
	commissionName: string;
}

interface CompetenceCRUDProps {
	cycleId: number;
	programId?: number;
	competences: CompetenceConfig[];
	loading: boolean;
	error: string | null;
	onLoad: (cycleId: number, programId?: number) => void;
	onSave: (data: CompetenceFormData, onSuccess: () => void) => void;
	onDelete: (id: number, onSuccess: () => void) => void;
	onClone?: (
		params: {
			sourceProgramId: number;
			sourcePeriodId: number;
			targetProgramId: number;
			targetPeriodId: number;
		},
		onSuccess: () => void,
	) => void;
	showCloneOption?: boolean;
}

const EMPTY_FORM: Omit<CompetenceFormData, 'academicPeriodId' | 'school'> = {
	id: 0,
	outcomeId: undefined,
	generalCompetence: '',
	specificCompetence: '',
	description: '',
	descriptionEn: '',
	performanceLevel: 1,
	isVisible: true,
};

export function CompetenceCRUD({
	cycleId,
	programId,
	competences,
	loading,
	error,
	onLoad,
	onSave,
	onDelete,
}: CompetenceCRUDProps) {
	const { t } = useI18n();
	const [modalOpen, setModalOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [form, setForm] = useState(EMPTY_FORM);
	const [saving, setSaving] = useState(false);
	const [outcomeOptions, setOutcomeOptions] = useState<ProgramOutcomeOption[]>([]);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		if (cycleId) onLoad(cycleId, programId);
	}, [cycleId, programId, onLoad]);

	useEffect(() => {
		if (!programId || !cycleId) {
			setOutcomeOptions([]);
			return;
		}
		listGRAOutcomes({ programId, academicPeriodId: cycleId })
			.then((groups) => {
				const options: ProgramOutcomeOption[] = groups.flatMap((group) =>
					(group.outcomes ?? []).map((o) => ({
						value: o.outcomeId,
						label: `${group.commissionName} — ${o.outcomeCode}`,
						commissionId: group.commissionId,
						commissionName: group.commissionName,
					})),
				);
				setOutcomeOptions(options);
			})
			.catch(() => setOutcomeOptions([]));
	}, [programId, cycleId]);

	function openAdd() {
		setForm(EMPTY_FORM);
		setModalOpen(true);
	}

	function openEdit(row: CompetenceConfig) {
		setForm({
			id: row.id,
			outcomeId: row.outcomeId,
			generalCompetence: row.generalCompetence,
			specificCompetence: row.specificCompetence,
			description: row.description,
			descriptionEn: row.descriptionEn ?? '',
			performanceLevel: row.performanceLevel,
			isVisible: row.isVisible ?? true,
		});
		setModalOpen(true);
	}

	function handleSave() {
		const parsed = competenceSchema.safeParse(form);
		if (!parsed.success) {
			setToast({ open: true, type: 'error', msg: t(parsed.error.issues[0].message) });
			return;
		}
		setSaving(true);
		onSave({ ...form, academicPeriodId: cycleId, school: '1', programId }, () => {
			setSaving(false);
			setModalOpen(false);
			setToast({ open: true, type: 'success', msg: t('surveys.competence.toast.saved') });
			onLoad(cycleId);
		});
		setSaving(false);
	}

	function handleDelete(id: number) {
		onDelete(id, () => {
			setDeleteId(null);
			setToast({ open: true, type: 'success', msg: t('surveys.competence.toast.deleted') });
			onLoad(cycleId);
		});
	}

	const isSpecific = (item: CompetenceConfig) => item.outcomeId != null && item.outcomeId !== 1;

	const selectedOutcome = outcomeOptions.find((o) => o.value === form.outcomeId) ?? null;

	const columns: ColumnDef<CompetenceConfig>[] = [
		{
			accessorKey: 'performanceLevel',
			header: t('surveys.competence.table.order'),
			cell: ({ getValue }) => (
				<span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold">
					{getValue() as number}
				</span>
			),
		},
		{
			id: 'type',
			header: t('surveys.competence.table.type'),
			cell: ({ row }) => (
				<span
					className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
						isSpecific(row.original) ? 'bg-red-50 text-red-700' : 'bg-zinc-100 text-zinc-600'
					}`}>
					{isSpecific(row.original)
						? t('surveys.competence.type.specific')
						: t('surveys.competence.type.general')}
				</span>
			),
		},
		{
			accessorKey: 'generalCompetence',
			header: t('surveys.competence.table.nameEs'),
		},
		{
			accessorKey: 'specificCompetence',
			header: t('surveys.competence.table.nameEn'),
		},
		{
			accessorKey: 'description',
			header: t('surveys.competence.table.description'),
			cell: ({ getValue }) => (
				<span className="max-w-xs block truncate">{getValue() as string}</span>
			),
		},
		{
			id: 'visible',
			header: t('surveys.competence.table.visible'),
			cell: ({ row }) => (
				<span
					className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
						row.original.isVisible !== false
							? 'bg-green-50 text-green-700'
							: 'bg-zinc-100 text-zinc-500'
					}`}>
					{row.original.isVisible !== false
						? t('surveys.competence.visible.yes')
						: t('surveys.competence.visible.no')}
				</span>
			),
		},
		{
			id: 'actions',
			header: t('surveys.competence.table.actions'),
			cell: ({ row }) => (
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="surface"
						onClick={() => openEdit(row.original)}
						aria-label={t('surveys.competence.actions.edit')}>
						<PencilSquareIcon className="h-4 w-4" />
					</Button>
					<Button
						size="sm"
						variant="warning"
						onClick={() => setDeleteId(row.original.id)}
						aria-label={t('surveys.competence.actions.delete')}>
						<TrashIcon className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	];

	const isEditingSpecific = form.outcomeId != null && form.outcomeId !== 1;
	const modalTitle =
		form.id === 0
			? isEditingSpecific
				? t('surveys.competence.modal.addSpecificTitle')
				: t('surveys.competence.modal.addTitle')
			: isEditingSpecific
				? t('surveys.competence.modal.editSpecificTitle')
				: t('surveys.competence.modal.editTitle');

	return (
		<div className="space-y-4">
			{error && (
				<p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
					{tryTranslate(t, error)}
				</p>
			)}

			<DataTable
				columns={columns}
				data={competences}
				title={t('surveys.competence.table.title')}
				actions={[
					{
						label: t('surveys.competence.add'),
						onClick: openAdd,
						icon: <PlusIcon className="h-4 w-4" />,
					},
				]}
			/>

			<Dialog open={modalOpen} onOpenChange={setModalOpen}>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>{modalTitle}</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Orden + Visibilidad */}
						<div className="flex items-end gap-4">
							<div className="w-28">
								<label className="font-medium text-xs mb-1.5 text-zinc-700 block">
									{t('surveys.competence.modal.orderLabel')}
								</label>
								<input
									type="number"
									min={MIN_PERFORMANCE_LEVEL}
									max={MAX_PERFORMANCE_LEVEL}
									value={form.performanceLevel}
									onChange={(e) =>
										setForm({
											...form,
											performanceLevel: Math.min(
												MAX_PERFORMANCE_LEVEL,
												Math.max(MIN_PERFORMANCE_LEVEL, Number(e.target.value)),
											),
										})
									}
									className="w-full h-9 rounded-md border border-zinc-200 px-3 text-sm focus:outline-none focus:border-red-500"
								/>
							</div>
							<div className="flex-1 pb-0.5">
								<Toggle
									label={t('surveys.competence.modal.visibleLabel')}
									checked={form.isVisible ?? true}
									onChange={(checked) => setForm({ ...form, isVisible: checked })}
								/>
							</div>
						</div>

						{/* Nombre en español */}
						<Input
							label={t('surveys.competence.modal.nameEsLabel')}
							value={form.generalCompetence}
							onChange={(e) => setForm({ ...form, generalCompetence: e.target.value })}
							placeholder={t('surveys.competence.modal.nameEsPlaceholder')}
						/>

						{/* Descripción en español */}
						<TextArea
							label={t('surveys.competence.modal.descriptionEsLabel')}
							value={form.description}
							onChange={(e) => setForm({ ...form, description: e.target.value })}
							placeholder={t('surveys.competence.modal.descriptionEsPlaceholder')}
							rows={2}
						/>

						{/* Nombre en inglés */}
						<Input
							label={t('surveys.competence.modal.nameEnLabel')}
							value={form.specificCompetence}
							onChange={(e) => setForm({ ...form, specificCompetence: e.target.value })}
							placeholder={t('surveys.competence.modal.nameEnPlaceholder')}
						/>

						{/* Descripción en inglés */}
						<TextArea
							label={t('surveys.competence.modal.descriptionEnLabel')}
							value={form.descriptionEn ?? ''}
							onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
							placeholder={t('surveys.competence.modal.descriptionEnPlaceholder')}
							rows={2}
						/>

						{/* Outcome (competencia específica) */}
						{outcomeOptions.length > 0 && (
							<Select
								name="outcomeId"
								label={t('surveys.competence.modal.outcomeLabel')}
								placeholder={t('surveys.competence.modal.outcomePlaceholder')}
								isSearchable
								isClearable
								options={outcomeOptions}
								value={selectedOutcome}
								onChange={(_name, value) =>
									setForm({
										...form,
										outcomeId: value && !Array.isArray(value) ? Number(value.value) : undefined,
									})
								}
							/>
						)}
					</div>

					<DialogFooter showCloseButton>
						<Button onClick={handleSave} disabled={saving} loading={saving}>
							{t('surveys.competence.modal.save')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('surveys.competence.modal.deleteTitle')}</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-zinc-600 py-2">{t('surveys.competence.modal.deleteBody')}</p>
					<DialogFooter showCloseButton>
						<Button variant="warning" onClick={() => deleteId !== null && handleDelete(deleteId)}>
							{t('surveys.competence.modal.delete')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
